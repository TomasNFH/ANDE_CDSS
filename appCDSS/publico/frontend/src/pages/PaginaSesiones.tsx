import { useState, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// A dónde ir después del login. La sesión (cookie) la lee el backend de gestión.
const GESTION_URL = import.meta.env.VITE_GESTION_URL || 'http://localhost:8090/';

const PaginaSesiones = () => {
  const [nombre_usuario, setNombreUsuario] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleIniciarSesion = async (e: FormEvent) => {
    e.preventDefault();

    if (!nombre_usuario || !contraseña) {
      setError('Ingresá tu usuario y contraseña.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Va por el proxy de Vite al backend público, que responde con la cookie de sesión.
      const response = await fetch('/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre_usuario,
          contraseña,
        }),
      });

      const respuesta_servidor = await response.json();

      if (response.ok && respuesta_servidor.success) {
        // Pasar a gestión: es otra app, así que es una navegación completa y no del router.
        window.location.href = GESTION_URL;
      } else {
        setError(respuesta_servidor.detail || 'No se pudo iniciar sesión. Revisá el usuario y la contraseña.');
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor. Intentá de nuevo en unos minutos.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6">
          <Activity className="h-5 w-5 text-sky-700" />
          <span className="text-base font-semibold tracking-tight text-slate-900">DynamicDSS</span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-md space-y-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-semibold text-slate-900">Iniciar sesión</CardTitle>
              <p className="text-sm text-slate-500">Ingresá con tu usuario de DynamicDSS.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleIniciarSesion} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="usuario" className="block text-sm font-medium text-slate-900">
                    Usuario
                  </label>
                  <Input
                    id="usuario"
                    autoComplete="username"
                    value={nombre_usuario}
                    onChange={(e) => setNombreUsuario(e.target.value)}
                    className="h-10 text-base"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="contrasena" className="block text-sm font-medium text-slate-900">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Input
                      id="contrasena"
                      type={mostrarContrasena ? "text" : "password"}
                      autoComplete="current-password"
                      value={contraseña}
                      onChange={(e) => setContraseña(e.target.value)}
                      className="h-10 pr-10 text-base"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 text-slate-500 hover:bg-transparent hover:text-slate-800"
                      onClick={() => setMostrarContrasena(!mostrarContrasena)}
                      aria-label={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {mostrarContrasena ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {error && (
                  <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    <AlertCircle className="mt-px h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="h-10 w-full bg-sky-700 text-base text-white hover:bg-sky-800"
                  disabled={isLoading}
                >
                  {isLoading ? 'Iniciando sesión…' : 'Iniciar sesión'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PaginaSesiones;
