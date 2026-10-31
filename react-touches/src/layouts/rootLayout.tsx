import { Outlet } from 'react-router-dom'
import Navbar from '@/components/Navbar'

// Wraps every route: navbar on top, the matched page in <Outlet />, footer at the bottom.
function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 antialiased">
      <Navbar />

      <main className="flex-1 py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-gray-500 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Patient Registry</p>
          <p>Internal use only · Patient data is confidential</p>
        </div>
      </footer>
    </div>
  )
}

export default RootLayout
