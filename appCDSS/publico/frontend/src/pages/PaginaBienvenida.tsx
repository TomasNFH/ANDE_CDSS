import { Link } from 'react-router-dom';
import { Activity, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Cantidad de modelos validados que se muestran en la portada (provisorio, hasta leerlo del backend).
const MODELOS_VALIDADOS = 2;

const PaginaInicio = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-6">
          <Activity className="h-5 w-5 text-green-600" />
          <span className="font-semibold tracking-tight">ANDE CDSS</span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl text-center space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">CDSS</h1>
            <p className="text-lg text-muted-foreground">Sistema de Apoyo a la Decisión Clínica</p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm">
            <span className="h-2 w-2 rounded-full bg-green-600" />
            Modelos validados disponibles: <span className="font-medium">{MODELOS_VALIDADOS}</span>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white sm:w-40">
              <Link to="/ingresar">Iniciar sesión</Link>
            </Button>
            {/* Registro: pendiente de implementar */}
            <Button variant="outline" className="w-full sm:w-40">
              Registrarse
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl items-start gap-2 px-6 py-4 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            Prototipo de investigación. La estimación no reemplaza el juicio clínico ni constituye una
            indicación diagnóstica o terapéutica.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PaginaInicio;
