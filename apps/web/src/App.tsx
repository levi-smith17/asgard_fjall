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
        <Route path="/audr" element={<PlaceholderAppPage name="Audr" />} />
        <Route path="/dagatal" element={<PlaceholderAppPage name="Dagatal" />} />
        <Route path="/ordstirr" element={<PlaceholderAppPage name="Ordstirr" />} />
        <Route path="/sogur" element={<PlaceholderAppPage name="Sogur" />} />
        <Route path="/stjornur" element={<PlaceholderAppPage name="Stjornur" />} />
        <Route path="/sendibod" element={<PlaceholderAppPage name="Sendibod" />} />
      </Route>
      <Route path="*" element={<Navigate to="/basecamp" replace />} />
    </Routes>
  )
}
