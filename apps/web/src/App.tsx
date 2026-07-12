import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/app-shell'
import { BasecampPage } from '@/routes/basecamp'
import { LoginPage } from '@/routes/login'
import { PlaceholderAppPage } from '@/routes/placeholder-app'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/basecamp" replace />} />
        <Route path="/basecamp" element={<BasecampPage />} />
        <Route path="/audr" element={<PlaceholderAppPage nameKey="provisions" />} />
        <Route path="/dagatal" element={<PlaceholderAppPage nameKey="calendar" />} />
        <Route path="/ordstirr" element={<PlaceholderAppPage nameKey="resume" />} />
        <Route path="/sogur" element={<PlaceholderAppPage nameKey="notes" />} />
        <Route path="/stjornur" element={<PlaceholderAppPage nameKey="starfield" />} />
        <Route path="/sendibod" element={<PlaceholderAppPage nameKey="messages" />} />
      </Route>
      <Route path="*" element={<Navigate to="/basecamp" replace />} />
    </Routes>
  )
}
