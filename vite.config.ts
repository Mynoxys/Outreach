import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static SPA backed by Supabase. For a GitHub Pages *project* site, set
// VITE_BASE to "/<repo-name>/" at build time; Vercel/Netlify use "/".
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
  server: { port: 5173 },
})
