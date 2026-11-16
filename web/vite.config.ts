import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  server: { allowedHosts: true, host: true }, plugins: [react()], build: { outDir: 'dist' } })
