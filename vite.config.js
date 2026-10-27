import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages: /Tools-house/
  // Must match your GitHub repository name exactly
  base: '/Tools-house/',
  server: {
    port: 3000
  }
})
