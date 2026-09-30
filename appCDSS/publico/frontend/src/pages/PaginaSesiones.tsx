import { useState, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';
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
      setError('Por favor ingrese nombre de usuario y contraseña');
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
        setError(respuesta_servidor.detail || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="max-w-xl w-full mx-4">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            Iniciar sesión en ANDE CDSS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleIniciarSesion} className="space-y-4 flex flex-col items-center">
            <div className="flex items-center justify-center w-full">
              <div className="relative w-full max-w-sm">
                <Input
                  placeholder="Usuario"
                  autoComplete="username"
                  value={nombre_usuario}
                  onChange={(e) => setNombreUsuario(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex items-center justify-center w-full">
              <div className="relative w-full max-w-sm">
                <Input
                  type={mostrarContrasena ? "text" : "password"}
                  placeholder="Contraseña"
                  autoComplete="current-password"
                  value={contraseña}
                  onChange={(e) => setContraseña(e.target.value)}
                  className="w-full pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                  aria-label={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {mostrarContrasena ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {error && (
              <div className="flex items-center justify-center w-full">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <div className="flex items-center justify-center w-full">
              <Button
                type="submit"
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isLoading}
              >
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaginaSesiones;
