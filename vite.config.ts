import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // In development the browser talks to this server and Vite forwards /api and /sanctum to Laravel. Same origin means no CORS
  // preflight (OPTIONS) request before every call, which used to double the number of requests the server had to answer.
  // The target is the Laravel API; change it with VITE_API_PROXY_TARGET in .env.
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const target = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8001'

  return {
    plugins: [react(), tailwindcss()],
    // A fixed port: the Laravel backend only accepts sign-in requests from the origins listed in backend/.env
    // (CORS_ALLOWED_ORIGINS and SANCTUM_STATEFUL_DOMAINS). Without this, Vite quietly moves to another port when one is busy,
    // and the portal then shows "Unable to connect". With strictPort it stops with a clear message instead.
    server: { port: 5181, strictPort: true, proxy: { '/api': target, '/sanctum': target } },
    resolve: {
      alias: { '@': path.resolve(import.meta.dirname, './src') },
    },
  }
})
