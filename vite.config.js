import { defineConfig } from 'vite';

// The NASA RadLab API (real Moon radiation data) has no CORS headers, so the browser reaches it
// through this same-origin proxy. Works with `npm run dev` and `npm run preview`.
const radlabProxy = {
  '/radlab-api': {
    target: 'https://visualization.osdr.nasa.gov',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/radlab-api/, '/radlab/api'),
  },
};

export default defineConfig({
  // Relative base so the built game works from any static host or sub-folder.
  base: './',
  // three.js alone is ~600 kB minified; that's expected for this game.
  build: { chunkSizeWarningLimit: 800 },
  server: { proxy: radlabProxy },
  preview: { proxy: radlabProxy },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
