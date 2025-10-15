import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365 as const
const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  clearScreen: false,
  base,
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
