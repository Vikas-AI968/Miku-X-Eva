import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/chat': {
        target: 'https://miku-x-eva-backend.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/health': {
        target: 'https://miku-x-eva-backend.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
