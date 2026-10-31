import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Icon, { type IconName } from '@/components/Icon'
import { doctor } from '@/data'

const navItems: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Home', icon: 'dashboard' },
  { to: '/patients', label: 'Patients', icon: 'users' },
  { to: '/appointments', label: 'Appointments', icon: 'calendar' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // Close the profile menu on outside click or Escape.
  useEffect(() => {
    if (!profileOpen) return
    const onClick = (e: MouseEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [profileOpen])

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-x-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-x-2.5">
          <span className="flex size-8 items-center justify-center rounded-md bg-indigo-600 text-white">
            <Icon name="logo" className="size-5" />
          </span>
          <span className="text-sm/6 font-semibold text-gray-900">Patient Registry</span>
        </Link>

        <ul role="list" className="hidden items-center gap-x-1 md:flex">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  'rounded-md px-3 py-2 text-sm/6 font-medium ' +
                  (isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-x-4">
          <form className="relative hidden lg:block" role="search" onSubmit={(e) => e.preventDefault()}>
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              placeholder="Search patients…"
              className="w-64 rounded-md bg-gray-50 py-1.5 pr-3 pl-8 text-sm/6 text-gray-900 outline-1
                         -outline-offset-1 outline-gray-200 placeholder:text-gray-400
                         focus:bg-white focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
            />
          </form>

          <button type="button" className="relative rounded-full p-1.5 text-gray-400 hover:text-gray-600">
            <span className="sr-only">View notifications</span>
            <Icon name="bell" className="size-6" />
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          <div ref={profileRef} className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              className="flex items-center gap-x-2 rounded-full p-0.5 hover:bg-gray-50"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                {doctor.initials}
              </span>
              <Icon name="chevronDown" className="size-4 text-gray-400" />
            </button>

            {profileOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white py-2 shadow-lg ring-1 ring-gray-900/5"
              >
                <div className="border-b border-gray-100 px-4 pb-2">
                  <p className="truncate text-sm font-semibold text-gray-900">{doctor.name}</p>
                  <p className="truncate text-xs text-gray-500">{doctor.role}</p>
                </div>
                <Link to="/settings" role="menuitem" onClick={() => setProfileOpen(false)} className="flex items-center gap-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Icon name="settings" className="size-4 text-gray-400" />
                  Settings
                </Link>
                <Link to="/login" role="menuitem" onClick={() => setProfileOpen(false)} className="flex items-center gap-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Icon name="logout" className="size-4 text-gray-400" />
                  Sign out
                </Link>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            className="-m-2 p-2 text-gray-700 md:hidden"
          >
            <span className="sr-only">{mobileOpen ? 'Close menu' : 'Open menu'}</span>
            <Icon name={mobileOpen ? 'close' : 'menu'} className="size-6" />
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-gray-200 md:hidden">
          <ul role="list" className="space-y-1 px-4 py-3">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    'flex items-center gap-x-3 rounded-md px-3 py-2 text-base font-medium ' +
                    (isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50')
                  }
                >
                  <Icon name={item.icon} className="size-5 text-gray-400" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-x-3 border-t border-gray-200 px-7 py-4">
            <span className="flex size-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
              {doctor.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">{doctor.name}</p>
              <p className="truncate text-xs text-gray-500">{doctor.role}</p>
            </div>
            <Link to="/login" onClick={() => setMobileOpen(false)} className="p-2 text-gray-400 hover:text-gray-600">
              <span className="sr-only">Sign out</span>
              <Icon name="logout" className="size-5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
