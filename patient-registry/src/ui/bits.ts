import { icon } from './icons.ts'

/* ---------- badges (Tailwind UI "Badges with border") ---------- */
// Status always ships an icon + label, never colour alone.
const badgeBase =
  'inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset'

const statusMap = {
  stable: { label: 'Stable', icon: 'checkCircle', cls: 'bg-green-50 text-green-700 ring-green-600/20' },
  observation: { label: 'Observation', icon: 'eye', cls: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' },
  urgent: { label: 'Urgent', icon: 'alert', cls: 'bg-orange-50 text-orange-700 ring-orange-600/20' },
  critical: { label: 'Critical', icon: 'exclamationCircle', cls: 'bg-red-50 text-red-700 ring-red-600/10' },
  discharged: { label: 'Discharged', icon: 'check', cls: 'bg-gray-50 text-gray-600 ring-gray-500/10' },
}

export function badge(key) {
  const s = statusMap[key]
  return `<span class="${badgeBase} ${s.cls}">${icon(s.icon, 'size-3.5')}${s.label}</span>`
}

/* ---------- avatar ---------- */
export function avatar(name, cls = 'size-9 text-xs') {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
  return `<span class="inline-flex ${cls} shrink-0 items-center justify-center rounded-full
    bg-gray-100 font-medium text-gray-600">${initials}</span>`
}

/* ---------- sparkline ---------- */
// Single series, one hue: the run in the de-emphasis step, the current period in the accent.
export function sparkline(values) {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const pt = (v, i) => `${(i / (values.length - 1)) * 100},${26 - ((v - min) / span) * 22}`
  const all = values.map(pt).join(' ')
  const tail = values.slice(-3).map((v, i) => pt(v, values.length - 3 + i)).join(' ')
  return `<svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true" class="h-6 w-full">
    <polyline points="${all}" fill="none" stroke="var(--color-indigo-200)" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
    <polyline points="${tail}" fill="none" stroke="var(--color-indigo-600)" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  </svg>`
}

/* ---------- stat card (Tailwind UI "Stats with trend") ---------- */
export function statTile(k) {
  // Delta colour = direction × whether up is good. The arrow and "vs" period carry it too.
  const d = k.delta
  const pill = d.good ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  const arrow = d.good ? 'text-green-500' : 'text-red-500'
  return `<div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm sm:p-6">
    <dt class="truncate text-sm font-medium text-gray-500">${k.label}</dt>
    <dd class="mt-1 flex items-baseline justify-between gap-2">
      <div class="text-2xl font-semibold tracking-tight whitespace-nowrap text-indigo-600">${k.value}</div>
      <div class="inline-flex items-baseline rounded-full ${pill} px-2.5 py-0.5 text-sm font-medium">
        ${icon(d.dir === 'up' ? 'arrowUp' : 'arrowDown', `-ml-1 mr-0.5 size-4 shrink-0 self-center ${arrow}`)}
        <span class="sr-only">${d.good ? 'Improved' : 'Worsened'} by</span>${d.text}
      </div>
    </dd>
    <div class="mt-4">${sparkline(k.spark)}</div>
    <p class="mt-1 text-xs text-gray-500">${d.vs}</p>
  </div>`
}

/* ---------- occupancy meter ---------- */
// Fill carries severity; the track is a lighter step of the same ramp.
export function meter(w) {
  const pct = Math.round((w.used / w.total) * 100)
  const ramp =
    pct >= 95
      ? { fill: 'bg-red-600', track: 'bg-red-100' }
      : pct >= 85
        ? { fill: 'bg-yellow-500', track: 'bg-yellow-100' }
        : { fill: 'bg-indigo-600', track: 'bg-indigo-100' }
  return `<div>
    <div class="flex items-baseline justify-between gap-3">
      <p class="text-sm font-medium text-gray-900">${w.name}</p>
      <p class="text-sm tabular-nums text-gray-500">${w.used}<span class="text-gray-400">/${w.total}</span></p>
    </div>
    <div class="mt-2 h-2 w-full overflow-hidden rounded-full ${ramp.track}">
      <div class="h-2 rounded-full ${ramp.fill}" style="width:${pct}%"></div>
    </div>
  </div>`
}

/* ---------- buttons & form controls ---------- */
export const btn = {
  primary:
    'inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
  ghost:
    'inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50',
  icon: 'relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-500',
}

export const field =
  'block w-full rounded-md bg-white py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6'

export const label = 'block text-sm/6 font-medium text-gray-900'

/* ---------- panel with header (Tailwind UI "Card with header") ---------- */
export function card(title, body, action = '') {
  return `<div class="overflow-hidden rounded-lg bg-white shadow-sm">
    <div class="flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-4 sm:px-6">
      <h3 class="text-base font-semibold text-gray-900">${title}</h3>
      ${action}
    </div>
    ${body}
  </div>`
}
