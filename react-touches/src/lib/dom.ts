// Small helpers for wiring HTML files to TypeScript. No framework, no virtual DOM.

type ElementClass = abstract new (...args: never[]) => Element

/**
 * The "interface" of an HTML file: the elements a controller needs, by data-ref.
 *
 *   <ul data-ref="list"></ul>     →   const $ = refs(root, { list: HTMLUListElement })
 *                                     $.list  // typed as HTMLUListElement
 *
 * Throws on load if an element is missing or is the wrong tag, so a renamed or deleted
 * element in the HTML shows up immediately instead of as `null` somewhere later.
 */
export function refs<S extends Record<string, ElementClass>>(
  root: ParentNode,
  spec: S,
): { [K in keyof S]: InstanceType<S[K]> } {
  const out: Record<string, Element> = {}
  const problems: string[] = []
  for (const [name, type] of Object.entries(spec)) {
    const el: Element | null = root.querySelector(`[data-ref="${name}"]`)
    if (!el) {
      problems.push(`missing data-ref="${name}"`)
      continue
    }
    const tag = el.tagName.toLowerCase() // read before the instanceof check narrows `el`
    if (el instanceof type) out[name] = el
    else problems.push(`data-ref="${name}" is <${tag}>, expected ${type.name}`)
  }
  if (problems.length) throw new Error(`HTML does not match its interface:\n  ${problems.join('\n  ')}`)
  return out as { [K in keyof S]: InstanceType<S[K]> }
}

/** Makes any value safe to put inside HTML. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

/**
 * Replaces {{ key }} and {{ a.b }} in a template with escaped values from `data`.
 * Missing keys become an empty string. Use {{{ key }}} for trusted HTML (no escaping).
 */
export function fill(template: string, data: object): string {
  const get = (path: string) =>
    path.split('.').reduce<unknown>((v, k) => (v == null ? undefined : (v as Record<string, unknown>)[k]), data)
  return template
    .replace(/\{\{\{\s*([\w.]+)\s*\}\}\}/g, (_, path) => String(get(path) ?? ''))
    .replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => escapeHtml(get(path)))
}

/**
 * Renders one copy of a <template> per item into `target`.
 *
 *   <ul data-ref="list"></ul>
 *   <template data-ref="row"><li>{{ name }}</li></template>
 *
 *   renderList($.list, $.row, patients)
 *   renderList($.list, $.row, patients, (p) => ({ ...p, label: p.name.toUpperCase() }))
 */
export function renderList<T>(
  target: Element,
  template: HTMLTemplateElement,
  items: readonly T[],
  map: (item: T) => object = (item) => item as object,
  empty = '',
): void {
  target.innerHTML = items.length ? items.map((item) => fill(template.innerHTML, map(item))).join('') : empty
}

/**
 * Event delegation: one listener on `root` for every current and future element matching
 * `selector`. Works for rows rendered later with renderList.
 *
 *   on(root, 'click', '[data-action="delete"]', (e, button) => …, signal)
 */
export function on<K extends keyof HTMLElementEventMap>(
  root: HTMLElement,
  type: K,
  selector: string,
  handler: (event: HTMLElementEventMap[K], element: HTMLElement) => void,
  signal?: AbortSignal,
): void {
  root.addEventListener(
    type,
    (event) => {
      const element = (event.target as Element | null)?.closest<HTMLElement>(selector)
      if (element && root.contains(element)) handler(event, element)
    },
    { signal },
  )
}

/** A form's fields as a plain object: { name: 'Nadia', age: '34', … } (all strings). */
export function formValues(form: HTMLFormElement): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of new FormData(form)) if (typeof value === 'string') out[key] = value
  return out
}

/**
 * Shows ApiResult.fieldErrors next to the inputs, in elements marked data-error-for="<field>".
 * Clears the previous errors first. Errors with no matching element go to data-error-for="_".
 */
export function showErrors(form: HTMLFormElement, fieldErrors: Record<string, string>): void {
  const slots = form.querySelectorAll<HTMLElement>('[data-error-for]')
  slots.forEach((slot) => {
    slot.textContent = ''
    slot.hidden = true
  })
  const known = new Set([...slots].map((s) => s.dataset.errorFor))
  const leftovers: string[] = []
  for (const [field, message] of Object.entries(fieldErrors)) {
    if (known.has(field)) {
      const slot = form.querySelector<HTMLElement>(`[data-error-for="${field}"]`)!
      slot.textContent = message
      slot.hidden = false
    } else leftovers.push(`${field}: ${message}`)
  }
  const general = form.querySelector<HTMLElement>('[data-error-for="_"]')
  if (general && leftovers.length) {
    general.textContent = leftovers.join(' · ')
    general.hidden = false
  }
}
