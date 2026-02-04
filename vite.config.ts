import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // '0.0.0.0' или true заставляет сервер слушать все IP-адреса
    host: true, 
    // port: 3000, // (опционально) можно зафиксировать порт
  }
})
