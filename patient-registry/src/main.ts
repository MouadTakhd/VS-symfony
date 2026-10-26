import './style.css'
import { icon } from './ui/icons.ts'
import { btn } from './ui/bits.ts'
import { shell, wireShell } from './ui/shell.ts'
import { renderLogin, wireLogin } from './pages/login.ts'
import { renderOverview } from './pages/overview.ts'
import { renderPatients, wirePatients } from './pages/patients.ts'
import { renderAppointments } from './pages/appointments.ts'
import { renderSettings, wireSettings } from './pages/settings.ts'
import { getPatients, loadPatients } from './db.ts'

// Yours, left as you typed it — `const name(): T {}` is not valid syntax, so it
// was breaking the build. Commented out, not deleted. Either:
//   async function getPatientsNow(): Promise<Patient[]> { ... }
// or drop it: loadPatients() in src/db.ts is where the fetching belongs.
// const getPatientsnow(): Promise{
//
// }
const routes = {
  '/login': {
    bare: true,
    tab: 'Sign in',
    render: renderLogin,
    wire: wireLogin,
  },
  '/dashboard': {
    tab: 'Overview',
    title: 'Overview',
    heading: 'Good morning, Dr. Takhdoukhi',
    subtitle: 'Tuesday 20 October 2026 · 36 appointments and 2 patients flagged for review.',
    actions: `<div class="flex items-center gap-x-3">
      <button type="button" class="${btn.ghost}">${icon('download', 'size-5 text-gray-400')}Export</button>
      <a href="#/patients" class="${btn.primary}">${icon('plus', 'size-5')}New patient</a>
    </div>`,
    render: renderOverview,
  },
  '/patients': {
    tab: 'Patients',
    title: 'Patients',
    heading: 'Patients',
    subtitle: () => {
      const rows = getPatients()
      const recent = rows.filter((p) => p.visit >= isoDaysAgo(7)).length
      return `${rows.length} records · ${recent} seen in the last 7 days.`
    },
    render: renderPatients,
    wire: wirePatients,
  },
  '/appointments': {
    tab: 'Appointments',
    title: 'Appointments',
    heading: 'Appointments',
    subtitle: 'This week · 144 booked across 4 wards.',
    actions: `<a href="#/appointments" class="${btn.primary}">${icon('plus', 'size-5')}New appointment</a>`,
    render: renderAppointments,
  },
  '/settings': {
    tab: 'Settings',
    title: 'Settings',
    heading: 'Settings',
    subtitle: 'Your profile, alerts and session.',
    render: renderSettings,
    wire: wireSettings,
  },
}

function isoDaysAgo(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

const app = document.querySelector('#app')

function currentPath() {
  const path = location.hash.replace(/^#/, '')
  return routes[path] ? path : '/login'
}

function render() {
  const path = currentPath()
  const route = routes[path]

  const subtitle = typeof route.subtitle === 'function' ? route.subtitle() : route.subtitle

  app.innerHTML = route.bare
    ? route.render()
    : shell({ path, ...route, subtitle, content: route.render() })

  document.title = `${route.tab} · Patient Registry`
  if (!route.bare) wireShell(app)
  if (route.wire) route.wire(app)
  window.scrollTo(0, 0)
}

async function start() {
  const result = await loadPatients()
  if (!result.ok) console.warn('[db]', result.message, result.issues ?? [])
  window.addEventListener('hashchange', render)
  render()
}

start()
