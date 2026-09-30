import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// En Docker el backend se alcanza por nombre de servicio; en local se puede pisar con VITE_PROXY_TARGET.
const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://gestion-backend:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 8080,
    proxy: {
      '/api': proxyTarget,
      '/auth': proxyTarget,
    },
  },
})
