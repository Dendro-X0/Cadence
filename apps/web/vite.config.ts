import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365
const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true
  },
  resolve: {
    alias: {
      '@cadence/core-domain': r('../../packages/core-domain/src'),
      '@cadence/storage': r('../../packages/storage/src'),
      '@cadence/templates': r('../../packages/templates/src'),
      '@cadence/notifications': r('../../packages/notifications/src')
    }
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Focus Motive',
        short_name: 'FM',
        description: 'Lightweight cross-platform focus and motivation PWA',
        theme_color: '#0ea5e9',
        background_color: '#0b1020',
        display: 'standalone',
        start_url: '/',
        lang: 'en',
        orientation: 'portrait',
        icons: []
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*$/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 30, maxAgeSeconds: ONE_YEAR_SECONDS }
            }
          }
        ]
      }
    })
  ]
})
