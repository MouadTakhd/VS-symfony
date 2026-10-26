// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE 3 — login
//
// No server, no real authentication: the exercise is validating the form with
// zod and reporting errors per field. The sign-in button calls validateLogin()
// and only navigates if you return ok.
//
// (The "Clinic SSO" button on the login page bypasses this, so you can always
// get into the app while this is half-written.)
// ─────────────────────────────────────────────────────────────────────────────
import { z } from 'zod'

// Flat rather than a discriminated union, for the same reason as in db.ts:
// narrowing on `result.ok` needs strictNullChecks, which is off for now.
export type LoginResult = {
  ok: boolean
  email: string
  remember: boolean
  /** Empty when ok. Keyed by field name: { password: "Too short" }. */
  fieldErrors: Record<string, string>
}

/* ---------- TODO 3a: the schema ---------- */

// The form gives you `{ email, password, remember }` — two strings and a
// boolean, none of them checked.
//
// Rules to encode:
//   email     a valid email address, and it must end in "@clinic.ma"
//             (staff only). One way: z.email() then `.refine()`. Another:
//             `.endsWith()`. Try both and keep the one whose error message
//             you prefer — you can pass your own message as the second
//             argument to .refine(), or as { message } to most checks.
//   password  at least 8 characters
//   remember  boolean, and optional — default it to false with `.default()`
//             so the caller may leave it out entirely
//
// Start from `z.object({ ... })`, same as in schema.ts.
export const LoginSchema = z.object({
  email: z.string().email().refine(val=>val.endsWith('@clinic.ma'),{message:'email should end with @clinique.ma'}),
  password:z.string().min(8),
  remember:z.boolean().default(false)
})

/* ---------- TODO 3b: the check ---------- */

/**
 * Validate the submitted form.
 *
 * Steps:
 *   1. `LoginSchema.safeParse(input)`.
 *   2. On failure, return `{ ok: false, fieldErrors }` where the keys are
 *      "email" / "password". `issue.path[0]` is the field.
 *
 *      Watch out: an error from a `.refine()` on the whole object has an EMPTY
 *      path, so it belongs to no field. Decide where it should show — the
 *      email row, or a form-level message — and handle it deliberately. If you
 *      refine the email field itself rather than the object, the path stays
 *      "email" and this problem goes away. That difference is worth feeling.
 *   3. On success, return `{ ok: true, email, remember }` from `result.data`.
 *
 * There is no password to check against: if it parses, the user is in.
 */
type LoginValues = z.infer<typeof LoginSchema>;

export function validateLogin(input: LoginValues): LoginResult {
  const value= LoginSchema.safeParse(input)
  
  if(!value.success){
      const flat = z.flattenError(value.error).fieldErrors
      const fieldErrors: Record<string, string> = {}

       for(const[field,message] of Object.entries(flat)){
        fieldErrors[field]=message[0]
      }
        
    return {
      ok:false,
      email:'',
      remember:false,
      fieldErrors
    }
  }
  return {
    ok: true,
    email: value.data.email,
    remember: value.data.remember,
    fieldErrors:{}
  }
}
