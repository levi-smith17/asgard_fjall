import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AppShell } from '@/components/app-shell'
import { RequireAuth } from '@/components/require-auth'
import { HlidskjalfPage } from '@/routes/hlidskjalf'
import { LoginPage } from '@/routes/login'
import { SendibodPage } from '@/routes/sendibod'
import { SogurPage } from '@/routes/sogur'
import { AudrPage } from '@/routes/audr'
import { OrdstirrPage } from '@/routes/ordstirr'
import { DagatalPage } from '@/routes/dagatal'
import { NidjatalPage } from '@/routes/nidjatal'
import { StjornurPage } from '@/routes/stjornur'
import { ThingPage } from '@/routes/thing'
import { PublicManifestPage } from '@/routes/manifest-public'
import { ThreadPage } from '@/routes/thread'
import { APEX_ORDSTIRR_USERNAME, isApexOrdstirrHost } from '@/lib/apex-ordstirr'
import { publicManifestPath, type PublicManifestView } from '@/lib/public-manifest-path'

function LegacyPublicManifestRedirect({ view }: { view: PublicManifestView }) {
  const { username } = useParams<{ username: string }>()
  if (!username) return <Navigate to="/login" replace />
  return <Navigate to={publicManifestPath(username, view)} replace />
}

function PublicSurfaces() {
  return (
    <>
      <Route path="/ordstirr/:username" element={<PublicManifestPage view="manifest" />} />
      <Route path="/ordstirr/:username/ferd" element={<PublicManifestPage view="journey" />} />
      <Route
        path="/ordstirr/:username/ordsending"
        element={<PublicManifestPage view="contact" />}
      />
      <Route path="/manifest/:username" element={<LegacyPublicManifestRedirect view="manifest" />} />
      <Route
        path="/manifest/:username/journey"
        element={<LegacyPublicManifestRedirect view="journey" />}
      />
      <Route
        path="/manifest/:username/contact"
        element={<LegacyPublicManifestRedirect view="contact" />}
      />
      <Route path="/thread/:token" element={<ThreadPage />} />
    </>
  )
}

/** Apex `levismith.us` — public Ordstirr only (Standard terms). */
function ApexOrdstirrApp() {
  const username = APEX_ORDSTIRR_USERNAME
  return (
    <Routes>
      <Route path="/" element={<PublicManifestPage view="manifest" username={username} />} />
      <Route path="/about" element={<PublicManifestPage view="journey" username={username} />} />
      <Route path="/contact" element={<PublicManifestPage view="contact" username={username} />} />
      {/* Legacy aliases → preferred Standard paths */}
      <Route path="/ferd" element={<Navigate to="/about" replace />} />
      <Route path="/journey" element={<Navigate to="/about" replace />} />
      <Route path="/ordsending" element={<Navigate to="/contact" replace />} />
      {PublicSurfaces()}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function AppShellRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* Ungated visitor thread; Almenningr is embedded under AppShell like RealmOps. */}
      <Route path="/thread/:token" element={<ThreadPage />} />
      <Route path="/manifest/:username" element={<LegacyPublicManifestRedirect view="manifest" />} />
      <Route
        path="/manifest/:username/journey"
        element={<LegacyPublicManifestRedirect view="journey" />}
      />
      <Route
        path="/manifest/:username/contact"
        element={<LegacyPublicManifestRedirect view="contact" />}
      />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<HlidskjalfPage />} />
          <Route path="/hlidskjalf" element={<HlidskjalfPage />} />
          <Route path="/basecamp" element={<Navigate to="/hlidskjalf" replace />} />
          <Route path="/audr" element={<AudrPage />} />
          <Route path="/dagatal" element={<DagatalPage />} />
          <Route path="/nidjatal" element={<NidjatalPage />} />
          <Route path="/ordstirr" element={<OrdstirrPage />} />
          <Route path="/ordstirr/:username" element={<PublicManifestPage view="manifest" />} />
          <Route path="/ordstirr/:username/ferd" element={<PublicManifestPage view="journey" />} />
          <Route
            path="/ordstirr/:username/ordsending"
            element={<PublicManifestPage view="contact" />}
          />
          <Route path="/sogur" element={<SogurPage />} />
          <Route path="/stjornur" element={<StjornurPage />} />
          <Route path="/starfield" element={<Navigate to="/stjornur" replace />} />
          <Route path="/sendibod" element={<SendibodPage />} />
          <Route path="/thing" element={<ThingPage />} />
          <Route path="/settings" element={<Navigate to="/thing" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/hlidskjalf" replace />} />
    </Routes>
  )
}

export function App() {
  if (isApexOrdstirrHost()) return <ApexOrdstirrApp />
  return <AppShellRoutes />
}
