import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/app-shell'
import { RequireAuth } from '@/components/require-auth'
import { BasecampPage } from '@/routes/basecamp'
import { LoginPage } from '@/routes/login'
import { SendibodPage } from '@/routes/sendibod'
import { SogurPage } from '@/routes/sogur'
import { AudrPage } from '@/routes/audr'
import { OrdstirrPage } from '@/routes/ordstirr'
import { DagatalPage } from '@/routes/dagatal'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/basecamp" replace />} />
          <Route path="/basecamp" element={<BasecampPage />} />
          <Route path="/audr" element={<AudrPage />} />
          <Route path="/dagatal" element={<DagatalPage />} />
          <Route path="/ordstirr" element={<OrdstirrPage />} />
          <Route path="/sogur" element={<SogurPage />} />
          <Route path="/stjornur" element={<Navigate to="/basecamp" replace />} />
          <Route path="/sendibod" element={<SendibodPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/basecamp" replace />} />
    </Routes>
  )
}
