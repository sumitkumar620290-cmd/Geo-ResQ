import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    // In dev, proxy /api to local FastAPI backend
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      }
    }
  },
  // In production (Vercel), VITE_API_URL env var points to the Render backend
  define: {
    __API_BASE__: JSON.stringify(
      mode === 'production'
        ? (process.env.VITE_API_URL ?? '')
        : ''
    )
  }
}))
