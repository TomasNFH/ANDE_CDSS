import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import RequireAuth from '@/components/RequireAuth'
import PaginaInicio from '@/pages/PaginaInicio'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { TooltipProvider } from '@/components/ui/tooltip'

function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              {/* Todo gestión requiere sesión; el login está en el módulo público */}
              <Route element={<RequireAuth />}>
                <Route path="/" element={<PaginaInicio />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SidebarProvider>
    </AuthProvider>
  )
}

export default App
