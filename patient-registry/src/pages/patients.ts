import { icon } from '../ui/icons.ts'
import { avatar, badge, btn, field, label } from '../ui/bits.ts'
import { addPatient, countByStatus, getPatients, queryPatients } from '../db.ts'
import { BloodSchema, SexSchema, STATUSES, type Patient, type Status } from '../schema.ts'
import type { Query, SortKey } from '../db.ts'

const filters: { key: Status | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  ...STATUSES.map((key) => ({ key, label: key[0]!.toUpperCase() + key.slice(1) })),
]

const sorts: { key: SortKey; label: string }[] = [
  { key: 'visit', label: 'Last visit' },
  { key: 'name', label: 'Name' },
  { key: 'age', label: 'Age' },
]

const tabBase = 'rounded-md px-3 py-2 text-sm font-medium'
const tabCls = (on: boolean) =>
  `${tabBase} ${on ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`

const th = 'px-3 py-3.5 text-left text-sm font-semibold text-gray-900'
const td = 'px-3 py-4 text-sm whitespace-nowrap text-gray-500'

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
const showDate = (iso: string) => (iso ? dateFmt.format(new Date(`${iso}T00:00:00`)) : '—')

const query: Query = { search: '', status: 'all', sort: 'visit' }

function row(p: Patient) {
  return `<tr>
    <td class="py-4 pr-3 pl-4 text-sm whitespace-nowrap sm:pl-6">
      <div class="flex items-center gap-x-3">
        ${avatar(p.name ?? '??')}
        <div class="min-w-0">
          <div class="truncate font-medium text-gray-900">${p.name}</div>
          <div class="truncate text-gray-500">${p.email}</div>
        </div>
      </div>
    </td>
    <td class="${td} tabular-nums">${p.id}</td>
    <td class="${td}"><span class="tabular-nums">${p.age}</span> · ${p.sex}</td>
    <td class="${td}">
      <span class="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium
        text-gray-600 tabular-nums ring-1 ring-gray-500/10 ring-inset">${p.blood}</span>
    </td>
    <td class="${td}">${p.ward}</td>
    <td class="${td} tabular-nums">${showDate(p.visit)}</td>
    <td class="px-3 py-4 text-sm whitespace-nowrap">${badge(p.status)}</td>
  </tr>`
}

const emptyRow = `<tr>
  <td colspan="7" class="px-6 py-14 text-center">
    <span class="mx-auto flex size-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
      ${icon('search', 'size-5')}
    </span>
    <h3 class="mt-3 text-sm font-semibold text-gray-900">No patients match</h3>
    <p class="mt-1 text-sm text-gray-500">Try a different name, record number or status.</p>
  </td>
</tr>`

/** Shown while src/db.ts still has its TODO in place. */
const todoPanel = `<div class="rounded-lg bg-amber-50 p-4 ring-1 ring-amber-600/20 ring-inset">
  <div class="flex gap-x-3">
    ${icon('alert', 'size-5 shrink-0 text-amber-600')}
    <div class="space-y-1 text-sm">
      <h3 class="font-semibold text-amber-900">The table is empty</h3>
      <p class="text-amber-800">
        Nothing is in memory yet. Write <span class="font-mono">loadPatients()</span> in
        <span class="font-mono">src/db.ts</span> — fetch
        <span class="font-mono">/data/patients.json</span>, validate it with your
        <span class="font-mono">PatientListSchema</span>, and the 24 records below will appear.
      </p>
      <p class="text-amber-700">Run <span class="font-mono">npm run check</span> to test your work.</p>
    </div>
  </div>
</div>`

/* ---------- the add form ---------- */

const selectCls = `${field} px-3`

function formRow(name: string, text: string, control: string) {
  return `<div>
    <label for="np-${name}" class="${label}">${text}</label>
    <div class="mt-2">${control}</div>
    <p data-error="${name}" class="mt-1 hidden text-sm text-red-600"></p>
  </div>`
}

const options = (values: readonly string[]) =>
  values.map((v) => `<option value="${v}">${v}</option>`).join('')

const addForm = `<form data-add class="hidden space-y-5 rounded-lg bg-white p-4 shadow-sm sm:p-6" novalidate>
  <div>
    <h3 class="text-base font-semibold text-gray-900">New patient</h3>
    <p class="mt-1 text-sm text-gray-500">
      Submitting calls <span class="font-mono">addPatient()</span> in
      <span class="font-mono">src/db.ts</span>. Every value below arrives as a string.
    </p>
  </div>

  <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
    ${formRow('name', 'Full name', `<input id="np-name" name="name" class="${field} px-3"/>`)}
    ${formRow('email', 'Email', `<input id="np-email" name="email" class="${field} px-3"/>`)}
    ${formRow('age', 'Age', `<input id="np-age" name="age" inputmode="numeric" class="${field} px-3"/>`)}
    ${formRow('ward', 'Ward', `<input id="np-ward" name="ward" class="${field} px-3"/>`)}
    ${formRow('sex', 'Sex', `<select id="np-sex" name="sex" class="${selectCls}">${options(SexSchema.options)}</select>`)}
    ${formRow('blood', 'Blood', `<select id="np-blood" name="blood" class="${selectCls}">${options(BloodSchema.options)}</select>`)}
    ${formRow('status', 'Status', `<select id="np-status" name="status" class="${selectCls}">${options(STATUSES)}</select>`)}
  </div>

  <p data-add-message class="hidden rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-600/20 ring-inset"></p>

  <div class="flex items-center gap-3">
    <button type="submit" class="${btn.primary}">Save patient</button>
    <button type="button" data-cancel class="${btn.ghost}">Cancel</button>
    <span class="text-xs text-gray-500">Added rows live in memory until you reload.</span>
  </div>
</form>`

export function renderPatients() {
  const all = getPatients()
  const counts = countByStatus()
  const visible = queryPatients(query)

  return `
  <div class="space-y-5">

    ${all.length === 0 ? todoPanel : ''}

    <div class="flex flex-wrap items-center gap-3">
      <div class="relative min-w-0 flex-1 sm:max-w-xs">
        <input data-search type="search" value="${query.search}" placeholder="Search name, record or ward…"
          class="${field} pr-3 pl-10"/>
        ${icon('search', 'pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-gray-400')}
      </div>
      <label class="sr-only" for="sort">Sort by</label>
      <div class="relative">
        <select id="sort" data-sort class="${btn.ghost} appearance-none pr-9">
          ${sorts.map((s) => `<option value="${s.key}"${s.key === query.sort ? ' selected' : ''}>${s.label}</option>`).join('')}
        </select>
        ${icon('sort', 'pointer-events-none absolute top-1/2 right-2 size-5 -translate-y-1/2 text-gray-400')}
      </div>
      <button type="button" data-new class="${btn.primary} ms-auto">${icon('plus', 'size-5')}New patient</button>
    </div>

    ${addForm}

    <nav aria-label="Filter by status" class="flex flex-wrap gap-2">
      ${filters
        .map(
          (f) => `<button type="button" data-filter="${f.key}" class="${tabCls(f.key === query.status)}">
            ${f.label}
            <span class="ml-1 tabular-nums text-xs text-gray-400">${counts[f.key] ?? 0}</span>
          </button>`,
        )
        .join('')}
    </nav>

    <div class="overflow-hidden rounded-lg bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-300">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-6">Patient</th>
              <th scope="col" class="${th}">Record</th>
              <th scope="col" class="${th}">Age · sex</th>
              <th scope="col" class="${th}">Blood</th>
              <th scope="col" class="${th}">Ward</th>
              <th scope="col" class="${th}">Last visit</th>
              <th scope="col" class="${th}">Status</th>
            </tr>
          </thead>
          <tbody data-rows class="divide-y divide-gray-200 bg-white">
            ${visible.length ? visible.map(row).join('') : emptyRow}
          </tbody>
        </table>
      </div>

      <nav class="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 sm:px-6">
        <p class="text-sm text-gray-700">
          Showing <span data-shown class="font-medium tabular-nums">${visible.length}</span>
          of <span data-total class="font-medium tabular-nums">${all.length}</span> records
        </p>
        <p class="text-xs text-gray-500">Source: <span class="font-mono">public/data/patients.json</span></p>
      </nav>
    </div>
  </div>`
}

export function wirePatients(root: ParentNode) {
  const tbody = root.querySelector<HTMLTableSectionElement>('[data-rows]')
  const shown = root.querySelector<HTMLElement>('[data-shown]')
  const total = root.querySelector<HTMLElement>('[data-total]')
  const search = root.querySelector<HTMLInputElement>('[data-search]')
  const sort = root.querySelector<HTMLSelectElement>('[data-sort]')
  const chips = [...root.querySelectorAll<HTMLButtonElement>('[data-filter]')]
  const form = root.querySelector<HTMLFormElement>('[data-add]')
  const newBtn = root.querySelector<HTMLButtonElement>('[data-new]')
  const cancel = root.querySelector<HTMLButtonElement>('[data-cancel]')
  const addMessage = root.querySelector<HTMLElement>('[data-add-message]')
  if (!tbody || !shown || !total || !search || !sort || !form || !newBtn || !cancel || !addMessage) return

  const counts = () => countByStatus()

  const repaint = () => {
    const visible = queryPatients(query)
    tbody.innerHTML = visible.length ? visible.map(row).join('') : emptyRow
    shown.textContent = String(visible.length)
    total.textContent = String(getPatients().length)
    const c = counts()
    chips.forEach((chip) => {
      const key = (chip.dataset.filter ?? 'all') as Status | 'all'
      chip.className = tabCls(key === query.status)
      const badgeEl = chip.querySelector('span')
      if (badgeEl) badgeEl.textContent = String(c[key] ?? 0)
    })
  }

  search.addEventListener('input', () => {
    query.search = search.value
    repaint()
  })

  sort.addEventListener('change', () => {
    query.sort = sort.value as SortKey
    repaint()
  })

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      query.status = (chip.dataset.filter ?? 'all') as Status | 'all'
      repaint()
    })
  })

  /* ---------- add ---------- */

  const clearErrors = () => {
    form.querySelectorAll<HTMLElement>('[data-error]').forEach((el) => {
      el.textContent = ''
      el.classList.add('hidden')
    })
    addMessage.textContent = ''
    addMessage.classList.add('hidden')
  }

  newBtn.addEventListener('click', () => {
    clearErrors()
    form.classList.toggle('hidden')
    if (!form.classList.contains('hidden')) form.querySelector<HTMLInputElement>('#np-name')?.focus()
  })

  cancel.addEventListener('click', () => {
    form.reset()
    clearErrors()
    form.classList.add('hidden')
  })

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    clearErrors()
    const draft = Object.fromEntries(new FormData(form).entries())

    const result = addPatient(draft)
    if (result.ok) {
      form.reset()
      form.classList.add('hidden')
      repaint()
      return
    }

    for (const [name, message] of Object.entries(result.fieldErrors)) {
      const slot = form.querySelector<HTMLElement>(`[data-error="${name}"]`)
      if (slot) {
        slot.textContent = message
        slot.classList.remove('hidden')
      }
    }
    if (result.message) {
      addMessage.textContent = result.message
      addMessage.classList.remove('hidden')
    }
  })
}
