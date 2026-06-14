import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Production is served from GitHub Pages at https://<user>.github.io/keys-angler/.
// In dev we serve from '/' so the preview opens cleanly at localhost:5173/.
export default defineConfig(({ command }) => {
  const base = command === 'build' ? '/keys-angler/' : '/'

  // NetworkFirst: prefer the live API on WiFi, fall back to cache when offshore.
  // The app also mirrors every fetch into IndexedDB with a timestamp — that copy
  // drives offline render + "last updated" labels; this is a fast secondary cache.
  const apiCache = (name, host) => ({
    urlPattern: ({ url }) => url.hostname.includes(host),
    handler: 'NetworkFirst',
    options: {
      cacheName: name,
      networkTimeoutSeconds: 6,
      expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
      cacheableResponse: { statuses: [0, 200] },
    },
  })

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: { enabled: true, type: 'module' },
        includeAssets: ['favicon.svg', 'icons/icon-180.png'],
        manifest: {
          id: '/keys-angler/',
          name: 'Keys Angler',
          short_name: 'Keys Angler',
          description:
            'Advanced offline-first fishing & trapping intelligence for the Upper Florida Keys.',
          start_url: '/keys-angler/',
          scope: '/keys-angler/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#06141b',
          theme_color: '#06141b',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,json}'],
          navigateFallback: `${base}index.html`,
          runtimeCaching: [
            apiCache('noaa-tides', 'tidesandcurrents.noaa.gov'),
            apiCache('open-meteo', 'open-meteo.com'),
            apiCache('nws', 'weather.gov'),
            apiCache('fwc-gis', 'myfwc.com'),
            apiCache('ncei', 'ngdc.noaa.gov'),
            {
              urlPattern: ({ url }) => /tile\.openstreetmap\.org|tiles\.openseamap\.org/.test(url.hostname),
              handler: 'CacheFirst',
              options: {
                cacheName: 'map-tiles',
                expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
  }
})
