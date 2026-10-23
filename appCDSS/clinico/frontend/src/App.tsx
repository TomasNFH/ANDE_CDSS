import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import RequireAuth from '@/components/RequireAuth'
import PaginaInicio from '@/pages/PaginaInicio'
import FraminhamPage from '@/pages/FraminhamPage'
import { TooltipProvider } from '@/components/ui/tooltip'

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            {/* Todo clínico requiere sesión; el login está en el módulo público */}
            <Route element={<RequireAuth />}>
              <Route path="/" element={<PaginaInicio />} />
              <Route path="/cardiology" element={<FraminhamPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  )
}

export default App
