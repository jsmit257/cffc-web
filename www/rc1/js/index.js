$(_ => {
  let spaces = '.main>.workspace'
  let windowFetch = window.fetch
  let noretry = ['valid']

  window.fetch = function (url, params) {
    return windowFetch(url, params).then(resp => {
      switch (resp.status) {
        case 405: // `resp.text()` doesn't matter here
        case 400:
        case 500:
        // if we make handlers for the above statuses, they might need 
        // to include the response and also need to be async; for now,
        // just leaving it up to the client where they can call `alert()`
        // from the element that initited the call (if that matters)
        case 403:
          $(document).trigger(resp.status, [url, params])
          break
        default:
        // console.log('not forbidden', resp.status, url)
      }

      return resp
    })
  }

  $(document)
    .data('forbidden', [])
    // handle others here?
    .on('403', (e, url, params) => {
      noretry.includes(url.replace(/^[^\/]*/, '')) || $(e.currentTarget)
        .data('forbidden')
        .push([url, params])
    })
    .on('unforbidden', e => {
      $(e.delegateTarget)
        .data('forbidden')
        .splice(0)
        .forEach(fetch)
    })

  $(document.head)
    .on('add-script', (e, slug) => {
      let url = `./js/${slug}.js`
      fetch(url).then(async resp => {
        if (!resp.ok) throw {
          status: resp.status,
          message: await resp.text()
        }
        return resp.text()
      }).then(text =>
        $('<script>')
          .attr('name', slug)
          .text(text)
          .appendTo(e.currentTarget)
      ).catch(ex => $('.alert').trigger('app-error', [
        'error',
        `loading script ${url} statusCode: ${ex.status}`,
        ex.message ?? ex,
      ]))
    })
    .on('add-resource', (e, cfg) => {
      if (cfg?.src && $(e.currentTarget).find(`script[name="${cfg.src}"]`).length === 0) {
        $(e.currentTarget).trigger('add-script', cfg.src)
      }

      if (cfg?.href && $(e.currentTarget).find(`link[href="./css/${cfg.href}.css"]`).length === 0) {
        $('<link>')
          .attr({
            href: `./css/${cfg.href}.css`,
            rel: 'stylesheet',
            as: 'style',
          })
          .appendTo(e.currentTarget)
      }
    })

  $(document.body)
    .on('activate', `>${spaces}`, (e, slug) => {
      e.stopPropagation()

      if ($(e.currentTarget).hasClass('active')) {
        return
      }

      $(`body>${spaces}.active`).removeClass('active')

      let sel = `#${localStorage[slug]}`.replace(/#undefined/, ':first-child')

      $(e.currentTarget)
        .addClass('active')
        .find(`>.table.${slug}`)
        .trigger('fetch', $table => $table
          .find(`.row.record${sel}`)
          .removeClass('selected')
          .click())
    })
    .on('add-child', '[x-child]', (e, resolve = _ => _) => {
      let slug = e.currentTarget.attributes['x-child'].value
      $(document.head).trigger('add-resource', {
        src: slug,
        href: slug,
      })

      let url = `./frag/${slug}.html`
      fetch(url).then(async resp => {
        if (resp.status !== 200) throw {
          status: resp.status,
          message: await resp.text(),
        }

        resolve($(await resp.text())
          .appendTo($(e.currentTarget)
            .removeAttr('x-child'))) // once is enough
      }).catch(ex => $(`.alert`).trigger('app-error', [
        'error',
        `loading fragment ${url} statusCode: ${ex.status}`,
        ex.message || ex,
      ]))
    })
})
