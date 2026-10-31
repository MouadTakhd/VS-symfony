import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Icon, { type IconName } from '@/components/Icon'
import { activity, doctor, schedule, wards } from '@/data'
import { getPatients } from '@/api/patient'



const quickActions: { to: string; label: string; hint: string; icon: IconName }[] = [
  { to: '/patients', label: 'Register patient', hint: 'Create a new record', icon: 'plus' },
  { to: '/appointments', label: 'Book appointment', hint: 'Schedule a visit', icon: 'calendar' },
  { to: '/patients', label: 'Find a record', hint: 'Search by name or ID', icon: 'search' },
  { to: '/patients', label: 'Lab results', hint: '18 awaiting review', icon: 'file' },
]

const stateStyle: Record<string, { dot: string; label: string; badge: string }> = {
  done: { dot: 'bg-gray-300', label: 'Done', badge: 'bg-gray-100 text-gray-600' },
  now: { dot: 'bg-indigo-600', label: 'In progress', badge: 'bg-indigo-50 text-indigo-700' },
  next: { dot: 'bg-white ring-2 ring-gray-300', label: 'Upcoming', badge: 'bg-white text-gray-600 ring-1 ring-gray-200' },
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

function Card({ title, action, children }: { title: string; action?: { to: string; label: string }; children: ReactNode }) {
  return (
    <section className="rounded-xl bg-white shadow-xs ring-1 ring-gray-900/5">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h2 className="text-sm/6 font-semibold text-gray-900">{title}</h2>
        {action && (
          <Link to={action.to} className="text-sm/6 font-medium text-indigo-600 hover:text-indigo-500">
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

export default function HomePage() {
useEffect(()=>{
  getPatients().then((res)=>{
    if(res.ok){
      console.log(res.data);
    }
  })
},[])

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">{today}</p>
          <h1 className="mt-1 text-2xl/8 font-bold tracking-tight text-gray-900 sm:text-3xl">
            {greeting()}, {doctor.name}
          </h1>
        </div>
        <Link
          to="/patients"
          className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <Icon name="plus" className="size-5" />
          New patient
        </Link>
      </div>

     

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {quickActions.map((a) => (
          <Link
            key={a.label}
            to={a.to}
            className="group flex items-center gap-x-3 rounded-xl bg-white p-4 shadow-xs ring-1 ring-gray-900/5 hover:ring-indigo-300"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white">
              <Icon name={a.icon} className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-gray-900">{a.label}</span>
              <span className="block truncate text-xs text-gray-500">{a.hint}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Today's schedule */}
        <div className="lg:col-span-2">
          <Card title="Today's schedule" action={{ to: '/appointments', label: 'View all' }}>
            <ul role="list" className="divide-y divide-gray-100">
              {schedule.map((s) => {
                const st = stateStyle[s.state]
                return (
                  <li key={s.time} className={'flex items-center gap-x-4 px-5 py-3.5 ' + (s.state === 'now' ? 'bg-indigo-50/40' : '')}>
                    <span className="w-12 shrink-0 text-sm font-medium text-gray-900 tabular-nums">{s.time}</span>
                    <span className={'size-2.5 shrink-0 rounded-full ' + st.dot} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{s.patient}</p>
                      <p className="truncate text-xs text-gray-500">
                        {s.reason} · {s.room}
                      </p>
                    </div>
                    <span className={'hidden rounded-full px-2 py-0.5 text-xs font-medium sm:inline ' + st.badge}>{st.label}</span>
                  </li>
                )
              })}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Ward occupancy */}
          <Card title="Ward occupancy">
            <ul role="list" className="space-y-4 px-5 py-4">
              {wards.map((w) => {
                const pct = Math.round((w.used / w.total) * 100)
                return (
                  <li key={w.name}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{w.name}</span>
                      <span className="text-gray-500 tabular-nums">
                        {w.used}/{w.total}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={'h-full rounded-full ' + (pct >= 85 ? 'bg-amber-500' : 'bg-indigo-600')}
                        style={{ width: pct + '%' }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>

          {/* Recent activity */}
          <Card title="Recent activity">
            <ul role="list" className="space-y-4 px-5 py-4">
              {activity.map((a) => (
                <li key={a.what} className="flex gap-x-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                    <Icon name={a.icon as IconName} className="size-4" />
                  </span>
                  <div className="min-w-0 text-sm">
                    <p className="text-gray-700">
                      <span className="font-semibold text-gray-900">{a.who}</span> {a.what}
                    </p>
                    <p className="text-xs text-gray-400">{a.when}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
