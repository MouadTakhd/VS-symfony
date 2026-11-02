# Patient Registry — TypeScript + HTML roadmap

A Vite app with **no framework**: pages are plain `.html` files, behaviour is plain
`.ts`, data comes from the JSON database through `src/api/client.ts` and is checked
by the zod schemas in `src/schema.ts`.

**End result:** a registry where you can list, search, create, edit and delete
patients, and record, edit and remove each patient's allergies, with
life-threatening allergies flagged everywhere they matter.

---

## What is already here

```
db.json                 the database: patients (24) + allergies (10)
server/index.js         JSON database server: GET/POST/PUT/PATCH/DELETE on every collection
src/
  schema.ts             zod schemas + types: Patient, Allergy, New…, …Changes
  api/client.ts         request() + ApiResult — the only code that calls fetch
  config/env.ts         VITE_API_URL from .env, validated
  lib/router.ts         turns every pages/*.html into a route (you never edit this)
  lib/page.ts           definePage() — the shape of a page controller
  lib/dom.ts            refs(), fill(), renderList(), on(), formValues(), showErrors()
  layout.html           the shell around every page (navbar, <main data-outlet>, footer)
  partials/navbar.html  reusable HTML, inserted with <x-include src="navbar"></x-include>
  pages/home.html       #/  ← worked example: read this pair first
  pages/home.ts         its controller
  pages/404.html        shown for any URL with no page
  index.css             Tailwind + a few shared classes (.card, .badge, .nav-link)
```

---

## How the UI linking works (read once)

### 1. A page = one HTML file. The file name is the URL.

| File | URL | `params` |
|---|---|---|
| `pages/home.html` | `#/` | — |
| `pages/patients.html` | `#/patients` | — |
| `pages/patients.new.html` | `#/patients/new` | — |
| `pages/patients.$id.html` | `#/patients/PR-10428` | `{ id: 'PR-10428' }` |
| `pages/patients.$id.edit.html` | `#/patients/PR-10428/edit` | `{ id: 'PR-10428' }` |

Dots become `/`, `$name` becomes a parameter. Static names win over parameters, so
`patients/new` never gets mistaken for a patient called "new". **Nothing to register**:
create the file and the URL works. Links are ordinary `<a href="#/patients">`.

Put `data-title="Patients"` on the page's outer element to set the browser tab title.

### 2. Behaviour = a `.ts` file with the same name (optional)

```ts
// pages/patients.ts
import { definePage } from '@/lib/page'

export default definePage(async ({ root, params, navigate, signal }) => {
  // root     = this page's DOM (patients.html, already on screen)
  // params   = URL parameters ({ id } on patients.$id)
  // navigate = navigate('/patients/new')
  // signal   = aborted when the user leaves — pass it to on(...) and addEventListener
})
```

A page without a `.ts` is just static HTML. A `.ts` without an `.html` prints a warning.

### 3. Each HTML file has a typed interface: `refs()`

Mark the elements the controller needs with `data-ref`, then declare them once:

```html
<form data-ref="form">…</form>
<ul data-ref="list"></ul>
<template data-ref="row"><li>{{ name }}</li></template>
```
```ts
const patientsView = { form: HTMLFormElement, list: HTMLUListElement, row: HTMLTemplateElement }
const $ = refs(root, patientsView)
$.form.reset()        // typed as HTMLFormElement — autocomplete works
```

If someone renames or deletes `data-ref="list"` in the HTML, or turns the `<ul>` into a
`<div>`, the page fails **on load** with `HTML does not match its interface: missing
data-ref="list"` — instead of a `null` error three clicks later.

### 4. Lists: `<template>` + `renderList()`

```ts
renderList($.list, $.row, patients)                          // fills {{ name }}, {{ id }}…
renderList($.list, $.row, patients, (p) => ({ ...p, label: p.status.toUpperCase() }), '<li>No patients</li>')
```
`{{ x }}` is HTML-escaped (safe for user data). `{{{ x }}}` is raw — only for HTML you built.

### 5. Clicks on rows: `on()` (event delegation)

```html
<button data-action="delete" data-id="{{ id }}">Delete</button>
```
```ts
on(root, 'click', '[data-action="delete"]', (e, button) => remove(button.dataset.id!), signal)
```
One listener works for every row, including rows rendered later.

### 6. Forms: `formValues()` + `showErrors()`

```html
<input name="email"> <p data-error-for="email" hidden class="text-sm text-red-600"></p>
<p data-error-for="_" hidden></p>   <!-- errors for fields with no slot -->
```
```ts
const result = await createPatient(formValues($.form))
if (!result.ok) showErrors($.form, result.fieldErrors)
```

### 7. Shared HTML: partials

`src/partials/<name>.html`, used anywhere (pages, layout, other partials) with
`<x-include src="<name>"></x-include>`. Good for headers, empty states, the allergy badge legend.

---

## The API you'll call

| Method | URL | Body | Use |
|---|---|---|---|
| GET | `/patients` | — | list; filters `?status=urgent`, `?q=text`, `?_sort=visit&_order=desc`, `?_page=1&_limit=10` |
| GET | `/patients/PR-10428` | — | one patient |
| POST | `/patients` | full record **with** a new `id` and `visit` | create |
| PUT | `/patients/PR-10428` | every field | replace |
| PATCH | `/patients/PR-10428` | changed fields | update |
| DELETE | `/patients/PR-10428` | — | delete |
| GET | `/allergies?patientId=PR-10428` | — | one patient's allergies (any field filters) |
| GET | `/allergies/3` | — | one allergy |
| POST | `/allergies` | allergy without `id` (server numbers it) | create |
| PUT / PATCH / DELETE | `/allergies/3` | as above | replace / update / delete |

The server does **not** cascade: deleting a patient leaves their allergies behind unless
you delete those first (step 7).

---

## Roadmap

Each step: **build** → **done when** (test it in the browser with `pnpm server` running).

### Step 0 — Run it

1. `pnpm install` (removes React, keeps Tailwind, zod, Vite).
2. Terminal 1: `pnpm server` → `Listening on http://localhost:3001`.
3. Terminal 2: `pnpm dev` → open the URL it prints.
4. Fix the one compile error left in `src/api/client.ts`: `Patient` is imported but unused.

**Done when:** the home page shows 24 patients, 10 allergies, 2 life-threatening, and
`pnpm build` passes. Read `pages/home.html` + `pages/home.ts` side by side.

### Step 1 — Feel the system

1. Create `pages/allergies.html` with just `<section data-title="Allergies"><h1>Allergies</h1></section>`.
2. Click "Allergies" in the navbar.

**Done when:** the page appears, the tab title changes, and the nav link is highlighted —
without touching any `.ts` file. Delete or keep it; you'll fill it in step 9.

### Step 2 — API functions: `src/api/patients.ts` and `src/api/allergies.ts`

Wrap `request()` so pages never write URLs or pick schemas:

| patients.ts | allergies.ts |
|---|---|
| `getPatients(query?)` | `getAllergies(query?)` |
| `getPatient(id)` | `getAllergiesFor(patientId)` |
| `createPatient(input)` — validate with `NewPatientSchema`, add next `PR-` id + today's `visit` | `createAllergy(input)` — validate with `NewAllergySchema`, add today's `recordedAt` |
| `replacePatient(id, patient)` | `replaceAllergy(id, allergy)` |
| `updatePatient(id, changes)` — `PatientChangesSchema` | `updateAllergy(id, changes)` — `AllergyChangesSchema` |
| `deletePatient(id)` | `deleteAllergy(id)` |

Rules: return `ApiResult<…>` and never throw; validate input with `safeParse` **before**
sending (bad input → `ok: false` + `fieldErrors`, no request); pass the right list/record
schema to `request()`. Then replace the two direct `request()` calls in `home.ts`.

**Done when:** `home.ts` imports only from `@/api/patients` and `@/api/allergies`, and an
invalid `createPatient({ email: 'x' })` returns field errors without a request showing in
the server log.

### Step 3 — Patients list: `pages/patients.html` + `patients.ts`

- A table: id, name, age, ward, status badge, last visit, allergy count; each row links to `#/patients/{{ id }}`.
- Search box → `getPatients({ q })` as you type (debounce ~250 ms).
- Status filter (`<select>` built from `StatusSchema.options`) → `getPatients({ status })`.
- Sort by clicking a header → `_sort` / `_order`.
- "New patient" button → `#/patients/new`.
- Loading text while fetching; an empty state when nothing matches; the error message when the server is down.

**Done when:** searching "chraibi" shows one row, filtering "urgent" shows two, stopping the
server shows your error message instead of a blank table.

### Step 4 — Patient detail: `pages/patients.$id.html` + `patients.$id.ts`

- `getPatient(params.id)` and `getAllergiesFor(params.id)` in parallel (`Promise.all`).
- Patient card (all fields) + an allergy list: substance, category, reaction, severity badge, recorded date, notes.
- A red banner at the top if any allergy is `life-threatening`.
- Unknown id → "Patient not found" with a link back (the API returns `ok: false`).
- Links: Edit (`#/patients/{{ id }}/edit`), Back to list.

**Done when:** `#/patients/PR-10428` shows Penicillin and Peanuts; `#/patients/PR-10424`
shows the life-threatening banner; `#/patients/NOPE` shows "not found".

### Step 5 — New patient: `pages/patients.new.html` + `patients.new.ts`

- Form fields matching `NewPatientSchema`: name, email, age, sex, blood, ward, status
  (selects built from `SexSchema.options`, `BloodSchema.options`, `StatusSchema.options`).
- A `data-error-for` slot under every input.
- Submit → `createPatient(formValues(form))` → on success `navigate('/patients/' + result.data.id)`, on failure `showErrors(...)`.
- Disable the submit button while saving.

**Done when:** a bad email shows the error under the email field; a valid form creates
`PR-10429`, lands on its detail page, and the record is in `db.json`.

### Step 6 — Edit patient: `pages/patients.$id.edit.html` + `patients.$id.edit.ts`

- Load the patient, pre-fill the form (`form.elements.namedItem('name')`… or set `.value` via refs).
- Save with `updatePatient(id, onlyChangedFields)` — compare with the loaded values; nothing changed → just go back.
- Cancel → back to detail.

**Done when:** changing only the status sends a PATCH containing only `status` (check the server log / `db.json`).

### Step 7 — Delete patient

- On the detail page: a Delete button → `confirm('Delete Nadia Chraibi and her 2 allergies?')`.
- Delete that patient's allergies first (`deleteAllergy` for each), then `deletePatient`, then `navigate('/patients')`.

**Done when:** after deleting, neither the patient nor any of their allergies remain in `db.json`.

### Step 8 — Allergies on the patient page

- An "Add allergy" form on `patients.$id` (or a page `patients.$id.allergies.new.html`):
  substance, category, reaction, severity, notes → `createAllergy({ patientId: params.id, … })`.
- Per allergy: change severity inline (`<select>` → `updateAllergy(id, { severity })`) and Delete (`on()` + `data-action`).
- Re-render the list after every change (write one `renderAllergies()` function and reuse it).

**Done when:** you can add, re-grade and remove allergies without reloading the page, and the banner appears/disappears as severity changes.

### Step 9 — Allergies overview: `pages/allergies.html` + `allergies.ts`

- Every allergy with the patient's name (fetch patients once, build a `Map` of id → name).
- Filters: severity, category (`?severity=severe&category=drug`), search (`?q=`).
- Counts per severity at the top; each row links to the patient.

**Done when:** filtering "life-threatening" shows exactly Tarik Sefrioui's contrast allergy and the bee venom one.

### Step 10 — Polish

- A partial `partials/severity-legend.html` shared by the detail and overview pages.
- Consistent loading / empty / error blocks (a partial each).
- Focus the first invalid field after `showErrors`.
- Keyboard: Enter submits, Escape cancels on edit pages.
- `pnpm lint` and `pnpm build` clean.

**Done when:** every page handles: loading, empty, error, success — and the build passes.

---

## Page map (end result)

| URL | Files | API calls |
|---|---|---|
| `#/` | `home.html/.ts` | `getPatients`, `getAllergies` |
| `#/patients` | `patients.html/.ts` | `getPatients({ q, status, _sort, _order })` |
| `#/patients/new` | `patients.new.html/.ts` | `createPatient` |
| `#/patients/:id` | `patients.$id.html/.ts` | `getPatient`, `getAllergiesFor`, `deletePatient`, `createAllergy`, `updateAllergy`, `deleteAllergy` |
| `#/patients/:id/edit` | `patients.$id.edit.html/.ts` | `getPatient`, `updatePatient` |
| `#/allergies` | `allergies.html/.ts` | `getAllergies(filters)`, `getPatients` |
| anything else | `404.html` | — |

## Rules

1. Pages never call `fetch` or `request()` directly after step 2 — only `src/api/*`.
2. Never write a type by hand that a schema describes — import it from `@/schema`.
3. Every element a controller touches has a `data-ref` and is listed in its `refs()` interface.
4. Put user data into HTML only through `fill` / `renderList` / `textContent` (escaped), never raw `innerHTML`.
5. Pass `signal` to every `on()` / `addEventListener` in a page so nothing leaks between pages.
