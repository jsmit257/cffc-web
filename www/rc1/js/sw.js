self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('cffc-cache').then(cache => {
      return cache.addAll([
        '/index.html',
        '/css/images/background/image.avif',

        // placeholders, js and css get concatenated and/or minified for prod
        '/js/index.js',
        '/js/util.js',
        '/js/table.js',
        '/js/alert.js',
        '/css/index.css',
        '/css/table.css',
        '/css/alert.css',

        // but do we cache fragments and dynamic scripts/links?
      ])
    })
  )
})

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(async response => {
      return response || await fetch(e.request)
    }).catch(ex => {
      console.log(ex)
    })
  )
})
