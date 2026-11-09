import { z } from 'zod'

// One schema per shape. Every type in the app comes from here (see src/types.ts).
// z.input<…>  = what goes IN (form strings, e.g. age "34")
// z.infer<…>  = what comes OUT after parsing (age 34, trimmed strings)

/* ---------- enums ---------- */
export const StatusSchema = z.enum(['stable', 'observation', 'urgent', 'critical', 'discharged'], {
  error: 'Pick a status',
})
export const SexSchema = z.enum(['F', 'M', 'O'], { error: 'Pick a sex' })
export const BloodSchema = z.enum(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'], { error: 'Pick a blood type' })
export const AllergyCategorySchema = z.enum(['drug', 'food', 'environmental', 'other'], { error: 'Pick a category' })
export const SeveritySchema = z.enum(['mild', 'moderate', 'severe', 'life-threatening'], { error: 'Pick a severity' })

/* ---------- reusable fields ---------- */
const isoDate = z.iso.date({ error: 'Enter a valid date' })

/** Form inputs give "" for an empty number. Plain z.coerce.number() would turn that into 0 and pass. */
const formNumber = z.preprocess(
  (v) => (typeof v === 'string' ? (v.trim() === '' ? undefined : Number(v)) : v),
  z.number({ error: 'Enter a number' }),
)

// Two levels per text field:
//   …Base  = what a STORED record must satisfy (db.json, localStorage). Kept loose on purpose:
//            tightening it would make old saved records fail to load.
//   …Field = what a user may TYPE now (create / edit). All the extra rules live here.

const nameBase = z
  .string({ error: 'Name is required' })
  .trim()
  .min(3, 'Name must be at least 3 characters')
  .max(60, 'Name must be at most 60 characters')

const nameField = nameBase
  // \p{L} = any letter in any alphabet (é, ç, Arabic…), so "Lina Berrada" and "Aït-Ali" pass
  .refine((v) => /^[\p{L}][\p{L}\s'.-]*$/u.test(v), "Name can only contain letters, spaces, ' and -")
  .refine((v) => v.split(/\s+/).length >= 2, 'Enter first and last name')

const emailField = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Enter a valid email, e.g. sara@example.com' }))

const wardBase = z
  .string({ error: 'Ward is required' })
  .trim()
  .min(2, 'Ward must be at least 2 characters')
  .max(40, 'Ward must be at most 40 characters')

const wardField = wardBase
  .refine((v) => /^[\p{L}\d][\p{L}\d\s&'-]*$/u.test(v), 'Ward can only contain letters, numbers, spaces, & and -')
  .refine((v) => /\p{L}/u.test(v), 'Ward must contain letters, not only numbers')

/** Whole years between an ISO birth date and today. */
export function ageFromBirthDate(birthDate: string, today = new Date()): number {
  // read the parts directly: new Date('2000-11-11') is UTC midnight and can shift a day locally
  const [year, month, day] = birthDate.split('-').map(Number)
  let age = today.getFullYear() - year
  const m = today.getMonth() + 1
  if (m < month || (m === month && today.getDate() < day)) age-- // birthday not reached yet this year
  return age
}

const birthDateField = isoDate
  .refine((v) => new Date(v) <= new Date(), 'Birth date cannot be in the future')
  .refine((v) => ageFromBirthDate(v) <= 120, 'Birth date is more than 120 years ago')

/* ---------- patients ---------- */
export const PatientSchema = z.object({
  id: z.string().regex(/^PR-\d+$/, 'Expected an id like PR-10428'),
  name: nameBase,
  email: emailField,
  age: z.number().int('Age must be a whole number').min(0, 'Age cannot be negative').max(120, 'Age must be 120 or less'),
  sex: SexSchema,
  blood: BloodSchema,
  ward: wardBase,
  visit: isoDate,
  status: StatusSchema,
  birthDate: birthDateField,
})
export const PatientListSchema = z.array(PatientSchema)

/** Create: the store assigns `id` and `visit`. Accepts form strings (age "34" → 34). */
export const NewPatientSchema = PatientSchema.omit({ id: true, visit: true }).extend({
  name: nameField,
  ward: wardField,
  age: formNumber.pipe(PatientSchema.shape.age),
})
/** Update: any subset of the editable fields. */
export const PatientChangesSchema = NewPatientSchema.partial()

/* ---------- rules that need the other patients ---------- */
// A field schema only sees its own value, so "no other patient has this name / email" needs
// the current list. These factories build the final schemas with that list baked in.
// Used by the form (live, while typing) and by the store (the final word): one rule, two places.

export const DUPLICATE_NAME = 'A patient with this name already exists'
export const DUPLICATE_EMAIL = 'Another patient already uses this email'
export const AGE_MISMATCH = "Age doesn't match the birth date"

/** "  Sara   ALAOUI " and "sara alaoui" count as the same name. */
export const normalizeName = (name: string): string => name.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
const normalizeEmail = (email: string): string => email.trim().toLowerCase()

type Existing = Pick<z.infer<typeof PatientSchema>, 'id' | 'name' | 'email'>

const others = (patients: readonly Existing[], ignoreId?: string) => patients.filter((p) => p.id !== ignoreId)

/** The name field, plus: must not match another patient's name. `ignoreId` = the patient being edited. */
export function uniqueNameSchema(patients: readonly Existing[], ignoreId?: string) {
  const taken = new Set(others(patients, ignoreId).map((p) => normalizeName(p.name)))
  return nameField.refine((name) => !taken.has(normalizeName(name)), DUPLICATE_NAME)
}

/** The email field, plus: must not be used by another patient. */
export function uniqueEmailSchema(patients: readonly Existing[], ignoreId?: string) {
  const taken = new Set(others(patients, ignoreId).map((p) => normalizeEmail(p.email)))
  return emailField.refine((email) => !taken.has(normalizeEmail(email)), DUPLICATE_EMAIL)
}

/* ---------- cross-field rule: age ↔ birth date ---------- */
// Lives on the object (it needs two fields) and reports on `age`.
// `when`: zod 4 skips object refinements while ANY field is invalid; this makes it run as soon
// as just age and birthDate are valid, so the error shows live even with other fields empty.
const AgeAndBirthDate = z.object({ age: z.number(), birthDate: isoDate }).partial()

const ageMatchesBirthDate = (p: { age?: number; birthDate?: string }): boolean =>
  p.age === undefined || p.birthDate === undefined || p.age === ageFromBirthDate(p.birthDate)

const ageCheckParams = {
  error: AGE_MISMATCH,
  path: ['age'],
  when: (payload: { value: unknown }) => AgeAndBirthDate.safeParse(payload.value).success,
}

export const newPatientSchemaFor = (patients: readonly Existing[]) =>
  NewPatientSchema.extend({
    name: uniqueNameSchema(patients),
    email: uniqueEmailSchema(patients),
  }).refine(ageMatchesBirthDate, ageCheckParams)

export const patientChangesSchemaFor = (patients: readonly Existing[], id: string) =>
  PatientChangesSchema.extend({
    name: uniqueNameSchema(patients, id).optional(),
    email: uniqueEmailSchema(patients, id).optional(),
  }).refine(ageMatchesBirthDate, ageCheckParams)

/* ---------- allergies (each one belongs to a patient) ---------- */
export const AllergySchema = z.object({
  id: z.number().int().positive(),
  patientId: PatientSchema.shape.id,
  substance: z.string().trim().min(2).max(60), // "Penicillin", "Peanuts"
  category: AllergyCategorySchema,
  reaction: z.string().trim().min(2).max(120), // "Hives", "Anaphylaxis"
  severity: SeveritySchema,
  recordedAt: isoDate,
  notes: z.string().trim().max(500).optional(),
})
export const AllergyListSchema = z.array(AllergySchema)
/** Create: the store assigns `id` and `recordedAt`. */
export const NewAllergySchema = AllergySchema.omit({ id: true, recordedAt: true })
/** Update: any subset of fields, never the id or the owner. */
export const AllergyChangesSchema = AllergySchema.omit({ id: true, patientId: true }).partial()

/* ---------- the whole saved database (db.json / localStorage) ---------- */
export const DbSchema = z.object({ patients: PatientListSchema, allergies: AllergyListSchema })

/* ---------- types ---------- */
export type Status = z.infer<typeof StatusSchema>
export type Sex = z.infer<typeof SexSchema>
export type Blood = z.infer<typeof BloodSchema>
export type AllergyCategory = z.infer<typeof AllergyCategorySchema>
export type Severity = z.infer<typeof SeveritySchema>

export type Patient = z.infer<typeof PatientSchema>
/** What a form / caller may send (strings allowed where coerced). */
export type NewPatientInput = z.input<typeof NewPatientSchema>
/** What the store keeps after parsing. */
export type NewPatient = z.infer<typeof NewPatientSchema>
export type PatientChangesInput = z.input<typeof PatientChangesSchema>
export type PatientChanges = z.infer<typeof PatientChangesSchema>

export type Allergy = z.infer<typeof AllergySchema>
export type NewAllergy = z.input<typeof NewAllergySchema>
export type AllergyChanges = z.input<typeof AllergyChangesSchema>

export type Db = z.infer<typeof DbSchema>
