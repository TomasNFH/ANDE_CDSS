import { useState, type FormEvent } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// A dónde ir después del login. La sesión (cookie) la lee el backend clínico.
const CLINICO_URL = import.meta.env.VITE_CLINICO_URL || 'http://localhost:8091/';

// Campos con solo línea inferior, como en la portada.
const ESTILO_CAMPO =
  'h-12 rounded-none border-0 border-b border-slate-300 bg-slate-50 px-3 text-base shadow-none focus-visible:border-slate-900 focus-visible:ring-0';

const FormularioIngreso = () => {
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
        // Pasar a clínico: es otra app, así que es una navegación completa y no del router.
        window.location.href = CLINICO_URL;
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
    <form onSubmit={handleIniciarSesion} noValidate className="space-y-5">
      <div>
        <label htmlFor="usuario" className="sr-only">
          Usuario
        </label>
        <Input
          id="usuario"
          placeholder="Usuario"
          autoComplete="username"
          value={nombre_usuario}
          onChange={(e) => setNombreUsuario(e.target.value)}
          className={ESTILO_CAMPO}
        />
      </div>
      <div className="relative">
        <label htmlFor="contrasena" className="sr-only">
          Contraseña
        </label>
        <Input
          id="contrasena"
          placeholder="Contraseña"
          type={mostrarContrasena ? "text" : "password"}
          autoComplete="current-password"
          value={contraseña}
          onChange={(e) => setContraseña(e.target.value)}
          className={`${ESTILO_CAMPO} pr-10`}
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
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="mt-px h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <Button
        type="submit"
        className="mt-3 h-12 w-full bg-blue-800 text-base text-white hover:bg-blue-900"
        disabled={isLoading}
      >
        {isLoading ? 'Iniciando sesión…' : 'Iniciar sesión'}
      </Button>
    </form>
  );
};

export default FormularioIngreso;
