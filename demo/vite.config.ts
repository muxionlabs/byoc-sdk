import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repoRoot = path.resolve(__dirname, '..')

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3005,
    strictPort: true,
    fs: {
      allow: [repoRoot],
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  define: {
    'process.env.VITE_WORKFLOW_API_KEY': JSON.stringify(process.env.VITE_WORKFLOW_API_KEY || '')
  }
})

