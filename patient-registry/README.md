# Patient registry — zod exercises

Vite + TypeScript + Tailwind + zod, no framework. The UI is finished; the data
logic is yours to write. Three functions are stubbed out, and a check harness
tells you when each one is right.

```bash
npm install
npm run dev      # http://localhost:5173
npm run check    # grades your work — start here
```

`npm run check` prints 23/65 on a fresh clone. That is the starting line.

## The exercises

| # | File | What to write |
| --- | --- | --- |
| 1a | `src/schema.ts` | `PatientSchema` — nine fields, each with a rule |
| 1b | `src/schema.ts` | `PatientListSchema` — the whole JSON file |
| 1c | `src/schema.ts` | `NewPatientSchema` — a record being created |
| 1d | `src/schema.ts` | swap the hand-written types for `z.infer` |
| 2a | `src/db.ts` | `loadPatients()` — fetch + validate the database |
| 2b | `src/db.ts` | `addPatient()` — validate a form draft and append it |
| 3 | `src/auth.ts` | `validateLogin()` — the sign-in form |

Each file has the rules written out as comments, with hints naming the zod API
to look up, but no implementations. Do them in order — 2a needs 1b, 2b needs 1c.

Everything else is already written and will light up as you go: the table,
search, status chips with counts, sorting, the add form, and the error panels.

## The data

`public/data/patients.json` — 24 records, served as a static file at
`/data/patients.json`. It is the database. Edit it and reload.

It is read-only from the browser: a page cannot write to a file on disk. So
`addPatient()` appends to an in-memory array and added rows vanish on reload.
Making them persist means `localStorage` or a real API — that is the exercise
after these.

## How to work on it

Two terminals: `npm run dev` for the app, `npm run check` after each change.

The checks are deliberately picky about *rejection*, because that is the half
that is easy to get wrong. An empty `z.object({})` accepts every record and
silently strips every field — which is exactly what the stub does now, and why
the table is empty and the amber panel is showing.

Once `loadPatients()` works, 24 rows appear. Then break a record in the JSON on
purpose — misspell a status, delete an email — and reload to see your own error
path report it. That round trip is the thing worth learning.

### Things the checks will push you towards

- **`safeParse`, not `parse`.** `parse` throws. For a data file or a form, the
  bad input is expected, not a bug — you want a value back, not an exception.
- **`z.infer`.** Write the schema, read the type out of it. Never both by hand.
- **Coercion.** `<input>` values are strings. `z.number()` rejects `"34"`;
  `z.coerce.number()` accepts it and hands you `34`.
- **`error.issues`.** Each issue has `path` and `message`. `path[0]` is the
  field name on a flat object, and the row index on an array. That is how one
  error becomes a message under the right input.
- **Where a `.refine()` error lands.** Refine the object and the path is empty,
  so it belongs to no field; refine the field and the path keeps the field name.
  Exercise 3 makes you choose.

Also worth your time once the checks pass: `z.prettifyError`, `z.flattenError`,
`z.treeifyError` — three ways to turn the same error into something readable.

## Notes on the setup

- `tsconfig.json` has `strict: false` while the UI layer is untyped. One
  consequence shows up in the exercises: `LoadResult`, `AddResult` and
  `LoginResult` are flat objects carrying every field, where a discriminated
  union (`{ ok: true, … } | { ok: false, … }`) would be the better shape. A
  union only narrows on `if (result.ok)` when `strictNullChecks` is on. Turn
  strict on later and switch them over — it is a good follow-up exercise.
- `tools/check.mjs` transpiles `src/` with `tsc` and runs your functions against
  the real zod, stubbing `fetch` with the file on disk. No test framework. Read
  it if you want to see what is being asserted.
- Native bindings are per-platform. `node_modules` here was installed from
  Windows, so running from WSL also needs the Linux ones:
  `npm i @rolldown/binding-linux-x64-gnu @tailwindcss/oxide-linux-x64-gnu`.
  Pick one platform and stick to it.

## Layout

```
├── public/data/patients.json   the database
├── src/
│   ├── schema.ts               EXERCISE 1
│   ├── db.ts                   EXERCISE 2 (+ query helpers, already written)
│   ├── auth.ts                 EXERCISE 3
│   ├── main.ts                 hash router; loads the database before first paint
│   ├── data.ts                 placeholder content for the other pages
│   ├── pages/                  one render()/wire() pair per route
│   └── ui/                     shell, buttons, badges, icons
└── tools/check.mjs             npm run check
```
