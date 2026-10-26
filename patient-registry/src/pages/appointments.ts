import { icon } from '../ui/icons.ts'
import { avatar, badge, btn, card } from '../ui/bits.ts'
import { schedule, waitingRoom } from '../data.ts'

const days = [
  { d: 'Mon', n: 19, count: 28 },
  { d: 'Tue', n: 20, count: 36, today: true },
  { d: 'Wed', n: 21, count: 31 },
  { d: 'Thu', n: 22, count: 22 },
  { d: 'Fri', n: 23, count: 18 },
  { d: 'Sat', n: 24, count: 9 },
  { d: 'Sun', n: 25, count: 0 },
]

const tone = {
  done: 'ring-gray-200',
  now: 'bg-indigo-50/50 ring-indigo-200',
  next: 'ring-gray-200',
}

function slot(a) {
  const status =
    a.state === 'done'
      ? `<span class="ml-auto inline-flex items-center gap-x-1 text-green-700">${icon('checkCircle', 'size-4')}Seen</span>`
      : a.state === 'now'
        ? `<span class="ml-auto inline-flex items-center gap-x-1 font-medium text-indigo-700">${icon('clock', 'size-4')}In room</span>`
        : '<span class="ml-auto text-gray-400">Scheduled</span>'

  return `<li class="flex gap-x-4">
    <span class="w-14 shrink-0 pt-3 text-sm tabular-nums text-gray-500">${a.time}</span>
    <div class="min-w-0 flex-auto rounded-lg p-4 ring-1 ring-inset ${tone[a.state]}">
      <div class="flex items-start gap-x-3">
        ${avatar(a.patient)}
        <div class="min-w-0 flex-auto">
          <p class="truncate text-sm/6 font-semibold text-gray-900">${a.patient}</p>
          <p class="truncate text-xs/5 text-gray-500">${a.reason}</p>
        </div>
        <div class="flex shrink-0 items-center gap-x-1">
          <button type="button" class="${btn.icon}">
            <span class="sr-only">Call ${a.patient}</span>${icon('phone', 'size-5')}
          </button>
          <button type="button" class="${btn.icon}">
            <span class="sr-only">Open record</span>${icon('file', 'size-5')}
          </button>
        </div>
      </div>
      <div class="mt-3 flex items-center gap-x-4 border-t border-gray-100 pt-3 text-xs/5 text-gray-500">
        <span class="inline-flex items-center gap-x-1">${icon('building', 'size-4')}${a.room}</span>
        <span class="inline-flex items-center gap-x-1">${icon('clock', 'size-4')}30 min</span>
        ${status}
      </div>
    </div>
  </li>`
}

export function renderAppointments() {
  return `
  <div class="space-y-5">

    <!-- week strip -->
    <div class="grid grid-cols-4 gap-3 sm:grid-cols-7">
      ${days
        .map(
          (d) => `<button type="button" class="rounded-lg px-3 py-3 text-left shadow-xs ${
            d.today
              ? 'bg-indigo-600 text-white'
              : 'bg-white ring-1 ring-gray-200 ring-inset hover:bg-gray-50'
          }">
            <span class="block text-xs/5 ${d.today ? 'text-indigo-100' : 'text-gray-500'}">${d.d}</span>
            <span class="mt-0.5 block text-lg font-semibold tabular-nums ${d.today ? 'text-white' : 'text-gray-900'}">${d.n}</span>
            <span class="mt-1 block text-xs tabular-nums ${d.today ? 'text-indigo-100' : 'text-gray-400'}">
              ${d.count ? d.count + ' appts' : 'closed'}
            </span>
          </button>`,
        )
        .join('')}
    </div>

    <div class="grid items-start gap-5 lg:grid-cols-3">
      <div class="min-w-0 lg:col-span-2">
        ${card(
          'Tuesday 20 October',
          `<ul role="list" class="space-y-4 px-4 py-5 sm:px-6">${schedule.map(slot).join('')}</ul>`,
          `<span class="text-sm text-gray-500 tabular-nums">6 of 36 shown</span>`,
        )}
      </div>

      <div class="space-y-5">
        ${card(
          'Waiting room',
          `<ul role="list" class="divide-y divide-gray-100">
            ${waitingRoom
              .map(
                (w) => `<li class="flex items-center gap-x-3 px-4 py-4 sm:px-6">
                  ${avatar(w.name, 'size-8 text-xs')}
                  <div class="min-w-0 flex-auto">
                    <p class="truncate text-sm/6 font-semibold text-gray-900">${w.name}</p>
                    <p class="text-xs/5 text-gray-500 tabular-nums">since ${w.since}</p>
                  </div>
                  ${badge(w.status)}
                </li>`,
              )
              .join('')}
           </ul>`,
          `<span class="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium
             text-gray-600 ring-1 ring-gray-500/10 ring-inset">3 waiting</span>`,
        )}

        ${card(
          'Quick actions',
          `<div class="space-y-3 px-4 py-5 sm:px-6">
            <a href="#/patients" class="${btn.ghost} w-full justify-center">${icon('plus', 'size-5 text-gray-400')}Book an appointment</a>
            <a href="#/patients" class="${btn.ghost} w-full justify-center">${icon('users', 'size-5 text-gray-400')}Register a new patient</a>
            <a href="#/dashboard" class="${btn.ghost} w-full justify-center">${icon('download', 'size-5 text-gray-400')}Export today's list</a>
          </div>`,
        )}
      </div>
    </div>
  </div>`
}
