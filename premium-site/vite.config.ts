import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  envDir: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  css: { postcss: { plugins: [] } },
  server: { host: 'localhost', port: 5176, strictPort: true },
  preview: { host: 'localhost', port: 5176, strictPort: true },
});
