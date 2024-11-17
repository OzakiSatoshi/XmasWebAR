import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          mediapipe: ['@mediapipe/tasks-vision']
        }
      }
    },
    assetsInlineLimit: 0
  },
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-vision']
  }
});