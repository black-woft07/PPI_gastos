import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/mi-proyecto/', // ← el nombre EXACTO del repositorio, con barras al inicio y al final
})