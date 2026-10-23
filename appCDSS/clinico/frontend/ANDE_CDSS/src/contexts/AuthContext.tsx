import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { PUBLICO_URL } from "@/lib/urls";

export interface UsuarioSesion {
  id_usuario: number;
  username: string;
  rol: string;
  email: string;
}

type AuthContextValue = {
  usuario: UsuarioSesion | null;
  cargando: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [cargando, setCargando] = useState(true);

  // Al cargar, preguntar al backend si hay sesión real (la cookie es httpOnly, JS no la ve).
  useEffect(() => {
    fetch("/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setUsuario(data))
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false));
  }, []);

  // Volver "atrás" después del logout restaura la página desde el bfcache sin pedir nada.
  // Recargar hace que /auth/me responda 401 y RequireAuth mande al login.
  useEffect(() => {
    const alVolverAtras = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", alVolverAtras);
    return () => window.removeEventListener("pageshow", alVolverAtras);
  }, []);

  const logout = async () => {
    try {
      await fetch("/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // aunque falle el backend, igual salimos
    }
    window.location.href = PUBLICO_URL;
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
