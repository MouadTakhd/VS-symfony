import { Link, useLocation } from 'react-router-dom'

// Placeholder for routes that don't have a page yet.
function ComingSoon() {
  const { pathname } = useLocation()

  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 px-6 py-16 text-center">
      <h1 className="text-lg font-semibold text-gray-900">{pathname} isn't built yet</h1>
      <p className="mt-1 text-sm text-gray-500">Add a page for it in src/App.tsx.</p>
      <Link to="/" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500">
        Back to home
      </Link>
    </div>
  )
}

export default ComingSoon
