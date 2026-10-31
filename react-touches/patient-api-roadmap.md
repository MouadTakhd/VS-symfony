# Roadmap: patient functions with `ApiResult`

Work through these in order. Each step builds on the one before. Every step has
a **goal**, things to **think about**, and a **done when** check you can test
against your running server (`pnpm server`, http://localhost:3001).

---

## Step 0: Before you start

- [ ] `src/api/client.ts` exports `ApiResult<T>`, `fail`, `toFieldErrors` and `request`.
- [ ] `src/schema.ts` exports `PatientSchema`, `PatientListSchema`, `NewPatientSchema`,
      `PatientChangesSchema`, and the types made from them.
- [ ] `src/api/patient.ts` imports from both files and nothing else. It never calls `fetch` itself.

**Done when:** `patient.ts` has its imports and no red squiggles.

---

## Step 1: `getPatients()`, the simplest case

**Goal:** get all patients through `request()`.

**Think about:**
- Which HTTP method? Which path? Which schema describes **a list** of patients?
- What should the return type be? Write it out yourself, even if TypeScript could work it out.
- Does this function need `async`, or can it hand back what `request()` returns?

**Done when:** in a component, `if (result.ok)` gives you `result.data` with
autocomplete for `.name`, `.ward` and the other fields, and it logs 24 patients.

---

## Step 2: `getPatient(id)`

**Goal:** one patient by id.

**Think about:**
- The schema is different from step 1. Why?
- How do you put the id into the path?
- What should happen for an id that doesn't exist? (Answer this before testing, then check.)

**Done when:**
- `'PR-10428'` gives `ok: true`.
- `'NOPE'` gives `ok: false`, with the server's "No record…" message, not a crash.

---

## Step 3: Add filters to `getPatients`

**Goal:** `getPatients({ status: 'urgent' })`.

**Think about:**
- Define a `PatientQuery` type. Which fields from the server's filter list do you
  need: `status`, `q`, `_sort`, `_order`, `_limit`?
- How do you turn an object into `?status=urgent&_limit=5`? Look up `URLSearchParams`.
- How do you skip keys that are `undefined`?
- Can you use the `Status` type from your schema, so `'urgnt'` becomes a compile error?

**Done when:** `{ status: 'urgent' }` returns 2 patients, and `{ q: 'chraibi' }` returns 1.

---

## Step 4: `createPatient(input)`, the first write

**Goal:** POST a new patient. This is where `fail` and `toFieldErrors` come in.

**Think about, in this order:**
1. **What type is the input?** A form doesn't have `id` or `visit`. Which schema
   describes form input?
2. **Check before sending.** Run the input through that schema with `safeParse`.
   If it fails, which helper builds the failure result, and which one turns zod
   errors into field errors?
3. **Where does the `id` come from?** Your records use `PR-xxxxx`. How do you find
   the highest current one? (Hint: one of your earlier functions, with sort,
   order and limit.)
4. **That lookup can fail too.** If it returns `ok: false`, what should
   `createPatient` return? (You can pass it straight through. Why does TypeScript
   allow that?)
5. **Where does `visit` come from?** Today's date, in the format `z.iso.date()` expects.
6. **Send it.** Which method? What does the server send back, and which schema checks it?

**Done when:**
- Valid input creates the patient, and the new record appears in `db.json`.
- `email: 'nope'` returns `ok: false` with `fieldErrors.email` filled in, and
  **no request reaches the server**. Check the server log: no new POST line
  should appear.
- `age: "34"` (a string, as a form would send it) still works. Which schema
  setting allows that?

---

## Step 5: `updatePatient(id, changes)` (PATCH)

**Goal:** change only some fields.

**Think about:**
- Which schema allows "any subset of fields, but not `id`"?
- What should happen if `changes` is `{}`? Is sending an empty PATCH useful?
- What does the server send back: only the changed fields, or the whole record?

**Done when:** `updatePatient('PR-10428', { status: 'stable' })` changes only
`status` in `db.json`, and bad values like `{ age: 500 }` are rejected before sending.

---

## Step 6: `replacePatient(patient)` (PUT)

**Goal:** replace the whole record.

**Think about:**
- How is this different from PATCH? Which schema, full or partial?
- Where does the id for the URL come from?
- When would you use PUT instead of PATCH in this app? (An "edit patient" form
  that sends every field.)

**Done when:** sending a full record replaces it, and sending a record with a
field missing is rejected before it's sent.

---

## Step 7: `deletePatient(id)`

**Goal:** remove a patient.

**Think about:**
- The server sends back `{}`. What schema matches an empty object?
- `ApiResult<{}>` isn't useful to callers. What would be a cleaner type for
  "succeeded, nothing to return"?
- How do you turn the result into that type without losing the failure case?

**Done when:** the patient disappears from `db.json`, and deleting it again
returns `ok: false` with "No record…".

---

## Step 8: Use it in React

**Goal:** a real page that uses your functions.

**Think about:**
- Which states can a page be in? (loading, loaded, error.) How do you represent
  them with `useState`?
- Where do you call `getPatients`, and how do you avoid calling it on every render?
- For a form: where does `fieldErrors.email` get displayed?

**Done when:**
- A Patients page lists patients from the server.
- Stopping the server shows your "Can't reach the server…" message instead of a
  blank screen.

---

## Rules to keep in mind

1. **`patient.ts` never calls `fetch`.** It only calls `request()`.
2. **Never write a type by hand that a schema already describes.** Use `z.infer` or `z.input`.
3. **Every function returns `ApiResult<…>`** and never throws.
4. **Writes check their input before sending; reads check the response.** Both use `safeParse`.
5. **Test each step** against the running server before starting the next.
