import { icon } from './icons.ts'
import { doctor } from '../data.ts'

const nav = [
  { href: '#/dashboard', label: 'Overview', icon: 'dashboard' },
  { href: '#/patients', label: 'Patients', icon: 'users', count: '1,284' },
  { href: '#/appointments', label: 'Appointments', icon: 'calendar', count: '36' },
]

const account = [{ href: '#/settings', label: 'Settings', icon: 'settings' }]

function navLink(item, path) {
  const active = item.href === '#' + path
  const link = active
    ? 'bg-gray-50 text-indigo-600'
    : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
  const mark = active ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600'
  const count = item.count
    ? `<span class="ml-auto w-9 min-w-max rounded-full bg-white px-2.5 py-0.5 text-center
         text-xs/5 font-medium whitespace-nowrap text-gray-600 ring-1 ring-gray-200 ring-inset">${item.count}</span>`
    : ''
  return `<li>
    <a href="${item.href}" ${active ? 'aria-current="page"' : ''}
      class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold ${link}">
      ${icon(item.icon, `size-6 shrink-0 ${mark}`)}${item.label}${count}
    </a>
  </li>`
}

function sidebar(path) {
  return `
  <div data-backdrop class="fixed inset-0 z-40 hidden bg-gray-900/80 lg:hidden"></div>

  <div data-sidebar
    class="fixed inset-y-0 left-0 z-50 flex w-72 -translate-x-full flex-col gap-y-5 overflow-y-auto
           border-r border-gray-200 bg-white px-6 pb-4 transition-transform duration-300 ease-in-out
           lg:translate-x-0">
    <div class="flex h-16 shrink-0 items-center gap-x-3">
      <span class="flex size-8 items-center justify-center rounded-md bg-indigo-600 text-white">
        ${icon('logo', 'size-5')}
      </span>
      <span class="text-sm/6 font-semibold text-gray-900">Patient Registry</span>
      <button type="button" data-nav-close class="relative -m-2.5 ml-auto p-2.5 text-gray-700 lg:hidden">
        <span class="sr-only">Close sidebar</span>${icon('close', 'size-6')}
      </button>
    </div>

    <nav class="flex flex-1 flex-col">
      <ul role="list" class="flex flex-1 flex-col gap-y-7">
        <li>
          <ul role="list" class="-mx-2 space-y-1">${nav.map((i) => navLink(i, path)).join('')}</ul>
        </li>
        <li>
          <div class="text-xs/6 font-semibold text-gray-400">Account</div>
          <ul role="list" class="-mx-2 mt-2 space-y-1">${account.map((i) => navLink(i, path)).join('')}</ul>
        </li>
        <li class="-mx-6 mt-auto">
          <div class="flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-gray-900">
            <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-100
              text-xs font-medium text-gray-600">${doctor.initials}</span>
            <span class="relative min-w-0 flex-1">
              <span class="sr-only">Your profile</span>
              <span class="block truncate">${doctor.name}</span>
              <span class="block truncate text-xs/5 font-normal text-gray-500">${doctor.role}</span>
            </span>
            <a href="#/login" class="relative -m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
              <span class="sr-only">Sign out</span>${icon('logout', 'size-5')}
            </a>
          </div>
        </li>
      </ul>
    </nav>
  </div>`
}

function topbar() {
  return `
  <div class="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200
              bg-white px-4 shadow-xs sm:gap-x-6 sm:px-6 lg:px-8">
    <button type="button" data-nav-open class="relative -m-2.5 p-2.5 text-gray-700 lg:hidden">
      <span class="sr-only">Open sidebar</span>${icon('menu', 'size-6')}
    </button>
    <div class="h-6 w-px bg-gray-200 lg:hidden"></div>

    <div class="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
      <form class="grid flex-1 grid-cols-1" onsubmit="return false">
        <input type="search" name="search" placeholder="Search patients, records…"
          class="col-start-1 row-start-1 block size-full bg-white pl-8 text-base text-gray-900
                 outline-hidden placeholder:text-gray-400 sm:text-sm/6"/>
        ${icon('search', 'pointer-events-none col-start-1 row-start-1 size-5 self-center text-gray-400')}
      </form>

      <div class="flex items-center gap-x-4 lg:gap-x-6">
        <button type="button" class="relative -m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
          <span class="sr-only">View notifications</span>${icon('bell', 'size-6')}
          <span class="absolute top-2 right-2 size-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>
        <div class="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200"></div>
        <div class="flex items-center gap-x-2">
          <span class="flex size-8 items-center justify-center rounded-full bg-gray-100 text-xs
            font-medium text-gray-600">${doctor.initials}</span>
          <span class="hidden text-sm/6 font-semibold text-gray-900 lg:block">${doctor.name}</span>
          ${icon('chevronDown', 'hidden size-4 text-gray-400 lg:block')}
        </div>
      </div>
    </div>
  </div>`
}

export function shell(page) {
  return `
  ${sidebar(page.path)}
  <div class="lg:pl-72">
    ${topbar()}
    <main class="py-8 sm:py-10">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex flex-wrap items-center justify-between gap-4 pb-6">
          <div class="min-w-0">
            <h1 class="text-2xl/7 font-bold text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              ${page.heading}
            </h1>
            <p class="mt-1 text-sm text-gray-500">${page.subtitle}</p>
          </div>
          ${page.actions || ''}
        </div>
        ${page.content}
      </div>
    </main>
  </div>`
}

// Mobile drawer open/close. Re-bound after every render.
export function wireShell(root) {
  const aside = root.querySelector('[data-sidebar]')
  const backdrop = root.querySelector('[data-backdrop]')
  if (!aside) return

  const open = () => {
    aside.classList.remove('-translate-x-full')
    backdrop.classList.remove('hidden')
  }
  const close = () => {
    aside.classList.add('-translate-x-full')
    backdrop.classList.add('hidden')
  }

  root.querySelector('[data-nav-open]').addEventListener('click', open)
  root.querySelector('[data-nav-close]').addEventListener('click', close)
  backdrop.addEventListener('click', close)
  aside.querySelectorAll('a').forEach((a) => a.addEventListener('click', close))
}
