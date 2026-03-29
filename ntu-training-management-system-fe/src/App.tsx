import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'

import AuthPage from './app/pages/auth/AuthPage'
import ForgotPasswordPage from './app/pages/auth/ForgotPasswordPage'
import AlertTestPage from './app/pages/test/AlertTestPage'
import ComponentTestPage from './app/pages/test/ComponentTestPage'
import SubnavTestPage from './app/pages/test/SubnavTestPage'
import { AlertProvider } from './components/alert'

function AppShell() {
  const location = useLocation()
  const isAuthRoute = location.pathname.startsWith('/auth')

  return (
    <>
      {!isAuthRoute && (
        <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
          <nav className="mx-auto flex w-full max-w-4xl gap-2 px-4 py-3">
            <NavLink
              to="/component-test"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`
              }
            >
              Component Test
            </NavLink>
          </nav>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/component-test" element={<ComponentTestPage />} />
        <Route path="/component-test/alert" element={<AlertTestPage />} />
        <Route path="/component-test/subnav" element={<SubnavTestPage />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AlertProvider>
        <AppShell />
      </AlertProvider>
    </BrowserRouter>
  )
}

export default App