import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom'

import AlertTestPage from './app/pages/test/AlertTestPage'
import ComponentTestPage from './app/pages/test/ComponentTestPage'
import SubnavTestPage from './app/pages/test/SubnavTestPage'
import { AlertProvider } from './components/alert'

function App() {
  return (
    <BrowserRouter>
      <AlertProvider>
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

        <Routes>
          <Route path="/" element={<Navigate to="/component-test" replace />} />
          <Route path="/component-test" element={<ComponentTestPage />} />
          <Route path="/component-test/alert" element={<AlertTestPage />} />
          <Route path="/component-test/subnav" element={<SubnavTestPage />} />
          <Route path="*" element={<Navigate to="/component-test" replace />} />
        </Routes>
      </AlertProvider>
    </BrowserRouter>
  )
}

export default App