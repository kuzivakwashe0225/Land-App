import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5005',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        withCredentials: true,
      },
      '/uploads': {
        target: 'http://localhost:5005',
        changeOrigin: true,
        secure: false,
        withCredentials: true,
      }
    }
  },
  plugins: [react()],
})
