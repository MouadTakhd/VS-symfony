import { z} from 'zod'
const AppointmentType = z.enum(['consultation', 'urgent','hospitalization','chimio'])
const SexSchema = z.enum(['f','M'])
const AgeSchema = z.coerce.number().int().min(0).max(120)
export const StatusSchema = z.enum([
  'stable',
  'observation',
  'urgent',
  'critical',
  'discharged',
])

export const BloodSchema = z.enum(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'])
const PatientSchema = z.object({
   id:z.string().regex(/^PR-\d+$/),
  email:z.email(),
  name:z.string().min(3).max(60),
  sex:SexSchema,
  age:AgeSchema,
  blood:BloodSchema,
  ward:z.string().min(2).max(40),
  visit:z.iso.date(),
  status:StatusSchema,
})

export const AppointmentSchema = z.object({
  id: z.number().int().positive(),
  patientId: PatientSchema.shape.id,
  date:z.string().datetime({ 
    offset: true, 
    local: true   
    }),
  reason: z.string().min(1),
  room: z.string().min(1),
  state: AppointmentType,
})
const newPatientSchema= PatientSchema.omit({id :true,visit:true}).extend({age:AgeSchema})
export type Appointment = z.infer<typeof AppointmentSchema>
export type Patient = z.infer<typeof PatientSchema>
export type NewPatient = z.infer<typeof newPatientSchema>