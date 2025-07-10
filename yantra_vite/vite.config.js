import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 3006,
    host: '0.0.0.0', // <- expose to external traffic
    strictPort: true,
    allowedHosts: ['dicomviewer.digitalclinics.ai'],
  }
}) 