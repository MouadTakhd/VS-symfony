import { createPatient, deletePatient, getAllergies, getPatients, updatePatient } from '@/data/store'
import { focusFirstInvalid, formValues, refs, renderList, showErrors, showFieldError } from '@/lib/dom'
import { definePage } from '@/lib/page'
import { toFieldErrors } from '@/lib/validation'
import { DUPLICATE_NAME, newPatientSchemaFor, patientChangesSchemaFor, uniqueNameSchema } from '@/schema/schema'
import type { ApiResult, Patient } from '@/types'

// patients.html's interface: every element this page touches, by data-ref and tag.
const patientsView = {
  error: HTMLParagraphElement,
  newForm: HTMLFormElement,
  empty: HTMLParagraphElement,
  patients: HTMLElement,
  recentRow: HTMLTemplateElement,
  sumbitForm: HTMLButtonElement, // spelling must match data-ref in patients.html
  reset: HTMLButtonElement,
  search: HTMLInputElement,
  formTitle: HTMLHeadingElement,
  openForm: HTMLButtonElement,
  closeForm: HTMLButtonElement,
  nameInput: HTMLInputElement,
}

export default definePage(async ({ root, signal }) => {
  const $ = refs(root, patientsView)

  let editingId: string | null = null
  let query = ''
  let nameTouched = false // show "too short" etc. only after the first blur / submit

  // ---------- form helpers ----------
  function showForm(mode: 'new' | 'edit'): void {
    $.newForm.hidden = false
    $.formTitle.textContent = mode === 'new' ? 'New patient' : 'Edit patient'
    $.sumbitForm.textContent = mode === 'new' ? 'Add patient' : 'Save changes'
    showErrors($.newForm, {})
    nameTouched = false
    $.newForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  function hideForm(): void {
    $.newForm.hidden = true
    $.newForm.reset()
    showErrors($.newForm, {})
    editingId = null
    nameTouched = false
  }

  function showError(message: string): void {
    $.error.textContent = message
    $.error.hidden = false
  }

  function clearError(): void {
    $.error.textContent = ''
    $.error.hidden = true
  }

  $.openForm.addEventListener(
    'click',
    () => {
      editingId = null
      $.newForm.reset()
      showForm('new')
    },
    { signal },
  )
  $.closeForm.addEventListener('click', hideForm, { signal })

  // ---------- load data ----------
  const [patients, allergies] = await Promise.all([getPatients(), getAllergies()])

  if (!patients.ok || !allergies.ok) {
    showError(!patients.ok ? patients.message : !allergies.ok ? allergies.message : '')
    return
  }

  let list: Patient[] = patients.data

  // count allergies once per patient instead of filtering on every render
  const allergyCounts = new Map<string, number>()
  for (const a of allergies.data) {
    const key = a.patientId.toLowerCase()
    allergyCounts.set(key, (allergyCounts.get(key) ?? 0) + 1)
  }
  const countFor = (id: string): number => allergyCounts.get(id.toLowerCase()) ?? 0

  async function reload(): Promise<void> {
    const result = await getPatients()
    if (result.ok) list = result.data
    else showError(result.message)
    renderTable()
  }

  // ---------- render ----------
  function renderTable(): void {
    const rows: Patient[] = []
    for (const p of list) {
      if (rows.length >= 20) break
      // only fields a user would type; email ("example.com") and dates match almost any letter
      const matches = !query || [p.name, p.id, p.ward].some((v) => v.toLowerCase().includes(query))
      if (matches) rows.push(p)
    }

    renderList($.patients, $.recentRow, rows, (p: Patient) => {
      const n = countFor(p.id)
      return {
        ...p,
        allergyLabel: n === 0 ? 'No allergies' : `${n} ${n === 1 ? 'allergy' : 'allergies'}`,
        allergyClass: n === 0 ? 'bg-gray-100 text-gray-600' : 'bg-amber-50 text-amber-700',
      }
    })

    $.empty.hidden = rows.length > 0
  }

  renderTable()

  // ---------- search ----------
  $.search.addEventListener(
    'input',
    () => {
      query = $.search.value.trim().toLowerCase()
      renderTable()
    },
    { signal },
  )

  // ---------- live name check (while typing) ----------
  // Same rule the store enforces, so what you see here is what saving will say.
  function checkName(): void {
    const result = uniqueNameSchema(list, editingId ?? undefined).safeParse($.nameInput.value)
    const message = result.success ? '' : result.error.issues[0].message
    // a duplicate shows immediately; length errors wait until the user has left the field once
    showFieldError($.newForm, 'name', message === DUPLICATE_NAME || nameTouched ? message : '')
  }
  $.nameInput.addEventListener('input', checkName, { signal })
  $.nameInput.addEventListener(
    'blur',
    () => {
      nameTouched = true
      checkName()
    },
    { signal },
  )
  // the Clear button resets values; clear their errors too
  $.newForm.addEventListener('reset', () => showErrors($.newForm, {}), { signal })

  // ---------- add / edit submit ----------
  function showInvalid(fieldErrors: Record<string, string>): void {
    showErrors($.newForm, fieldErrors)
    focusFirstInvalid($.newForm)
  }

  $.newForm.addEventListener(
    'submit',
    async (e: SubmitEvent): Promise<void> => {
      e.preventDefault()
      nameTouched = true
      const values = formValues($.newForm)

      // 1. validate here for instant field errors (no store call when invalid)
      // 2. hand the PARSED data to the store, which validates again (it's the final word) and saves
      let result: ApiResult<Patient>
      if (editingId) {
        const parsed = patientChangesSchemaFor(list, editingId).safeParse(values)
        if (!parsed.success) return showInvalid(toFieldErrors(parsed.error))
        $.sumbitForm.disabled = true
        result = await updatePatient(editingId, parsed.data)
      } else {
        const parsed = newPatientSchemaFor(list).safeParse(values)
        if (!parsed.success) return showInvalid(toFieldErrors(parsed.error))
        $.sumbitForm.disabled = true
        result = await createPatient(parsed.data)
      }
      $.sumbitForm.disabled = false

      if (!result.ok) {
        const fieldErrors = Object.keys(result.fieldErrors).length ? result.fieldErrors : { _: result.message }
        return showInvalid(fieldErrors)
      }

      clearError()
      hideForm()
      await reload()
    },
    { signal },
  )

  // ---------- row actions (edit / delete) ----------
  $.patients.addEventListener(
    'click',
    async (e: MouseEvent): Promise<void> => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')
      if (!el) return // clicks outside buttons are normal

      const id = el.dataset.id
      if (!id) return

      if (el.dataset.action === 'delete') {
        if (!confirm(`Delete patient ${id} and their allergies?`)) return
        const result = await deletePatient(id)
        if (!result.ok) showError(result.message)
        allergyCounts.delete(id.toLowerCase())
        await reload()
        return
      }

      if (el.dataset.action === 'edit') {
        const patient = list.find((p) => p.id === id)
        if (!patient) return

        editingId = patient.id
        for (const [key, value] of Object.entries(patient)) {
          const field = $.newForm.elements.namedItem(key)
          if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) {
            field.value = String(value)
          }
        }
        showForm('edit')
      }
    },
    { signal },
  )
})
