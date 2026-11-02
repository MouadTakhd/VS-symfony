import layout from '@/layout.html?raw'
import type { Cleanup, Page, Params } from './page'

// Every HTML file in src/pages becomes a route. No registration needed:
//
//   pages/home.html            →  #/
//   pages/patients.html        →  #/patients
//   pages/patients.new.html    →  #/patients/new
//   pages/patients.$id.html    →  #/patients/:id        (params.id)
//   pages/404.html             →  anything that matches nothing
//
// A .ts file with the same name (pages/patients.ts) is that page's controller:
// `export default definePage(...)`. Pages without one are plain static HTML.
//
// Partials: <x-include src="navbar"></x-include> in any page, partial or the layout
// is replaced with src/partials/navbar.html.

const pageHtml = import.meta.glob<string>('../pages/*.html', { query: '?raw', import: 'default', eager: true })
const pageCode = import.meta.glob<{ default: Page }>('../pages/*.ts', { eager: true })
const partials = import.meta.glob<string>('../partials/*.html', { query: '?raw', import: 'default', eager: true })

const fileName = (path: string) => path.split('/').pop()!.replace(/\.(html|ts)$/, '')

type Route = { name: string; segments: string[]; html: string; setup?: Page }

function toSegments(name: string): string[] {
  return name === 'home' ? [] : name.split('.').map((s) => (s.startsWith('$') ? ':' + s.slice(1) : s))
}

const controllers = new Map(Object.entries(pageCode).map(([path, mod]) => [fileName(path), mod.default]))
const routes: Route[] = Object.entries(pageHtml)
  .map(([path, html]) => {
    const name = fileName(path)
    return { name, segments: toSegments(name), html, setup: controllers.get(name) }
  })
  // static segments win over :params (patients/new before patients/:id)
  .sort((a, b) => a.segments.filter((s) => s.startsWith(':')).length - b.segments.filter((s) => s.startsWith(':')).length)

for (const name of controllers.keys()) {
  if (!routes.some((r) => r.name === name)) console.warn(`[router] pages/${name}.ts has no pages/${name}.html`)
}

function match(path: string): { route: Route; params: Params } | undefined {
  const parts = path.split('/').filter(Boolean)
  for (const route of routes) {
    if (route.name === '404' || route.segments.length !== parts.length) continue
    const params: Params = {}
    const ok = route.segments.every((seg, i) => {
      if (seg.startsWith(':')) {
        params[seg.slice(1)] = decodeURIComponent(parts[i])
        return true
      }
      return seg === parts[i]
    })
    if (ok) return { route, params }
  }
  const notFound = routes.find((r) => r.name === '404')
  return notFound && { route: notFound, params: {} }
}

/** Replaces <x-include src="name"></x-include> with src/partials/name.html (nested up to 5 levels). */
export function includePartials(html: string, depth = 0): string {
  return html.replace(/<x-include\s+src="([\w-]+)"\s*(?:\/>|><\/x-include>)/g, (_, name: string) => {
    const partial = partials[`../partials/${name}.html`]
    if (partial === undefined) {
      console.error(`[router] missing partial: src/partials/${name}.html`)
      return `<p style="color:red">Missing partial: ${name}</p>`
    }
    return depth < 5 ? includePartials(partial, depth + 1) : partial
  })
}

export function navigate(to: string): void {
  location.hash = to.startsWith('#') ? to : '#' + to
}

/** Marks nav links for the current page with aria-current="page" (style it with CSS). */
function markActiveLinks(path: string): void {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#/"]').forEach((a) => {
    const href = a.getAttribute('href')!.slice(1)
    const active = href === '/' ? path === '/' : path === href || path.startsWith(href + '/')
    if (active) a.setAttribute('aria-current', 'page')
    else a.removeAttribute('aria-current')
  })
}

export function startRouter(app: HTMLElement): void {
  app.innerHTML = includePartials(layout)
  const outlet = app.querySelector<HTMLElement>('[data-outlet]')
  if (!outlet) throw new Error('src/layout.html needs an element with data-outlet')

  let leave: { abort: AbortController; cleanup?: Cleanup } | undefined
  let renderId = 0

  async function render() {
    const id = ++renderId
    leave?.abort.abort()
    leave?.cleanup?.()

    const path = location.hash.replace(/^#/, '') || '/'
    const found = match(path)
    if (!found) {
      outlet!.innerHTML = '<p>Page not found. Add src/pages/404.html to customise this.</p>'
      return
    }

    const { route, params } = found
    outlet!.innerHTML = includePartials(route.html)
    const title = outlet!.querySelector<HTMLElement>('[data-title]')?.dataset.title ?? route.name
    document.title = `${title} · Patient Registry`
    markActiveLinks(path)
    window.scrollTo(0, 0)

    const abort = new AbortController()
    leave = { abort }
    if (!route.setup) return
    try {
      const cleanup = await route.setup({ root: outlet!, params, navigate, signal: abort.signal })
      if (typeof cleanup === 'function') {
        // the user may have navigated away while setup was awaiting data
        if (id === renderId) leave.cleanup = cleanup
        else cleanup()
      }
    } catch (error) {
      console.error(`[router] pages/${route.name}.ts failed:`, error)
      if (id === renderId) {
        outlet!.insertAdjacentHTML(
          'afterbegin',
          `<pre style="color:red;white-space:pre-wrap">pages/${route.name}.ts failed: ${String(error).replaceAll('<', '&lt;')}</pre>`,
        )
      }
    }
  }

  window.addEventListener('hashchange', render)
  render()
}
