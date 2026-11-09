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

const nameField = z
  .string({ error: 'Name is required' })
  .trim()
  .min(3, 'Name must be at least 3 characters')
  .max(60, 'Name must be at most 60 characters')

/* ---------- patients ---------- */
export const PatientSchema = z.object({
  id: z.string().regex(/^PR-\d+$/, 'Expected an id like PR-10428'),
  name: nameField,
  email: z.email({ error: 'Enter a valid email' }),
  age: z.number().int('Age must be a whole number').min(0, 'Age cannot be negative').max(120, 'Age must be 120 or less'),
  sex: SexSchema,
  blood: BloodSchema,
  ward: z.string().trim().min(2, 'Ward must be at least 2 characters').max(40, 'Ward must be at most 40 characters'),
  visit: isoDate,
  status: StatusSchema,
  birthDate: isoDate.refine((value) => new Date(value) <= new Date(), 'Birth date cannot be in the future'),
})
export const PatientListSchema = z.array(PatientSchema)

/** Create: the store assigns `id` and `visit`. Accepts form strings (age "34" → 34). */
export const NewPatientSchema = PatientSchema.omit({ id: true, visit: true }).extend({
  age: formNumber.pipe(PatientSchema.shape.age),
})
/** Update: any subset of the editable fields. */
export const PatientChangesSchema = NewPatientSchema.partial()

/* ---------- unique patient name ---------- */
// A schema only sees one value, so "no other patient has this name" needs the current list.
// These factories build a schema with that list baked in. Used by the form (live, while
// typing) and by the store (the final word), so both apply exactly the same rule.

export const DUPLICATE_NAME = 'A patient with this name already exists'

/** "  Sara   ALAOUI " and "sara alaoui" count as the same name. */
export const normalizeName = (name: string): string => name.trim().replace(/\s+/g, ' ').toLocaleLowerCase()

type NameOwner = Pick<z.infer<typeof PatientSchema>, 'id' | 'name'>

/** The name field, plus: must not match another patient's name. `ignoreId` = the patient being edited. */
export function uniqueNameSchema(patients: readonly NameOwner[], ignoreId?: string) {
  const taken = new Set(patients.filter((p) => p.id !== ignoreId).map((p) => normalizeName(p.name)))
  return nameField.refine((name) => !taken.has(normalizeName(name)), DUPLICATE_NAME)
}

export const newPatientSchemaFor = (patients: readonly NameOwner[]) =>
  NewPatientSchema.extend({ name: uniqueNameSchema(patients) })

export const patientChangesSchemaFor = (patients: readonly NameOwner[], id: string) =>
  PatientChangesSchema.extend({ name: uniqueNameSchema(patients, id).optional() })

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
