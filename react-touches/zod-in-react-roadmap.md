# Zod in React — roadmap

You already have the zod half done: `src/schema.ts`, `src/db.ts`, `src/auth.ts`.
None of them import anything from the DOM or from React, so they move over
as-is. This roadmap is about **plugging those schemas into React components**.
Pages, routing and layout are yours. Go in order; each step builds on the one before.

The old vanilla entry point is kept at `src/main.vanilla.ts.txt`, and the old
pages are still in `src/pages/*.ts` and `src/ui/*.ts`. Use them as a reference
for markup and Tailwind classes while you port each page.

---

## 0. Get it running

```bash
cd patient-registry
npm install          # pulls react, react-dom, @vitejs/plugin-react, @types/*
npm run dev          # should show "React is wired up…"
npm run check        # your zod exercises — keep this green the whole way
```

What changed: `vite.config.ts` (react plugin), `tsconfig.json` (`"jsx": "react-jsx"`),
`index.html` (now loads `src/main.tsx`), `package.json` (deps).

---

## 1. Types come from schemas, never by hand

Every prop type that describes data should come from `z.infer`:

```tsx
import type { Patient, Status } from './schema.ts'

function PatientRow({ patient }: { patient: Patient }) { … }
function StatusChip({ status }: { status: Status }) { … }
```

If you catch yourself writing `type Patient = { name: string; … }` in a
component file, stop and import it from `schema.ts` instead.

**Learn the input/output split now, it comes up again in steps 4–5:**

| | meaning | example |
|---|---|---|
| `z.input<typeof S>`  | what you *feed* the schema   | `age: unknown`, `remember?: boolean` |
| `z.output<typeof S>` (= `z.infer`) | what you *get back* | `age: number`, `remember: boolean` |

> Bug to fix while you're here: `validateLogin(input: LoginValues)` in
> `auth.ts` uses `z.infer`, so `remember` is required, but the `.default(false)`
> exists to make it optional. Change it to `z.input<typeof LoginSchema>`.

---

## 2. Load the data: safeParse at the edge, plain types inside

`loadPatients()` already does the fetch and the `safeParse`. In React, call it
**once** and keep three states:

```tsx
type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string; issues: string[] }
  | { kind: 'ready'; rows: Patient[] }
```

- Call it from a `useEffect` in `App` (or a `usePatients()` hook), then `setState`.
- Show `issues` in the error state. Break a record in `public/data/patients.json`
  to check that the page tells you *which row and which field* is wrong.
- **Rule:** validate once when data comes in. After that, components trust the
  `Patient` type and never re-parse in render.

Stretch: put the rows in a context (`PatientsProvider`) so every page reads the
same list, including rows added in step 5.

---

## 3. Routing (your call)

Either keep the hash router idea from the vanilla `main` (a `useHash()` hook
plus a `switch`), or install `react-router`. Nothing here depends on zod,
except one thing:

**Validate the URL too.** Query params are untrusted strings, just like JSON:

```ts
const FilterSchema = z.object({
  status: StatusSchema.optional().catch(undefined),   // ?status=urgnt → ignored, no crash
  q: z.string().trim().max(60).catch(''),
})
const filters = FilterSchema.parse(Object.fromEntries(new URLSearchParams(search)))
```

`.catch()` gives you a fallback instead of an error, which is what you want for URLs.
Pass the result to `queryPatients()`.

---

## 4. Login form: your first zod-validated form

Build it with **plain React first**, no form library, so you can see what one would do for you.

1. Keep form values in state as `z.input<typeof LoginSchema>`.
2. On submit: `e.preventDefault()`, then `validateLogin(values)`.
3. Keep `fieldErrors` in state as `Record<string, string>` and render
   `fieldErrors.email` under the email input, and so on.
4. On `ok`, navigate to the dashboard.

Things to try on purpose:
- Move the `@clinic.ma` check to a `.refine()` on the **object** instead of on the
  field. Watch the error land on `path: []` and disappear from the email row.
  Then fix it with `{ path: ['email'] }` in the refine options.
- The message says `@clinique.ma` but the check is `@clinic.ma`. Make them agree.
- Compare `z.flattenError(err).fieldErrors` with `z.treeifyError(err)` and see
  which one you like better for flat forms vs nested ones.

Alternative to controlled inputs: read the form with
`Object.fromEntries(new FormData(e.currentTarget))` and feed that to `safeParse`.
A checkbox then arrives as `"on"` or missing, so you'll need
`z.preprocess(v => v === 'on', z.boolean())` or `z.stringbool()`. Good practice.

---

## 5. New-patient form: coercion and server-shaped errors

`<input type="number">` still gives you a **string**. That's why
`NewPatientSchema` uses `AgeSchema = z.coerce.number()…`.

1. Form state is `z.input<typeof NewPatientSchema>` (age will be `unknown`, so store the raw string).
2. Submit, then `addPatient(values)`, which returns `{ ok, patient, message, fieldErrors }`.
3. On ok: add `patient` to your list state/context, reset the form, close the modal.
4. On fail: show `message` at the top and each `fieldErrors[field]` under its input.
5. Populate the `<select>`s from `SexSchema.options`, `BloodSchema.options` and
   `STATUSES`, so the dropdowns can never drift from the schema.

---

## 6. Validate as you type (per field)

Re-using the same schema for a single field:

```ts
const result = NewPatientSchema.shape.email.safeParse(value)
```

- Validate on `onBlur`, and only show errors for fields the user has *touched*.
  Showing errors on the first keystroke feels hostile.
- After the first failed submit, switch to `onChange` validation.
- Create a small `useZodForm(schema)` hook that gives you
  `{ values, errors, touched, setField, handleSubmit }`. Writing it yourself once
  is the best way to understand step 7.

---

## 7. Then swap in a form library (optional)

```bash
npm i react-hook-form @hookform/resolvers
```

```tsx
const form = useForm<z.input<typeof NewPatientSchema>, unknown, NewPatient>({
  resolver: zodResolver(NewPatientSchema),
})
```

Compare it with your hand-written hook from step 6: same schema, much less code.
Now you know what the library is doing for you.

---

## 8. Persist added patients (localStorage)

`db.ts` says rows vanish on reload. Fix it:
- Write: `localStorage.setItem('patients', JSON.stringify(rows))`
- Read: `JSON.parse` gives `any`. **Validate it with `PatientListSchema.safeParse`**,
  exactly like the fetch. A stale or hand-edited value must not crash the app.
- Bonus: wrap with `z.object({ version: z.literal(1), rows: PatientListSchema })`
  so a future schema change can detect old data.

---

## 9. Turn `strict` on

Set `"strict": true` in `tsconfig.json` and fix the errors. Then:
- Turn `LoadResult` / `AddResult` / `LoginResult` into discriminated unions
  (`{ ok: true; … } | { ok: false; … }`). The comments in `db.ts` and `auth.ts` explain why they're flat for now.
- Delete `src/pages`, `src/ui` and `main.vanilla.ts.txt` once every page is ported.

---

## Rules of thumb

- **Zod lives at the boundaries:** fetch, URL, forms, localStorage. Inside, trust the types.
- `safeParse` for user and data input, `parse` only where failure means a bug.
- One schema → types (`z.infer`), dropdown options (`.options`), field checks (`.shape.x`).
- Never `as Patient[]`. If you need a cast, you need a parse.
- Keep `npm run check` passing; it tests the same functions your components call.
