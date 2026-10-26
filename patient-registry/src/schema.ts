// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 1 — the schemas
//
// The enums below are written for you. Fill in the schemas still marked TODO.
// Run `npm run check` to see how you are doing.
// ─────────────────────────────────────────────────────────────────────────────
import { z } from 'zod'

/* ---------- worked examples: read these first ---------- */

export const StatusSchema = z.enum([
  'stable',
  'observation',
  'urgent',
  'critical',
  'discharged',
])


export const BloodSchema = z.enum(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'])
export const SexSchema= z.enum(["F","M","O"]); 
export const AgeSchema = z.coerce.number().int().min(0).max(120)
// `z.infer` reads the TypeScript type back out of a schema, so the type and the
// validation can never drift apart. This is the whole point of zod.
export type Status = z.infer<typeof StatusSchema>
export type Sex = z.infer<typeof SexSchema>
export type Blood = z.infer<typeof BloodSchema>
// Still outstanding here: age needs its bounds (whole number, 0 to 120), and
// `ipp` / `birthDate` are required but appear in none of the 24 records.
export const PatientSchema = z.object({
  id:z.string().regex(/^PR-\d+$/),
  email:z.email(),
  name:z.string().min(3).max(60),
  sex:SexSchema,
  age:z.number().int().min(0).max(120),
  blood:BloodSchema,
  ward:z.string().min(2).max(40),
  visit:z.iso.date(),
  status:StatusSchema,
})

/** Chip order in the registry toolbar. `.options` is the array you passed to z.enum. */
export const STATUSES: readonly Status[] = StatusSchema.options

/** The whole database file. */
export const PatientListSchema = z.array(PatientSchema) 

/* ---------- TODO 1c: a record being created ---------- */

// The .omit() mask is right. Two things left: `.omit()` already returns a
// schema, so the z.object() around it is both unnecessary and wrong — and the
// form sends `age` as the string "34", so this is where z.coerce.number()
// belongs (PatientSchema should keep the strict z.number()).
export const NewPatientSchema = PatientSchema.omit({id:true,visit:true}).extend({age:AgeSchema})




 export type Patient = z.infer<typeof PatientSchema>
export type NewPatient = z.infer<typeof NewPatientSchema>
