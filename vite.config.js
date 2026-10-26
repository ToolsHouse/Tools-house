import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: Update this base path to match your GitHub repository name
  // Format: '/your-repo-name/'
  // Example: If your repo is 'username/tools-house', use '/tools-house/'
  base: '/tools-house-react-new/',
  server: {
    port: 3000
  }
})
