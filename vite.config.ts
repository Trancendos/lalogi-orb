import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// Termux / low-memory ARM often fails when Workbox minifies the SW with terser.
const disablePwa = process.env.DISABLE_PWA === '1'

export default defineConfig({
  plugins: [
    react(),
    ...(!disablePwa
      ? [
          VitePWA({
            registerType: 'autoUpdate',
            strategies: 'generateSW',
            minify: false,
            includeAssets: ['favicon.svg'],
            manifest: {
              name: 'Lalogi Orb',
              short_name: 'Lalogi Orb',
              description: 'Family constellation by blood and by love',
              theme_color: '#030308',
              background_color: '#030308',
              display: 'standalone',
              orientation: 'any',
              start_url: '/',
              scope: '/',
              icons: [
                {
                  src: 'favicon.svg',
                  sizes: 'any',
                  type: 'image/svg+xml',
                  purpose: 'any',
                },
              ],
            },
            workbox: {
              // Skip terser minify of the service worker (avoids Termux early exit)
              mode: 'development',
              globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
              maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
              cleanupOutdatedCaches: true,
              clientsClaim: true,
            },
            devOptions: {
              enabled: false,
            },
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 2500,
    target: 'es2020',
    minify: 'esbuild',
  },
  server: {
    port: 5173,
    host: true,
  },
})
