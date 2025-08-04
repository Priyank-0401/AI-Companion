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
  worker: {
    format: 'es', // Use ES module format for MediaPipe ES module compatibility
  },
  build: {
    assetsInlineLimit: 0, // Disable inlining of assets to ensure models are copied
      
    // This tells Vite to use the Terser minifier
    minify: 'terser', 

    // Your existing Terser options will now be used
    terserOptions: {
      compress: {
        drop_console: true, // This line removes console.log
        drop_debugger: true, // This line removes debugger statements
      },
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.task')) {
            return 'assets/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  // Serve model files from node_modules
  optimizeDeps: {
    include: ['@vladmandic/face-api', '@mediapipe/tasks-vision'],
  },
})