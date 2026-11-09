import { AllergyListSchema, AllergySchema, NewAllergySchema, NewPatientSchema, PatientChangesSchema, PatientListSchema, PatientSchema, type NewAllergy, type NewPatient, type PatientChanges } from "@/Schema/schema";
import { fail, request, toFieldErrors } from "./client";
import z from "zod";

/** Today as "YYYY-MM-DD", the format z.iso.date() expects. */
const today = () => new Date().toISOString().slice(0, 10)

export  async function  getPatients(){
  return await request('GET', '/patients', PatientListSchema)
}
export async function getPatientById(id: string){
  return await request('GET',`/patients/${id}`,PatientSchema)
}

/** POST /patients: validate, add the next PR- id and today's visit, then send. */
export async function newPatientAdd(body:NewPatient) {
  // 1. validate first, so bad input never makes a request
  const input = NewPatientSchema.safeParse(body)
  if(!input.success) return fail('Data Submitted is not clean',toFieldErrors(input.error))

  // 2. find the highest existing number and add 1
  const all = await getPatients()
  if(!all.ok) return all
  const maxVal = Math.max(10000, ...all.data.map(o=>Number(o.id.slice(3))))

  // 3. send the cleaned data (input.data, e.g. age "34" → 34) plus the generated fields
  const patient = {
    ...input.data,
    id: `PR-${maxVal + 1}`,
    visit: today(),
  }
  return await request('POST','/patients',PatientSchema,patient)
}

/** PATCH /patients/:id: send only the fields that changed. */
export async function updatePatient(id:string,body:PatientChanges){
  const input = PatientChangesSchema.safeParse(body)
  if(!input.success) return fail('Data Submitted is not clean',toFieldErrors(input.error))
  return await request('PATCH',`/patients/${id}`,PatientSchema,input.data)
}

export async function removePatient(id:string){
  return await request('DELETE',`/patients/${id}`,z.object({}))
}


export async function getAllAlergies(){
  return await request('GET','/allergies',AllergyListSchema)
}

/** POST /allergies: validate, add today's recordedAt; the server numbers the id. */
export async function newAllergyAdd(body:NewAllergy){
  const input = NewAllergySchema.safeParse(body)
  if(!input.success) return fail('Data Submitted is not clean',toFieldErrors(input.error))

  const allergy = {
    ...input.data,
    recordedAt: today(),
  }
  return await request('POST','/allergies',AllergySchema,allergy)
}
