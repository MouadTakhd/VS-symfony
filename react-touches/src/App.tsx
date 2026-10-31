import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import RootLayout from '@/layouts/rootLayout'
import HomePage from '@/components/HomePage'
import ComingSoon from '@/components/ComingSoon'
import './App.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      // Patients, appointments, settings… add them here as you build them.
      { path: '*', element: <ComingSoon /> },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
