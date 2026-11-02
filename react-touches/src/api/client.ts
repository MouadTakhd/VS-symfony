import { env } from "@/config/env"
import type { UrlMethod } from "@/schema"
import z from "zod"

export type ApiResult<T = unknown> = {
    ok: true,
    data: T
} | { ok:false,message:string,fieldErrors:Record<string , string> }


export function  fail(message:string,  fieldErrors:Record<string,string>={}) {
    return {ok:false,message,fieldErrors} as const  
    
}
export function toFieldErrors ( error:z.ZodError): Record<string,string> {
    const out:Record<string,string>  = {}
    for(const issue of error.issues){
        out[issue.path.join('.')] ??= issue.message
    }
    return out
}
export async function request<T>(method: UrlMethod ,url:string,schema:z.ZodType<T>,body?:unknown) : Promise<ApiResult<T>>{
    let response 
    try{

         response = await fetch(env.API_URL + url , {method,headers:body === undefined ? undefined :{'Content-Type': 'application/json'} ,body:body==undefined? undefined  : JSON.stringify(body)  })
    }catch{
        return fail('server is not working rn ')
    }
    if(!response.ok){
        return fail(`HTTP ${response.status}`)
    }
    const parsed= schema.safeParse( await response.json())
    if(!parsed.success) return fail('undexpected data',toFieldErrors(parsed.error))
    return {ok:true,data:parsed.data}
 }