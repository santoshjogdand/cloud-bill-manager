import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',  // Fix for missing images & icons
  build: {
    outDir: "dist"
  }
});

server: {
  host: true
}
