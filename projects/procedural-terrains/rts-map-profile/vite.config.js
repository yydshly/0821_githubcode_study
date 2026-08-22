import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: '../../../docs/demos/procedural-terrains/rts-map-profile',
    emptyOutDir: true,
    sourcemap: false,
  },
});
