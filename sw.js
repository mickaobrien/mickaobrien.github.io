importScripts('/_nuxt/workbox.4c4f5ca6.js')

workbox.precaching.precacheAndRoute([
  {
    "url": "/_nuxt/08fe478dce84ea087e82.js",
    "revision": "490300644678bc5ba2b31b46f380397b"
  },
  {
    "url": "/_nuxt/74bee4d2d455e48aa6cf.js",
    "revision": "72dbaa4d9de77178cc56bf87f09ae7b9"
  },
  {
    "url": "/_nuxt/fa600323d81cab0ab6b2.js",
    "revision": "7cdf5b914d8d50d0bc201d3a784157bc"
  },
  {
    "url": "/_nuxt/ffd6ebe35f8b0ae53a74.js",
    "revision": "2589eb5b3d05cb91f8bfd5282b677f72"
  }
], {
  "cacheId": "nuxt",
  "directoryIndex": "/",
  "cleanUrls": false
})

workbox.clientsClaim()
workbox.skipWaiting()

workbox.routing.registerRoute(new RegExp('/_nuxt/.*'), workbox.strategies.cacheFirst({}), 'GET')

workbox.routing.registerRoute(new RegExp('/.*'), workbox.strategies.networkFirst({}), 'GET')
