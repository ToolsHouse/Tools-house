import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = repositoryName ? `/${repositoryName}/` : '/Tools-house/'

function githubPagesSpa() {
  return {
    name: 'github-pages-spa',
    closeBundle() {
      const distDir = path.resolve(process.cwd(), 'dist')
      const indexPath = path.join(distDir, 'index.html')
      const notFoundPath = path.join(distDir, '404.html')
      const noJekyllPath = path.join(distDir, '.nojekyll')

      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, notFoundPath)
      }
      fs.writeFileSync(noJekyllPath, '')
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), githubPagesSpa()],
  // Use the repository path on GitHub Pages and the local project path in development.
  base,
  server: {
    port: 3000
  }
})
