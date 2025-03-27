self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('cffc-cache').then(cache => {
      // do we stash everything here?
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

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(async response => {
      return response || await fetch(e.request)
    }).catch(ex => {
      console.log(ex)
    })
  )
})
