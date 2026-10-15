import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Encabezado from '@/components/Encabezado';
import FormularioIngreso from '@/components/FormularioIngreso';

const PaginaSesiones = () => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Encabezado />

      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-md space-y-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="mb-6 text-2xl font-semibold text-slate-900">Iniciar sesión</h1>
            <FormularioIngreso />
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaginaSesiones;
