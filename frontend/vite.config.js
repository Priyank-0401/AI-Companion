import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
    fs: {
      // Allow serving files from one level up from the package root
      allow: ['..'],
    },
  },
  // Copy model files to the public directory during build
  build: {
    assetsInlineLimit: 0, // Disable inlining of assets to ensure models are copied
    terserOptions: {
      compress: {
        drop_console: true, // This line removes console.log
        drop_debugger: true, // This line removes debugger statements
      },
    },
  },
  // Serve model files from node_modules
  optimizeDeps: {
    include: ['@vladmandic/face-api'],
  },
})
