# Zod roadmap — adding validation to the static Patient Registry

> **Status (2026-11-09): steps 1–5 are done** for patients, plus a unique-name rule:
> - `src/schema/schema.ts`: messages on every field, `formNumber` (empty age ≠ 0), `DbSchema`,
>   and `uniqueNameSchema` / `newPatientSchemaFor` / `patientChangesSchemaFor` (name can't match
>   another patient, ignoring case and extra spaces).
> - `src/types.ts`: only re-exports `z.infer` / `z.input` types + `…Schema.options`.
> - `src/data/store.ts`: every write is parsed (unique name included); `load()` parses localStorage
>   and db.json with `DbSchema` instead of casting.
> - `patients.ts`: submit → `safeParse` → field errors under each input → store gets `parsed.data`.
>   The name is checked while typing: a duplicate shows instantly, length errors after the first blur.
>
> - Step 6 + part of 8 (2026-11-09): every patient field has extra rules (letters-only name with
>   first + last, unique email, ward format, birth date ≤ 120 years ago, age must match birth date),
>   all checked live while typing. Stored records use the looser `…Base` rules so old data still loads.
>
> Next up: step 7 (allergy forms), the rest of step 8 (polish).

The app is now **fully static**: no server, no `.env`, no `fetch`.

```
src/data/db.json     seed data (the old db.json)
src/data/store.ts    the only data source: getPatients, createPatient, updatePatient, deletePatient,
                     getAllergies, getAllergiesFor, createAllergy, updateAllergy, deleteAllergy, resetData
                     → async, returns ApiResult, saves every change to localStorage
src/types.ts         plain TS types (Patient, Allergy, NewPatient, ApiResult …) — no runtime checks
src/Schema/schema.ts your zod schemas — kept, not used yet. This roadmap wires them in.
```

Right now **nothing is validated at runtime**: forms rely on the browser's `required` / `min` /
`type="email"`, and the store trusts whatever it's given. Zod goes in at the **boundaries**,
the places where data enters from somewhere TypeScript can't see:

| Boundary | Where | Schema |
|---|---|---|
| Form → app | `pages/*.ts` submit handlers | `NewPatientSchema`, `PatientChangesSchema`, `NewAllergySchema` |
| App → store | `store.ts` create/update functions | same as above (defence in depth) |
| localStorage / db.json → app | `store.ts` `load()` | `DbSchema` (new) |
| Server → app *(later, if you add a backend again)* | `request()` | `PatientListSchema`, … |

Don't validate inside rendering code or between your own functions — TypeScript already covers that.

Each step: **build** → **done when**. Run `pnpm dev`; reset data at any time with
`localStorage.clear()` in the browser console + reload.

---

### Step 1: Clean up the schema file

1. Rename `src/Schema/` → `src/schema/` (lower-case like every other folder; on Windows a
   case-only rename needs two steps: `git mv src/Schema src/schema-tmp && git mv src/schema-tmp src/schema`).
2. Compare `schema.ts` with `src/types.ts` field by field — they must describe the same shapes.
3. Give the enums human messages (zod 4 uses `error`, not `message`):
   ```ts
   export const SexSchema = z.enum(['F', 'M', 'O'], { error: 'Pick a sex' })
   ```
4. Fix the `age` gotcha: `z.coerce.number()` turns an empty input `""` into `0`, which passes `.min(0)`.
   ```ts
   const formNumber = z.preprocess((v) => (v === '' ? undefined : v), z.coerce.number())
   age: formNumber.pipe(z.number().int().min(0).max(120)),
   ```
5. Delete `Method` / `UrlMethod` (no HTTP any more; bring them back in step 9 if you need them).

**Done when:** `NewPatientSchema.safeParse({ age: '' , … })` fails on `age` (try it in a scratch file or the console).

### Step 2: Types come from schemas, not by hand

Replace the hand-written interfaces in `src/types.ts`:

```ts
export type { Patient, NewPatient, PatientChanges, Allergy, NewAllergy, AllergyChanges } from '@/schema/schema'
export const STATUSES = StatusSchema.options   // same for SEXES, BLOOD_TYPES, …
// ApiResult stays here — it isn't data
```

Watch for `z.infer` vs `z.input`: a form gives `age: "34"` (input), the store keeps `age: 34`
(output). `NewPatient` is already `z.input<…>` in your schema file, so that's correct.

**Done when:** `src/types.ts` has no `interface` left, and `tsc -b` passes.

### Step 3: Validate the patient form

1. Add a small helper, `src/lib/validation.ts`:
   ```ts
   import type { z } from 'zod'
   export function toFieldErrors(error: z.ZodError): Record<string, string> {
     const out: Record<string, string> = {}
     for (const issue of error.issues) out[issue.path.join('.') || '_'] ??= issue.message
     return out
   }
   ```
2. In `patients.html`, put an error slot under every input:
   `<p data-error-for="email" hidden class="mt-1 text-xs text-red-600"></p>` + one `data-error-for="_"`.
3. In `patients.ts`, delete `readPatientForm()` and the `reportValidity()` line, then:
   ```ts
   const parsed = NewPatientSchema.safeParse(formValues($.newForm))
   if (!parsed.success) return showErrors($.newForm, toFieldErrors(parsed.error))
   showErrors($.newForm, {})               // clear old errors
   const result = editingId ? await updatePatient(editingId, parsed.data) : await createPatient(parsed.data)
   ```
4. Keep `novalidate` on the form so zod's messages show, not the browser's bubbles.

**Done when:** submitting an empty form shows a message under every field, a birth date in the
future shows "Birth date cannot be in the future", and a valid form still saves.

### Step 4: Validate inside the store too

The form isn't the only caller: the console, future pages and tests can call the store. Give each
write function the same guard your old `api/patient.ts` had:

```ts
export async function createPatient(body: NewPatient): Promise<ApiResult<Patient>> {
  const input = NewPatientSchema.safeParse(body)
  if (!input.success) return fail('Invalid patient', toFieldErrors(input.error))
  // … then use input.data, never body
}
```

Do the same for `updatePatient` (`PatientChangesSchema`), `createAllergy` (`NewAllergySchema`),
`updateAllergy` (`AllergyChangesSchema`). The old file is backed up at
`legacy/patient.ts` for reference.

**Done when:** `createPatient({ name: 'x' } as any)` returns `ok: false` with `fieldErrors`,
and `localStorage` is unchanged.

### Step 5: Validate what you load (localStorage + seed)

`load()` currently does `JSON.parse(saved) as Db`, which is a lie the compiler believes. Replace the cast:

```ts
const DbSchema = z.object({ patients: PatientListSchema, allergies: AllergyListSchema })

function load(): Db {
  const saved = DbSchema.safeParse(readJson(localStorage.getItem(STORAGE_KEY)))
  if (saved.success) return saved.data
  if (saved.error) console.warn('Saved data is invalid, using db.json:\n' + z.prettifyError(saved.error))
  return DbSchema.parse(seed)   // throws on a broken db.json, which is what you want
}
```

Also drop the `as unknown as Db` casts: `DbSchema.parse(seed)` gives you the right type.

**Done when:** editing a patient's `sex` to `"X"` in DevTools → Application → localStorage and
reloading logs a readable warning and falls back to the seed instead of rendering garbage.
Note: the seed patient `PR-10430` (born 2026-10-02, age 20) is valid today but will fail step 6.

### Step 6: Cross-field rules

Rules that involve two fields go on the object with `.superRefine` (or `.check` in zod 4):

```ts
.superRefine((p, ctx) => {
  const years = ageFrom(p.birthDate)
  if (Math.abs(years - p.age) > 1) ctx.addIssue({ code: 'custom', path: ['age'], message: `Birth date says ${years}` })
})
```

Better still: **derive** `age` from `birthDate` and stop asking for it in the form.
Rules that need *other records*, like "allergy.patientId must exist" or "no duplicate email",
stay in `store.ts`, because a schema only sees one value.

Careful: `.omit()` / `.partial()` / `.extend()` can't be used on a refined schema in zod 4.
Keep a `PatientBase` object, derive `NewPatientSchema` etc. from it, and add the refinement to each.

**Done when:** age 70 + birth date 2000 shows an error under Age; fix the bad seed record.

### Step 7: Allergy forms

Build the allergy pages (`allergies.html` is empty; also rename `alergies.html` → `allergies.html`
so it matches the navbar link) with the same pattern as step 3:

- `<select>` options generated from `SeveritySchema.options` / `AllergyCategorySchema.options`.
- Add: `NewAllergySchema.safeParse({ ...formValues(form), patientId })`.
- Inline severity change: `AllergyChangesSchema.safeParse({ severity: select.value })`.
- `notes`: empty textarea gives `""`; map it to `undefined` with
  `z.string().trim().max(500).optional().transform((s) => s || undefined)`.

**Done when:** you can add / re-grade / delete allergies, and every bad value shows a field error.

### Step 8: Messages & UX polish

- Global English messages in one place: `z.config({ customError: (iss) => … })`, or per-field `{ error: '…' }`.
- Validate one field on `blur`: `NewPatientSchema.shape.email.safeParse(input.value)`.
- Focus the first invalid field after `showErrors`.
- Use `z.flattenError(err).fieldErrors` if you'd rather have every message per field instead of the first.

**Done when:** every field validates on blur and on submit, with the same messages.

### Step 9 (later): Plugging a real API back in

Only `store.ts` changes. Each function becomes `request(method, url, ResponseSchema, body)`.
Your old `legacy/client.ts` already does that, `legacy/server.js` is the old JSON server, and `legacy/env.ts` validates
`VITE_API_URL` with zod. Pages don't change, because the store already returns `ApiResult`.

### Step 10 (optional): Test the schemas

`pnpm add -D vitest`, then `src/schema/schema.test.ts`: one valid fixture per schema plus one test
per rule (bad email, future birth date, empty age, unknown enum). Schemas are pure, so they're
the easiest code in the app to test.

---

## Rules

1. One schema per shape, in `src/schema/`. Types are `z.infer` / `z.input` of it, never hand-written.
2. `safeParse` at boundaries (forms, storage, network); never `parse` where a user can cause the failure.
3. After a successful parse, use `result.data`, never the raw input (it holds the trimmed / coerced values).
4. Rules about one record → schema. Rules about other records → store.
5. Enum options in the UI come from `Schema.options`, so a new status shows up everywhere at once.
