import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import AdminLayout from './components/AdminLayout'
import RequireRole from './components/RequireRole'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Facilities from './pages/Facilities'
import History from './pages/History'
import Landing from './pages/Landing'
import Login from './pages/Login'
import ReportPage from './pages/ReportPage'
import Reports from './pages/Reports'
import Staff from './pages/Staff'
import Track from './pages/Track'

// HashRouter keeps QR links working on any static host (e.g. Vercel, GitHub Pages)
// without extra server rewrites.
export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/report/:facilityId" element={<ReportPage />} />
          <Route path="/track" element={<Track />} />
          <Route path="/track/:ticket" element={<Track />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="reports" element={<Reports />} />
            <Route path="facilities" element={<RequireRole roles={['admin']}><Facilities /></RequireRole>} />
            <Route path="history" element={<RequireRole roles={['admin']}><History /></RequireRole>} />
            <Route path="expenses" element={<RequireRole roles={['admin']}><Expenses /></RequireRole>} />
            <Route path="staff" element={<RequireRole roles={['admin']}><Staff /></RequireRole>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
