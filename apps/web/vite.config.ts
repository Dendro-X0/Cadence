import { defineConfig } from 'vite'
import pkg from './package.json' with { type: 'json' }
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tsconfigPaths from 'vite-tsconfig-paths'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    tsconfigPaths(),
    svelte(),
    VitePWA({
      devOptions: { enabled: true },
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'offline.html', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon-180.png'],
      manifest: {
        name: 'Cadence',
        short_name: 'Cadence',
        description: 'Focus and motivation timer with templates, keyboard shortcuts, and offline support.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'browser'],
        background_color: '#0b1020',
        theme_color: '#0ea5e9',
        categories: ['productivity', 'health-fitness', 'lifestyle'],
        shortcuts: [
          { name: 'Timer', url: '/?tab=timer', description: 'Open the Timer' },
          { name: 'Templates', url: '/?tab=templates', description: 'Browse templates' },
          { name: 'Settings', url: '/?tab=settings', description: 'Open settings' }
        ],
        icons: [
          { src: 'favicon.svg', sizes: '64x64', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        navigateFallback: 'offline.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: { cacheName: 'images', expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 } }
          },
          {
            urlPattern: ({ request }) => request.destination === 'font',
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } }
          },
          {
            urlPattern: ({ request }) => request.destination === 'audio',
            handler: 'CacheFirst',
            options: { cacheName: 'audio', expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 30 } }
          }
        ]
      }
    })
  ],
  server: { port: 5174, strictPort: true, host: '0.0.0.0' }
})
