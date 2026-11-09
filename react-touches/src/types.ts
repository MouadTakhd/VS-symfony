// Every data type comes from the zod schemas: change a schema and the types follow.
// Import types from here (or from '@/schema/schema' directly, same thing).

import { AllergyCategorySchema, BloodSchema, SeveritySchema, SexSchema, StatusSchema } from '@/schema/schema'

export type {
  Allergy,
  AllergyCategory,
  AllergyChanges,
  Blood,
  Db,
  NewAllergy,
  NewPatient,
  NewPatientInput,
  Patient,
  PatientChanges,
  PatientChangesInput,
  Severity,
  Sex,
  Status,
} from '@/schema/schema'

/** Option lists for <select>s and filters, straight from the enums. */
export const STATUSES = StatusSchema.options
export const SEXES = SexSchema.options
export const BLOOD_TYPES = BloodSchema.options
export const ALLERGY_CATEGORIES = AllergyCategorySchema.options
export const SEVERITIES = SeveritySchema.options

/** Every store function returns this instead of throwing. Not data, so no schema. */
export type ApiResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors: Record<string, string> }
