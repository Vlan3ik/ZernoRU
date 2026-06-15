import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiProxyTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:5080'
const hmrHost = process.env.VITE_HMR_HOST?.trim() || undefined
const hmrClientPort = Number(process.env.VITE_HMR_CLIENT_PORT ?? process.env.APP_PORT ?? 18081)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    hmr: {
      ...(hmrHost ? { host: hmrHost } : {}),
      clientPort: Number.isFinite(hmrClientPort) ? hmrClientPort : 18081,
    },
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
})
