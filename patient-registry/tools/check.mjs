// npm run check — tests your exercises against the real zod.
//
// Transpiles src/ to .check/ with tsc (types stripped, nothing type-checked),
// then exercises your functions. No test framework, no extra dependencies.
import { execFileSync } from 'node:child_process'
import { readFileSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, '.check')

rmSync(out, { recursive: true, force: true })
execFileSync(
  process.execPath,
  [
    join(root, 'node_modules/typescript/bin/tsc'),
    'src/schema.ts', 'src/db.ts', 'src/auth.ts',
    '--ignoreConfig',
    '--outDir', '.check',
    '--module', 'esnext',
    '--target', 'es2022',
    '--moduleResolution', 'bundler',
    '--allowImportingTsExtensions',
    '--rewriteRelativeImportExtensions',
    '--skipLibCheck',
  ],
  { cwd: root, stdio: 'inherit' },
)

// Your loadPatients() calls fetch(); serve it the real file off disk.
const dbFile = join(root, 'public/data/patients.json')
let serve = () => JSON.parse(readFileSync(dbFile, 'utf8'))
globalThis.fetch = async () => {
  const body = serve()
  if (body === 404) return { ok: false, status: 404, statusText: 'Not Found', json: async () => null }
  return { ok: true, status: 200, statusText: 'OK', json: async () => body }
}

// A schema built at module scope can throw while the file is merely being
// imported (a bad .omit() argument, say). Report that as what it is, rather
// than letting the stack trace stand in for an explanation.
async function load(name) {
  try {
    return await import(`../.check/${name}.js`)
  } catch (error) {
    console.error(`\nsrc/${name}.ts threw while being imported, so nothing could be checked.\n`)
    console.error(`  ${error.message}\n`)
    console.error('This happens at import time, which means the app is broken too —')
    console.error('the page will be blank with the same error in the browser console.')
    console.error('It is a schema being *built* wrongly, not data failing to validate.\n')
    process.exit(1)
  }
}

const schema = await load('schema')
const db = await load('db')
const auth = await load('auth')

/* ---------- tiny assertion kit ---------- */
let passed = 0
const failures = []
const groups = []
let group = null

const section = (name) => { group = { name, lines: [] }; groups.push(group) }

/**
 * Run one exercise's checks. A schema can be built wrongly in a way that only
 * throws when it is first used — that must fail this exercise, not abort the
 * whole run and hide the others.
 */
async function run(name, fn) {
  section(name)
  try {
    await fn()
  } catch (error) {
    ok(`this exercise threw instead of validating: ${error.message}`, false,
       'a schema that throws on use is built wrongly — it is not a validation failure')
  }
}

function ok(label, condition, detail = '') {
  if (condition) { passed++; group.lines.push(`  ✓ ${label}`) }
  else { failures.push(`${group.name} → ${label}`); group.lines.push(`  ✗ ${label}${detail ? `\n      ${detail}` : ''}`) }
}

const eq = (label, got, want) =>
  ok(label, JSON.stringify(got) === JSON.stringify(want), `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`)

/** A record that should pass every rule. */
const good = {
  id: 'PR-10428', name: 'Nadia Chraibi', email: 'n.chraibi@mail.ma', age: 34,
  sex: 'F', blood: 'O+', ward: 'General medicine', visit: '2026-10-20', status: 'observation',
}
const accepts = (label, patch) => ok(`accepts ${label}`, schema.PatientSchema.safeParse({ ...good, ...patch }).success)
const rejects = (label, patch) => ok(`rejects ${label}`, !schema.PatientSchema.safeParse({ ...good, ...patch }).success)

/* ---------- exercise 1 ---------- */
await run('Exercise 1a — PatientSchema', async () => {
  const parsed = schema.PatientSchema.safeParse(good)
  ok('accepts a valid record', parsed.success)
  eq('keeps all nine fields (an empty z.object strips them)',
     parsed.success ? Object.keys(parsed.data).sort() : [], Object.keys(good).sort())

  rejects('a bad record number', { id: '10428' })
  rejects('a missing record number', { id: undefined })
  rejects('a 2-character name', { name: 'Al' })
  rejects('a name over 60 characters', { name: 'x'.repeat(61) })
  rejects('a malformed email', { email: 'n.chraibi.mail.ma' })
  rejects('a negative age', { age: -1 })
  rejects('a fractional age', { age: 34.5 })
  rejects('an age over 120', { age: 121 })
  rejects('an age as a string', { age: '34' })
  rejects('an unknown sex', { sex: 'X' })
  rejects('an unknown blood type', { blood: 'C+' })
  rejects('a 1-character ward', { ward: 'A' })
  rejects('a non-ISO date', { visit: '20/10/2026' })
  rejects('an unknown status', { status: 'sleeping' })
  accepts('age 0', { age: 0 })
  accepts('age 120', { age: 120 })
})

await run('Exercise 1b — PatientListSchema', async () => {
  const all = JSON.parse(readFileSync(dbFile, 'utf8'))
  const parsed = schema.PatientListSchema.safeParse(all)
  ok('accepts the whole database', parsed.success)
  eq('returns all 24 rows', parsed.success ? parsed.data.length : 0, 24)
  ok('rejects a single record (it must be an array)', !schema.PatientListSchema.safeParse(good).success)
  ok('rejects an array with one bad row', !schema.PatientListSchema.safeParse([good, { ...good, status: 'nope' }]).success)
  ok('reports which row is bad', (() => {
    const bad = schema.PatientListSchema.safeParse([good, { ...good, status: 'nope' }])
    return !bad.success && bad.error.issues.some((i) => i.path[0] === 1)
  })())
})

await run('Exercise 1c — NewPatientSchema', async () => {
  const { id, visit, ...draft } = good
  const asForm = { ...draft, age: '34' } // what the form actually sends
  const parsed = schema.NewPatientSchema.safeParse(asForm)
  ok('accepts a form draft with age as a string', parsed.success,
     'age arrives as "34" from an <input> — see z.coerce.number()')
  ok('coerces age to a number', parsed.success && parsed.data.age === 34)
  eq('keeps the seven draft fields', parsed.success ? Object.keys(parsed.data).sort() : [], Object.keys(draft).sort())
  ok('does not require id', schema.NewPatientSchema.safeParse(asForm).success)
  ok('still rejects a bad email', !schema.NewPatientSchema.safeParse({ ...asForm, email: 'nope' }).success)
  ok('still rejects an unknown status', !schema.NewPatientSchema.safeParse({ ...asForm, status: 'nope' }).success)
  ok('rejects a non-numeric age', !schema.NewPatientSchema.safeParse({ ...asForm, age: 'thirty' }).success)
})

/* ---------- exercise 2 ---------- */
await run('Exercise 2a — loadPatients()', async () => {
  db.setPatients([])
  const result = await db.loadPatients()
  ok('returns ok', result.ok, result.message)
  eq('returns 24 rows', result.ok ? result.rows.length : 0, 24)
  eq('puts them where getPatients() can see them', db.getPatients().length, 24)
  ok('rows are the validated data, not the raw JSON',
     db.getPatients().every((p) => typeof p.age === 'number' && typeof p.name === 'string'))

  serve = () => [{ id: 'nope' }]
  db.setPatients([])
  const bad = await db.loadPatients()
  ok('reports a schema failure', !bad.ok)
  ok('says something printable', typeof bad.message === 'string' && bad.message.length > 0)
  ok('lists the zod issues', Array.isArray(bad.issues) && bad.issues.length > 0)
  eq('leaves no half-valid rows behind', db.getPatients().length, 0)

  serve = () => 404
  const missing = await db.loadPatients()
  ok('reports a missing file', !missing.ok)
  ok('mentions the status code', /404/.test(missing.message), `message was: ${missing.message}`)

  serve = () => { throw new Error('network down') }
  let threw = false
  try { await db.loadPatients() } catch { threw = true }
  ok('does not throw when fetch rejects', !threw, 'wrap the fetch in try/catch')

  serve = () => JSON.parse(readFileSync(dbFile, 'utf8'))
})

await run('Exercise 2b — addPatient()', async () => {
  db.setPatients([])
  await db.loadPatients()
  const before = db.getPatients().length
  const { id, visit, ...draft } = good
  const result = db.addPatient({ ...draft, name: 'Test Patient', age: '41' })

  ok('returns ok for a valid draft', result.ok, result.message)
  eq('appends one row', db.getPatients().length, before + 1)
  ok('returns the new patient', !!result.patient)
  ok('assigns a record number', !!result.patient && /^PR-\d{5}$/.test(result.patient.id))
  ok('assigns a visit date of today', !!result.patient && result.patient.visit === db.todayIso())
  ok('age became a number', !!result.patient && result.patient.age === 41)
  ok('the new row is a valid patient', !!result.patient && schema.PatientSchema.safeParse(result.patient).success)
  ok('the new record number is unique', new Set(db.getPatients().map((p) => p.id)).size === db.getPatients().length)

  const after = db.getPatients().length
  const bad = db.addPatient({ ...draft, email: 'not-an-email', age: '41' })
  ok('rejects a bad email', !bad.ok)
  ok('names the field that failed', !!bad.fieldErrors && 'email' in bad.fieldErrors,
     `fieldErrors was ${JSON.stringify(bad.fieldErrors)}`)
  eq('adds nothing when invalid', db.getPatients().length, after)

  const empty = db.addPatient({})
  ok('rejects an empty draft', !empty.ok)
  ok('reports several fields at once', !!empty.fieldErrors && Object.keys(empty.fieldErrors).length >= 3,
     `fieldErrors was ${JSON.stringify(empty.fieldErrors)}`)
})

/* ---------- exercise 3 ---------- */
await run('Exercise 3 — validateLogin()', async () => {
  const valid = { email: 'm.takhdoukhi@clinic.ma', password: 'clinic-demo', remember: true }
  const result = auth.validateLogin(valid)
  ok('accepts a valid staff login', result.ok, JSON.stringify(result.fieldErrors))
  eq('returns the email', result.ok ? result.email : '', valid.email)
  eq('returns remember', result.ok ? result.remember : null, true)
  ok('defaults remember to false when omitted', (() => {
    const r = auth.validateLogin({ email: valid.email, password: valid.password })
    return r.ok && r.remember === false
  })(), 'see .default(false)')

  const shortPw = auth.validateLogin({ ...valid, password: 'short' })
  ok('rejects a password under 8 characters', !shortPw.ok)
  ok('blames the password field', !shortPw.ok && 'password' in shortPw.fieldErrors,
     `fieldErrors was ${JSON.stringify(shortPw.fieldErrors)}`)

  const badEmail = auth.validateLogin({ ...valid, email: 'not-an-email' })
  ok('rejects a malformed email', !badEmail.ok)
  ok('blames the email field', !badEmail.ok && 'email' in badEmail.fieldErrors,
     `fieldErrors was ${JSON.stringify(badEmail.fieldErrors)}`)

  const outsider = auth.validateLogin({ ...valid, email: 'someone@gmail.com' })
  ok('rejects an email outside @clinic.ma', !outsider.ok)
  ok('puts that message on a field the form can show', !outsider.ok && Object.keys(outsider.fieldErrors).length > 0,
     'a .refine() on the whole object has an empty path — decide where it goes')

  ok('does not throw on rubbish input', (() => {
    try { return !auth.validateLogin(null).ok && !auth.validateLogin('hello').ok }
    catch { return false }
  })(), 'safeParse, not parse')
})

/* ---------- report ---------- */
for (const g of groups) {
  console.log(`\n${g.name}`)
  console.log(g.lines.join('\n'))
}
const total = passed + failures.length
console.log(`\n${passed}/${total} checks passing`)
if (failures.length) {
  console.log(`\nStill to do:\n${failures.map((f) => `  · ${f}`).join('\n')}`)
  process.exit(1)
}
console.log('\nAll three exercises done. Next: make added rows survive a reload.')
