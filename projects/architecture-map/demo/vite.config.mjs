import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  // Upstream TSX intentionally omits `import React`; make the host's JSX runtime explicit.
  esbuild: {
    jsx: 'automatic',
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    host: '127.0.0.1',
    port: 4178,
  },
  preview: {
    host: '127.0.0.1',
    port: 4178,
  },
})
