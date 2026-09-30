import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PUBLICO_URL } from "@/lib/urls";

/** Envuelve las rutas privadas: si no hay sesión real, manda al login del módulo público. */
const RequireAuth = () => {
  const { usuario, cargando } = useAuth();

  useEffect(() => {
    // El login es otra app, así que es una navegación completa y no un <Navigate>.
    if (!cargando && !usuario) window.location.replace(PUBLICO_URL);
  }, [cargando, usuario]);

  // Mientras se resuelve /auth/me (o mientras redirige) no se muestra nada.
  if (cargando || !usuario) return null;

  return <Outlet />;
};

export default RequireAuth;
