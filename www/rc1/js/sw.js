self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('my-cache').then(cache => {
      return cache.addAll([
        '/index.html',
        '/js/index.js',
        '/js/util.js',
        '/js/table.js',
        '/js/alert.js',
        '/css/index.css',
        '/css/table.css',
        '/css/alert.css',
        '/css/images/background/image.avif',
      ])
    })
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request)
    })
  )
})
