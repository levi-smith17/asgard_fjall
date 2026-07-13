import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/app-shell'
import { RequireAuth } from '@/components/require-auth'
import { HlidskjalfPage } from '@/routes/hlidskjalf'
import { LoginPage } from '@/routes/login'
import { SendibodPage } from '@/routes/sendibod'
import { SogurPage } from '@/routes/sogur'
import { AudrPage } from '@/routes/audr'
import { OrdstirrPage } from '@/routes/ordstirr'
import { DagatalPage } from '@/routes/dagatal'
import { StjornurPage } from '@/routes/stjornur'
import { ThingPage } from '@/routes/thing'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<HlidskjalfPage />} />
          <Route path="/hlidskjalf" element={<HlidskjalfPage />} />
          <Route path="/basecamp" element={<Navigate to="/hlidskjalf" replace />} />
          <Route path="/audr" element={<AudrPage />} />
          <Route path="/dagatal" element={<DagatalPage />} />
          <Route path="/ordstirr" element={<OrdstirrPage />} />
          <Route path="/sogur" element={<SogurPage />} />
          <Route path="/stjornur" element={<StjornurPage />} />
          <Route path="/sendibod" element={<SendibodPage />} />
          <Route path="/thing" element={<ThingPage />} />
          <Route path="/settings" element={<Navigate to="/thing" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/hlidskjalf" replace />} />
    </Routes>
  )
}
