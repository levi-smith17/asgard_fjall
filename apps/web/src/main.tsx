import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { CommandPaletteProvider } from '@/context/command-palette-context'
import { AuthProvider } from '@/hooks/use-auth'
import { PaletteProvider } from '@/hooks/use-palette'
import { ThemeProvider } from '@/hooks/use-theme'
import { App } from './App'
import './index.css'

document.documentElement.dataset.palette = document.documentElement.dataset.palette ?? 'green'
document.documentElement.dataset.theme = document.documentElement.dataset.theme ?? 'dark'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <PaletteProvider>
            <AuthProvider>
              <CommandPaletteProvider>
                <App />
                <Toaster richColors position="bottom-right" />
              </CommandPaletteProvider>
            </AuthProvider>
          </PaletteProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
