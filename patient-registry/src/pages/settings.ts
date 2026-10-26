import { icon } from '../ui/icons.ts'
import { btn, card, field, label } from '../ui/bits.ts'
import { doctor } from '../data.ts'

const toggles = [
  ['Critical status changes', 'Push the moment a patient is flagged critical.', true],
  ['Lab results', 'Notify me when results land for my patients.', true],
  ['Schedule changes', 'Reception reschedules and cancellations.', false],
  ['Weekly digest', 'Monday summary of ward load and no-shows.', true],
]

// Tailwind UI "Toggle with left label"
function toggle(t) {
  const on = t[2]
  return `<div class="flex items-start justify-between gap-6 px-4 py-4 sm:px-6">
    <span class="flex min-w-0 flex-grow flex-col">
      <span class="text-sm/6 font-medium text-gray-900">${t[0]}</span>
      <span class="text-sm text-gray-500">${t[1]}</span>
    </span>
    <button type="button" role="switch" aria-checked="${on}" data-switch
      class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
             transition-colors duration-200 ease-in-out focus-visible:outline-2
             focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${on ? 'bg-indigo-600' : 'bg-gray-200'}">
      <span aria-hidden="true"
        class="pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm
               ring-0 transition duration-200 ease-in-out ${on ? 'translate-x-5' : 'translate-x-0'}"></span>
    </button>
  </div>`
}

export function renderSettings() {
  return `
  <div class="grid items-start gap-5 lg:grid-cols-3">
    <div class="space-y-5 lg:col-span-2">
      ${card(
        'Profile',
        `<div class="space-y-6 px-4 py-5 sm:px-6">
          <div class="flex items-center gap-x-4">
            <span class="flex size-14 items-center justify-center rounded-full bg-gray-100 text-base
              font-medium text-gray-600">${doctor.initials}</span>
            <div>
              <button type="button" class="${btn.ghost}">Change photo</button>
              <p class="mt-2 text-xs/5 text-gray-500">PNG or JPG, up to 2 MB.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <div>
              <label for="name" class="${label}">Full name</label>
              <div class="mt-2"><input id="name" class="${field} px-3" value="${doctor.name}"/></div>
            </div>
            <div>
              <label for="speciality" class="${label}">Speciality</label>
              <div class="mt-2"><input id="speciality" class="${field} px-3" value="${doctor.role}"/></div>
            </div>
            <div>
              <label for="work-email" class="${label}">Work email</label>
              <div class="mt-2"><input id="work-email" type="email" class="${field} px-3" value="m.takhdoukhi@clinic.ma"/></div>
            </div>
            <div>
              <label for="phone" class="${label}">Phone</label>
              <div class="mt-2"><input id="phone" class="${field} px-3" value="+212 5 39 00 00 00"/></div>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-end gap-x-3 border-t border-gray-200 px-4 py-4 sm:px-6">
          <button type="button" class="text-sm/6 font-semibold text-gray-900">Cancel</button>
          <button type="button" class="${btn.primary}">Save</button>
        </div>`,
      )}

      ${card('Notifications', `<div class="divide-y divide-gray-100">${toggles.map(toggle).join('')}</div>`)}
    </div>

    <div class="space-y-5">
      ${card(
        'Session',
        `<div class="space-y-4 px-4 py-5 sm:px-6">
          <div class="flex items-center gap-x-3 rounded-lg bg-gray-50 p-3">
            <span class="flex size-9 items-center justify-center rounded-md bg-white text-gray-400
              shadow-xs ring-1 ring-gray-200 ring-inset">${icon('shield', 'size-5')}</span>
            <div class="min-w-0">
              <p class="text-sm/6 font-semibold text-gray-900">This device</p>
              <p class="text-xs/5 text-gray-500">Tangier · signed in today</p>
            </div>
          </div>
          <a href="#/login" class="${btn.ghost} w-full justify-center">
            ${icon('logout', 'size-5 text-gray-400')}Sign out
          </a>
        </div>`,
      )}

      ${card(
        'Danger zone',
        `<div class="px-4 py-5 sm:px-6">
          <p class="text-sm text-gray-500">
            Archiving the registry hides every record from staff and keeps an audit copy.
          </p>
          <button type="button"
            class="mt-4 inline-flex w-full items-center justify-center gap-x-1.5 rounded-md bg-red-600
                   px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500
                   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">
            ${icon('alert', 'size-5')}Archive registry
          </button>
        </div>`,
      )}
    </div>
  </div>`
}

export function wireSettings(root) {
  root.querySelectorAll('[data-switch]').forEach((sw) => {
    sw.addEventListener('click', () => {
      const on = sw.getAttribute('aria-checked') !== 'true'
      sw.setAttribute('aria-checked', String(on))
      sw.classList.toggle('bg-indigo-600', on)
      sw.classList.toggle('bg-gray-200', !on)
      const knob = sw.firstElementChild
      knob.classList.toggle('translate-x-5', on)
      knob.classList.toggle('translate-x-0', !on)
    })
  })
}
