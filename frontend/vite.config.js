import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        headers: {
          Connection: 'keep-alive',
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.warn('[vite proxy error]', err.message);
          });
        }
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    allowedHosts: ['srimayanmatrimony.com', 'www.srimayanmatrimony.com', 'localhost', '127.0.0.1']
  }
})
