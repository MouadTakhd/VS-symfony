// The app's only data source. No server: data starts from ./db.json and every change is
// saved to localStorage, so it survives a page reload.
//
// The circuit:   form ──safeParse──▶ store ──safeParse──▶ db (memory + localStorage) ──▶ pages
//                (fast feedback)      (the final word)     (validated again on load)
//
// Pages call these functions and never touch localStorage or db.json directly.
// Each one is async and returns ApiResult, the same contract a real API would have.
// Nothing here throws: bad input comes back as { ok: false, message, fieldErrors }.
//
// Reset to the original data: resetData() in code, or localStorage.clear() in the console.

import { z } from 'zod'
import seed from './db.json'
import {
  AllergyChangesSchema,
  DbSchema,
  NewAllergySchema,
  newPatientSchemaFor,
  patientChangesSchemaFor,
} from '@/schema/schema'
import { toFieldErrors } from '@/lib/validation'
import type {
  Allergy,
  AllergyChanges,
  ApiResult,
  Db,
  NewAllergy,
  NewPatientInput,
  Patient,
  PatientChangesInput,
} from '@/types'

const STORAGE_KEY = 'patient-registry:db'

/* ---------- storage ---------- */

function readSaved(): unknown {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : undefined
  } catch {
    return undefined // private mode / corrupted JSON
  }
}

/** Saved data if it's valid, else db.json. Never trusts either without parsing. */
function load(): Db {
  const saved = readSaved()
  if (saved !== undefined) {
    const parsed = DbSchema.safeParse(saved)
    if (parsed.success) return parsed.data
    console.warn('[store] saved data is invalid, falling back to db.json:\n' + z.prettifyError(parsed.error))
  }
  const fromSeed = DbSchema.safeParse(seed)
  if (fromSeed.success) return fromSeed.data
  // db.json is ours, so this is a bug to fix there, but keep the app usable meanwhile
  console.error('[store] src/data/db.json does not match DbSchema:\n' + z.prettifyError(fromSeed.error))
  return structuredClone(seed) as unknown as Db
}

let db = load()

function save(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // storage full or blocked: changes stay in memory for this tab
  }
}

/** Throws away every change and goes back to db.json. */
export function resetData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
  db = load()
}

/* ---------- helpers ---------- */

export function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

export function fail(message: string, fieldErrors: Record<string, string> = {}) {
  return { ok: false, message, fieldErrors } as const
}

const invalid = (error: z.ZodError) => fail('Please fix the highlighted fields', toFieldErrors(error))

/** Today as "YYYY-MM-DD". */
const today = () => new Date().toISOString().slice(0, 10)

/** Copies so pages can't mutate the store by accident. */
const copy = <T>(value: T): T => structuredClone(value)

const sameId = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

/* ---------- patients ---------- */

export async function getPatients(): Promise<ApiResult<Patient[]>> {
  return ok(copy(db.patients))
}

export async function getPatient(id: string): Promise<ApiResult<Patient>> {
  const patient = db.patients.find((p) => sameId(p.id, id))
  return patient ? ok(copy(patient)) : fail(`No patient with id "${id}"`)
}

/** Validates (including "name not taken"), assigns the next PR- id and today's visit. */
export async function createPatient(body: NewPatientInput): Promise<ApiResult<Patient>> {
  const input = newPatientSchemaFor(db.patients).safeParse(body)
  if (!input.success) return invalid(input.error)

  const max = Math.max(10000, ...db.patients.map((p) => Number(p.id.slice(3)) || 0))
  const patient: Patient = { ...input.data, id: `PR-${max + 1}`, visit: today() }
  db.patients.push(patient)
  save()
  return ok(copy(patient))
}

/** Merges only the given fields. The name may stay the same, but can't match another patient. */
export async function updatePatient(id: string, changes: PatientChangesInput): Promise<ApiResult<Patient>> {
  const index = db.patients.findIndex((p) => sameId(p.id, id))
  if (index === -1) return fail(`No patient with id "${id}"`)

  const current = db.patients[index]
  const input = patientChangesSchemaFor(db.patients, current.id).safeParse(changes)
  if (!input.success) return invalid(input.error)

  db.patients[index] = { ...current, ...input.data, id: current.id }
  save()
  return ok(copy(db.patients[index]))
}

/** Also deletes that patient's allergies. */
export async function deletePatient(id: string): Promise<ApiResult<null>> {
  const index = db.patients.findIndex((p) => sameId(p.id, id))
  if (index === -1) return fail(`No patient with id "${id}"`)
  db.patients.splice(index, 1)
  db.allergies = db.allergies.filter((a) => !sameId(a.patientId, id))
  save()
  return ok(null)
}

/* ---------- allergies ---------- */

export async function getAllergies(): Promise<ApiResult<Allergy[]>> {
  return ok(copy(db.allergies))
}

export async function getAllergiesFor(patientId: string): Promise<ApiResult<Allergy[]>> {
  return ok(copy(db.allergies.filter((a) => sameId(a.patientId, patientId))))
}

export async function createAllergy(body: NewAllergy): Promise<ApiResult<Allergy>> {
  const input = NewAllergySchema.safeParse(body)
  if (!input.success) return invalid(input.error)
  // a rule about other records: lives here, not in the schema
  if (!db.patients.some((p) => sameId(p.id, input.data.patientId))) {
    return fail(`No patient with id "${input.data.patientId}"`, { patientId: 'Unknown patient' })
  }
  const id = Math.max(0, ...db.allergies.map((a) => a.id)) + 1
  const allergy: Allergy = { ...input.data, id, recordedAt: today() }
  db.allergies.push(allergy)
  save()
  return ok(copy(allergy))
}

export async function updateAllergy(id: number, changes: AllergyChanges): Promise<ApiResult<Allergy>> {
  const index = db.allergies.findIndex((a) => a.id === id)
  if (index === -1) return fail(`No allergy with id ${id}`)
  const input = AllergyChangesSchema.safeParse(changes)
  if (!input.success) return invalid(input.error)
  const current = db.allergies[index]
  db.allergies[index] = { ...current, ...input.data, id: current.id, patientId: current.patientId }
  save()
  return ok(copy(db.allergies[index]))
}

export async function deleteAllergy(id: number): Promise<ApiResult<null>> {
  const index = db.allergies.findIndex((a) => a.id === id)
  if (index === -1) return fail(`No allergy with id ${id}`)
  db.allergies.splice(index, 1)
  save()
  return ok(null)
}
