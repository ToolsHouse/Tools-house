import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = `/${repositoryName || 'Tools_House'}/`

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use the repository path on GitHub Pages and the local project path in development.
  base,
  server: {
    port: 3000
  }
})
