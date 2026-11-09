import { createPatient, deletePatient, getAllergies, getPatients, updatePatient } from '@/data/store'
import { focusFirstInvalid, formValues, refs, renderList, showErrors, showFieldError } from '@/lib/dom'
import { definePage } from '@/lib/page'
import { toFieldErrors } from '@/lib/validation'
import {
  AGE_MISMATCH,
  ageFromBirthDate,
  DUPLICATE_EMAIL,
  DUPLICATE_NAME,
  newPatientSchemaFor,
  patientChangesSchemaFor,
} from '@/schema/schema'
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
  birthInput: HTMLInputElement,
  ageInput: HTMLInputElement,
}

/** Every field of the form, in display order. */
const FIELDS = ['name', 'email', 'birthDate', 'age', 'sex', 'blood', 'ward', 'status'] as const

/** Errors worth showing the moment they happen, even in a field the user hasn't left yet. */
const INSTANT = new Set<string>([DUPLICATE_NAME, DUPLICATE_EMAIL, AGE_MISMATCH])

export default definePage(async ({ root, signal }) => {
  const $ = refs(root, patientsView)

  let editingId: string | null = null
  let query = ''
  // a field is "touched" once the user leaves it (or submits); only then do its normal
  // errors ("too short", "pick a sex") appear, so nobody is scolded for the first keystroke
  const touched = new Set<string>()
  let ageIsAuto = true // age was filled from the birth date (or is empty), so it may be refilled

  // ---------- form helpers ----------
  function showForm(mode: 'new' | 'edit'): void {
    $.newForm.hidden = false
    $.formTitle.textContent = mode === 'new' ? 'New patient' : 'Edit patient'
    $.sumbitForm.textContent = mode === 'new' ? 'Add patient' : 'Save changes'
    showErrors($.newForm, {})
    touched.clear()
    ageIsAuto = true
    $.newForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  function hideForm(): void {
    $.newForm.hidden = true
    $.newForm.reset()
    showErrors($.newForm, {})
    editingId = null
    touched.clear()
    ageIsAuto = true
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

  // ---------- live validation (every field, while typing) ----------
  // Runs the SAME schema the submit and the store use, on the whole form, then shows each
  // field's first error: always if the field was touched, or right away for INSTANT errors.
  function validateLive(): void {
    const schema = editingId ? patientChangesSchemaFor(list, editingId) : newPatientSchemaFor(list)
    const result = schema.safeParse(formValues($.newForm))
    const errors: Record<string, string> = result.success ? {} : toFieldErrors(result.error)
    for (const field of FIELDS) {
      const message = errors[field] ?? ''
      showFieldError($.newForm, field, touched.has(field) || INSTANT.has(message) ? message : '')
    }
  }

  const fieldName = (e: Event) => (e.target as HTMLInputElement | HTMLSelectElement | null)?.name ?? ''

  // input/change/focusout bubble, so three listeners on the form cover every field
  $.newForm.addEventListener('input', validateLive, { signal })
  $.newForm.addEventListener(
    'change',
    (e) => {
      if (e.target instanceof HTMLSelectElement) touched.add(fieldName(e)) // a pick is a finished answer
      validateLive()
    },
    { signal },
  )
  $.newForm.addEventListener(
    'focusout',
    (e) => {
      const name = fieldName(e)
      if (name) touched.add(name)
      validateLive()
    },
    { signal },
  )

  // birth date → fill in the age, unless the user typed their own age
  $.birthInput.max = new Date().toISOString().slice(0, 10) // the date picker can't go into the future
  $.ageInput.addEventListener('input', () => (ageIsAuto = $.ageInput.value === ''), { signal })
  $.birthInput.addEventListener(
    'change',
    () => {
      if ($.birthInput.value && ageIsAuto) {
        $.ageInput.value = String(Math.max(0, ageFromBirthDate($.birthInput.value)))
        validateLive()
      }
    },
    { signal },
  )

  // the Clear button resets values; clear their errors and "touched" state too
  $.newForm.addEventListener(
    'reset',
    () => {
      touched.clear()
      ageIsAuto = true
      showErrors($.newForm, {})
    },
    { signal },
  )

  // ---------- add / edit submit ----------
  function showInvalid(fieldErrors: Record<string, string>): void {
    showErrors($.newForm, fieldErrors)
    focusFirstInvalid($.newForm)
  }

  $.newForm.addEventListener(
    'submit',
    async (e: SubmitEvent): Promise<void> => {
      e.preventDefault()
      FIELDS.forEach((f) => touched.add(f)) // a submit shows every error
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
