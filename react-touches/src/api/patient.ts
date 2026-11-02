import { PatientListSchema, type NewPatient } from "@/schema";
import { request } from "./client";

export  async function  getPatient(){
  return await     request('GET', '/patients?_sort=visit&_order=desc', PatientListSchema)
}
export async function getPatientById(id: number){
  return await request('GET',`/patients/${id}`,PatientListSchema)
}
export async function newPatientAdd(body:NewPatient) {
  
  
}