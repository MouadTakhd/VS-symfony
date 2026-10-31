import { PatientListSchema, type Patient } from "@/schema";
import type { ApiResult } from "./client";
import { request } from "./client";

export async function getPatients(): Promise<ApiResult> {
    return request<Patient[]>('GET', '/patients', PatientListSchema);
}