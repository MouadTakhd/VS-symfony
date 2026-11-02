import { z } from 'zod'

/* ---------- constants ---------- */
export const StatusSchema = z.enum(['stable', 'observation', 'urgent', 'critical', 'discharged'])
export const SexSchema = z.enum(['F', 'M', 'O'])
export const BloodSchema = z.enum(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'])
export const AllergyCategorySchema = z.enum(['drug', 'food', 'environmental', 'other'])
export const SeveritySchema = z.enum(['mild', 'moderate', 'severe', 'life-threatening'])
const Method = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])

/* ---------- patients ---------- */
export const PatientSchema = z.object({
  id: z.string().regex(/^PR-\d+$/, 'Expected an id like PR-10428'),
  name: z.string().trim().min(3).max(60),
  email: z.email(),
  age: z.number().int().min(0).max(120),
  sex: SexSchema,
  blood: BloodSchema,
  ward: z.string().trim().min(2).max(40),
  visit: z.iso.date(),
  status: StatusSchema,
  birthDate: z.iso.date().refine((value) => new Date(value) <= new Date(), { message: 'Birth date cannot be in the future' })
})
export const PatientListSchema = z.array(PatientSchema)
/** POST body: the API assigns `id` and `visit`. Forms send age as "34", so coerce it. */
export const NewPatientSchema = PatientSchema.omit({ id: true, visit: true }).extend({
  age: z.coerce.number().int().min(0).max(120),
})
/** PATCH body: any subset of fields, never the id. */
export const PatientChangesSchema = PatientSchema.omit({ id: true }).partial()

/* ---------- allergies (each one belongs to a patient) ---------- */
export const AllergySchema = z.object({
  id: z.number().int().positive(),
  patientId: PatientSchema.shape.id,
  substance: z.string().trim().min(2).max(60), // "Penicillin", "Peanuts"
  category: AllergyCategorySchema,
  reaction: z.string().trim().min(2).max(120), // "Hives", "Anaphylaxis"
  severity: SeveritySchema,
  recordedAt: z.iso.date(),
  notes: z.string().max(500).optional(),
})
export const AllergyListSchema = z.array(AllergySchema)
/** POST body: the server assigns `id`; set `recordedAt` to today before sending. */
export const NewAllergySchema = AllergySchema.omit({ id: true, recordedAt: true })
/** PATCH body: any subset of fields, never the id or the owner. */
export const AllergyChangesSchema = AllergySchema.omit({ id: true, patientId: true }).partial()

/* ---------- types ---------- */
export type UrlMethod = z.infer<typeof Method>
export type Status = z.infer<typeof StatusSchema>
export type Sex = z.infer<typeof SexSchema>
export type Blood = z.infer<typeof BloodSchema>
export type Patient = z.infer<typeof PatientSchema>
export type NewPatient = z.input<typeof NewPatientSchema>
export type PatientChanges = z.infer<typeof PatientChangesSchema>
export type AllergyCategory = z.infer<typeof AllergyCategorySchema>
export type Severity = z.infer<typeof SeveritySchema>
export type Allergy = z.infer<typeof AllergySchema>
export type NewAllergy = z.input<typeof NewAllergySchema>
export type AllergyChanges = z.infer<typeof AllergyChangesSchema>
