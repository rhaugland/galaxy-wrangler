import { defineConfig } from 'vite';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: { globPatterns: ['**/*.{js,css,html,png,svg,json}'] },
      manifest: false,
    }),
  ],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: { globals: true, environment: 'node' },
});
