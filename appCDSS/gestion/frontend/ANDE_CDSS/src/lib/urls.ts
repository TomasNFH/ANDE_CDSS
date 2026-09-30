// El login vive en el módulo público: sin sesión, o al cerrarla, se vuelve ahí.
export const PUBLICO_URL = import.meta.env.VITE_PUBLICO_URL || "http://localhost:8091/";
