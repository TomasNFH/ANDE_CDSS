import { Link } from 'react-router-dom';
import { Activity, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Cantidad de modelos validados que se muestran en la portada (provisorio, hasta leerlo del backend).
const MODELOS_VALIDADOS = 2;

const PaginaBienvenida = () => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6">
          <Activity className="h-5 w-5 text-sky-700" />
          <span className="text-base font-semibold tracking-tight text-slate-900">DynamicDSS</span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-2xl space-y-10 text-center">
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">DynamicDSS</h1>
            <p className="text-2xl font-semibold text-slate-700">
              Sistema dinámico de apoyo a la decisión clínica
            </p>
            <p className="text-base text-slate-600">
              Selección dinámica de modelos de aprendizaje automático adaptados a datos médicos,
              con aplicación a datos de diálisis en nefrología.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-600">
            <span className="h-2 w-2 rounded-full bg-sky-700" />
            Modelos validados disponibles:{' '}
            <span className="font-semibold text-slate-900">{MODELOS_VALIDADOS}</span>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="w-full bg-sky-700 text-white hover:bg-sky-800 sm:w-40">
              <Link to="/ingresar">Iniciar sesión</Link>
            </Button>
            {/* Registro: pendiente de implementar */}
            <Button variant="outline" className="w-full border-slate-300 text-slate-700 sm:w-40">
              Registrarse
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-start gap-2 px-4 py-4 text-sm text-slate-500 sm:px-6">
          <Info className="mt-px h-3.5 w-3.5 shrink-0" />
          <p>
            Herramienta de apoyo a la decisión clínica en fase de investigación. No reemplaza el
            juicio clínico ni constituye una indicación diagnóstica o terapéutica.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PaginaBienvenida;
