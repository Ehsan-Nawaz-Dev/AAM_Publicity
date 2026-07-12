import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Set VITE_API_TARGET=http://localhost:4000 to develop against a local backend.
  const target = env.VITE_API_TARGET || 'http://aampower.com'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': { target, changeOrigin: true },
        '/uploads': { target, changeOrigin: true }
      }
    }
  }
})
