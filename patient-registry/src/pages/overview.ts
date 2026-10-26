import { icon } from '../ui/icons.ts'
import { avatar, badge, card, meter, statTile } from '../ui/bits.ts'
import { activity, kpis, schedule, wards } from '../data.ts'
import { getPatients } from '../db.ts'

const stateDot = {
  done: 'bg-gray-300',
  now: 'bg-indigo-600 ring-4 ring-indigo-100',
  next: 'bg-white ring-2 ring-gray-300',
}

function scheduleRow(a) {
  const name = a.state === 'done' ? 'text-gray-400' : 'text-gray-900'
  return `<li class="flex gap-x-4 px-4 py-4 sm:px-6">
    <span class="w-12 shrink-0 text-sm tabular-nums text-gray-500">${a.time}</span>
    <span class="mt-2 size-2 shrink-0 rounded-full ${stateDot[a.state]}"></span>
    <div class="min-w-0 flex-auto">
      <p class="flex items-center gap-x-2 text-sm/6 font-semibold ${name}">
        <span class="truncate">${a.patient}</span>
        ${
          a.state === 'now'
            ? '<span class="rounded-md bg-indigo-50 px-1.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-700/10 ring-inset">In room</span>'
            : ''
        }
      </p>
      <p class="mt-0.5 truncate text-xs/5 text-gray-500">${a.reason}</p>
    </div>
    <span class="hidden shrink-0 text-sm/6 text-gray-500 sm:block">${a.room}</span>
  </li>`
}

function patientRow(p) {
  return `<tr>
    <td class="py-4 pr-3 pl-4 text-sm whitespace-nowrap sm:pl-6">
      <div class="flex items-center gap-x-3">
        ${avatar(p.name)}
        <div class="min-w-0">
          <div class="truncate font-medium text-gray-900">${p.name}</div>
          <div class="truncate text-gray-500 tabular-nums">${p.id}</div>
        </div>
      </div>
    </td>
    <td class="px-3 py-4 text-sm whitespace-nowrap text-gray-500">${p.ward}</td>
    <td class="px-3 py-4 text-sm whitespace-nowrap text-gray-500 tabular-nums">${p.visit}</td>
    <td class="px-3 py-4 text-sm whitespace-nowrap">${badge(p.status)}</td>
    <td class="py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-6">
      <a href="#/patients" class="relative text-indigo-600 hover:text-indigo-900">
        View<span class="sr-only">, ${p.name}</span>
      </a>
    </td>
  </tr>`
}

export function renderOverview() {
  const rows = getPatients()
  const recent = rows.slice(0, 5)

  return `
  <div class="space-y-6">

    <!-- KPI row -->
    <dl class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      ${kpis.map(statTile).join('')}
    </dl>

    <div class="grid items-start gap-5 lg:grid-cols-3">

      <div class="min-w-0 lg:col-span-2">
        ${card(
          "Today's schedule",
          `<ul role="list" class="divide-y divide-gray-100">${schedule.map(scheduleRow).join('')}</ul>`,
          `<a href="#/appointments" class="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
             View all<span aria-hidden="true"> &rarr;</span></a>`,
        )}
      </div>

      ${card(
        'Ward occupancy',
        `<div class="space-y-5 px-4 py-5 sm:px-6">
           ${wards.map(meter).join('')}
           <div class="flex gap-x-2 border-t border-gray-100 pt-4 text-xs/5 text-gray-500">
             ${icon('alert', 'size-4 shrink-0 text-yellow-500')}
             <span>Intensive care is at 88% — one bed left.</span>
           </div>
         </div>`,
      )}

      <div class="min-w-0 lg:col-span-2">
        ${card(
          'Recently seen',
          `<div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-300">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-6">Patient</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Ward</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Last visit</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th scope="col" class="relative py-3.5 pr-4 pl-3 sm:pr-6"><span class="sr-only">View</span></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">${recent.map(patientRow).join('')}</tbody>
            </table>
          </div>`,
          `<a href="#/patients" class="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
             All ${rows.length}<span aria-hidden="true"> &rarr;</span></a>`,
        )}
      </div>

      ${card(
        'Recent activity',
        `<ul role="list" class="divide-y divide-gray-100">
          ${activity
            .map(
              (a) => `<li class="flex gap-x-3 px-4 py-4 sm:px-6">
                <span class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  ${icon(a.icon, 'size-4')}
                </span>
                <div class="min-w-0 flex-auto">
                  <p class="text-sm/5 text-gray-600">
                    <span class="font-medium text-gray-900">${a.who}</span> ${a.what}
                  </p>
                  <p class="mt-0.5 text-xs/5 text-gray-400">${a.when}</p>
                </div>
              </li>`,
            )
            .join('')}
         </ul>`,
      )}
    </div>
  </div>`
}
