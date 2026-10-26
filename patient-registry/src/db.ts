// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 2 — getting and adding
//
// The database is public/data/patients.json, served as a static file. Your job
// is the two functions marked TODO: one reads the file, one appends to it.
//
// Everything below the "already written" line is plain array work, not zod —
// it is done for you, and it starts working the moment loadPatients() does.
// ─────────────────────────────────────────────────────────────────────────────
import { PatientListSchema, NewPatientSchema, type Patient, type Status } from './schema.ts'

const DB_URL = '/data/patients.json'

// Both results carry every field, rather than being a discriminated union of
// success and failure. A union is the better shape, but it only narrows on
// `if (result.ok)` when strictNullChecks is on, and this tsconfig has
// `strict: false` while the UI layer is untyped. Keep it flat for now.

export type LoadResult = {
  ok: boolean
  rows: Patient[]
  /** Empty when ok. One line, printable. */
  message: string
  /** Empty when ok. One entry per zod issue. */
  issues: string[]
}

export type AddResult = {
  ok: boolean
  patient: Patient | null
  /** Empty when ok. A form-level message. */
  message: string
  /** Empty when ok. Keyed by field name: { email: "Invalid email address" }. */
  fieldErrors: Record<string, string>
}

/** The validated rows, held in memory. Your loadPatients() should fill this. */
let rows: Patient[] = []

/* ---------- TODO 2a: get ---------- */

/**
 * Fetch DB_URL, validate the response against PatientListSchema, and on success
 * put the validated rows into `rows` and return them.
 *
 * Steps:
 *   1. `const response = await fetch(DB_URL)`
 *   2. Handle `!response.ok` — a 404 is not a validation problem, it is a
 *      missing file, and the message should say so.
 *   3. `await response.json()` gives you `any`. That is exactly the untrusted
 *      value zod exists for — do NOT cast it to Patient[].
 *   4. Validate it. Use `.safeParse()`, not `.parse()`: safeParse returns
 *      `{ success, data, error }` instead of throwing, which is what you want
 *      when the bad input is a data file rather than a bug.
 *   5. On failure, turn `result.error.issues` into strings for the UI. Each
 *      issue has `.path` (e.g. `[3, "status"]`) and `.message`. Try
 *      `z.prettifyError(result.error)` too and see which you prefer.
 *
 * Try it both ways: implement it, then break a record in the JSON on purpose
 * (misspell a status, delete an email) and watch what your error path reports.
 */
export async function loadPatients(): Promise<LoadResult> {
  // TODO: remove these two lines and write the real thing.
  try{
    const response = await fetch(DB_URL)
    if(!response.ok){
      return {
        ok:false,
        rows:[],
        message: `Erreur HTTP [Status: ${response.status}]`,
         issues:[]
      }
    }
    const data = await response.json()
    const result = PatientListSchema.safeParse(data)
    if(result.success){
      rows=result.data;
      return {
        ok: true,
        rows: rows,
        message: '',
        issues: [],
      }
    }else{
      return {
        ok:false,
        rows:[],
        message:'check the issuers',
        issues:result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
        
      }
    }
    
  }catch(error){
    const reason = error instanceof Error ? error.message : String(error)
    return { ok: false, rows: [], message: `could not fetch ${DB_URL}: ${reason}`, issues: [] }
  }
 
}

/* ---------- TODO 2b: add ---------- */

/**
 * Validate a draft from the "New patient" form and append it to `rows`.
 *
 * `draft` is whatever the form collected — every value a string, nothing
 * checked. Treat it as untrusted input.
 *
 * Steps:
 *   1. `NewPatientSchema.safeParse(draft)`.
 *   2. On failure, build `fieldErrors` so the form can show a message under the
 *      right input: `{ email: "Invalid email address", age: "..." }`.
 *      `issue.path[0]` is the field name. (zod also offers
 *      `z.flattenError(error)` — have a look at what it gives you.)
 *   3. On success, `result.data` is a clean, typed NewPatient — note that `age`
 *      is now a number even though the form gave you a string.
 *   4. Build the full record: add `id` (nextId() below) and `visit` (today, as
 *      "YYYY-MM-DD" — `todayIso()` below).
 *   5. Push it onto `rows` and return it.
 *
 * Nothing is written back to the JSON file — the browser cannot do that. Added
 * rows live until you reload. Making them survive means a real API or
 * localStorage, and that is a later exercise.
 */
export function addPatient(draft: unknown): AddResult {
  // TODO: remove these two lines and write the real thing.
  const result = NewPatientSchema.safeParse(draft)
  if(!result.success){
    const fieldErrors: Record<string,string>={}
    for(const issue of result.error.issues){
      const field=String(issue.path[0]?? 'form')
      fieldErrors[field]??=issue.message
    }

 return { ok: false, patient: null, message: 'Check the highlighted fields.', fieldErrors }
  
    }
 const patient :Patient = {
    ...result.data,visit:todayIso(),id:nextId()
  }
  rows.push(patient)
  return  {
    ok:true,
    patient,message:'',
    fieldErrors:{}
  }
  }
  

/* ---------- helpers for 2b ---------- */

/** Today as "YYYY-MM-DD". */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/** The next free record number, e.g. "PR-10429". */
export function nextId(): string {
  const highest = rows.reduce((max, p) => Math.max(max, Number(p.id.slice(3))), 10000)
  return `PR-${highest + 1}`
}

// ═══════════════════ already written — no zod past here ═══════════════════

/** The rows currently in memory. Empty until loadPatients() works. */
export function getPatients(): Patient[] {
  return rows
}

/** Lets the checks and your own code reset the in-memory table. */
export function setPatients(next: Patient[]): void {
  rows = next
}

export type SortKey = 'visit' | 'name' | 'age'

export type Query = {
  search: string
  status: Status | 'all'
  sort: SortKey
}

function matches(patient: Patient, needle: string): boolean {
  if (!needle) return true
  const haystack = `${patient.name} ${patient.id} ${patient.email} ${patient.ward}`
  return haystack.toLowerCase().includes(needle)
}

const comparators: Record<SortKey, (a: Patient, b: Patient) => number> = {
  visit: (a, b) => b.visit.localeCompare(a.visit), // most recent first
  name: (a, b) => a.name.localeCompare(b.name),
  age: (a, b) => b.age - a.age,
}

export function queryPatients(query: Query, source: Patient[] = rows): Patient[] {
  const needle = query.search.trim().toLowerCase()
  return source
    .filter((p) => (query.status === 'all' || p.status === query.status) && matches(p, needle))
    .sort(comparators[query.sort])
}

/** Row counts per status, for the filter chips. */
export function countByStatus(source: Patient[] = rows): Record<Status | 'all', number> {
  const counts = { all: source.length } as Record<Status | 'all', number>
  for (const patient of source) {
    counts[patient.status] = (counts[patient.status] ?? 0) + 1
  }
  return counts
}
