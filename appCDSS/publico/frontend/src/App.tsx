import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import PaginaInicio from '@/pages/PaginaInicio'
import PaginaSesiones from '@/pages/PaginaSesiones'

// El módulo público es la portada y el login; después se pasa a gestión.
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PaginaInicio />} />
        <Route path="/ingresar" element={<PaginaSesiones />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
