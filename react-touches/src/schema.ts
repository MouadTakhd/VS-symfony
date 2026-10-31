import { z } from 'zod'
/* ---------- constants ---------- */
export const StateSchema = z.enum(['done','next','pending'])
export const StatusSchema = z.enum(['stable', 'observation', 'urgent', 'critical', 'discharged'])
export const SexSchema = z.enum(['F', 'M', 'O'])
export const BloodSchema = z.enum(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'])
export const RoleSchema = z.enum(['Internal medicine', 'Pediatrics','Maternity','Intensive care'])
export const IconNameSchema = z.enum([
  "logo",
  "dashboard",
  "users",
  "calendar",
  "settings",
  "search",
  "bell",
  "menu",
  "close",
  "logout",
  "plus",
  "chevronDown",
  "arrowUp",
  "arrowDown",
  "file",
  "heart",
  "building",
]);
/* ---------- appointments ---------- */

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
})
const DoctorBaseSchema=z.object({
  id:z.string().regex(/^DR-\d+$/,'Expected an id like DR-1231334'),
  name:z.string().trim().min(3).max(60),
  lastName:z.string().trim().min(3).max(60),
  gender:SexSchema,
  role:RoleSchema
})
const DoctorSchema=DoctorBaseSchema.transform((p)=>({...p , title:p.gender =='F'? "Ms":"Mr" }))
const HourMinute = z.string().regex(
  /^([01]\d|2[0-3]):[0-5]\d$/,
  "Time must be in HH:mm format"
);
export const AppointmentStateSchema = z.enum(['done', 'now', 'next'])
export const AppointmentSchema = z.object({
  id: z.number().int().positive(),
  patientId: PatientSchema.shape.id,
  date: z.iso.date(),
  time: z.iso.time({ precision: -1 }), // "09:30"
  reason: z.string().min(1),
  room: z.string().min(1),
  state: AppointmentStateSchema,
})
const Method = z.enum(['GET' , 'POST' ,'PUT' , 'PATCH' , 'DELETE'])
const WardSchema =z.object({
  name:RoleSchema,
  used:z.number().int().default(0),
  total:z.number().int().default(0)
})

const ScheduleSchema=z.array(z.object({
  time:HourMinute,
  patient:PatientSchema.shape.id,
  reason:StatusSchema,
  room:z.string(),
  state:StateSchema
}))
const ActivitySchema= z.object({
  who:DoctorBaseSchema.shape.id,
  what:z.string(),
  when:HourMinute,
  icon:IconNameSchema,
})
export const NewPatientSchema = PatientSchema.omit({ id: true, visit: true }).extend({
  age: z.coerce.number().int().min(0).max(120),
})
export const PatientChangesSchema = PatientSchema.omit({ id: true }).partial()
export const PatientListSchema = z.array(PatientSchema)


export type Appointment = z.infer<typeof AppointmentSchema>
export type UrlMethod = z.infer<typeof Method>
export type Status = z.infer<typeof StatusSchema>
export type Sex = z.infer<typeof SexSchema>
export type Blood = z.infer<typeof BloodSchema>
export type Patient = z.infer<typeof PatientSchema>
export type NewPatient = z.input<typeof NewPatientSchema>
export type PatientChanges = z.infer<typeof PatientChangesSchema>
export type Doctor = z.infer<typeof DoctorSchema>
export type Schedule= z.infer<typeof ScheduleSchema>
export type Activity = z.infer<typeof ActivitySchema>
export type Wards= z.infer<typeof WardSchema>