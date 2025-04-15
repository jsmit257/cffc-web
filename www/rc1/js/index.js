$(_ => {
  let spaces = '.main>.workspace'
  let hide = '.footer>.cookie-bar>.list>li>label>input'
  let noretry = ['valid']

  window.fetch = (windowFetch => function (url, params) {
    return windowFetch(url, params).then(resp => {
      switch (resp.status) {
        case 502:
        case 403:
          $(document).trigger(resp.status, [url.replace(/^\/*/, ''), params])
          break

        // for historical reasons failed auths send a `redirect` even though
        // they don't actually redirect at a network level - they're treated
        // as an alternate sort of success
        // case 3xx:

        case 400:
        case 404: // anything special about this one?
        case 405: // `resp.text()` doesn't matter here
        case 500:
        // if we make handlers for above 4xx-5xx statuses, they might need 
        // to include the response and also need to be async; for now, just
        // letting them fall through to the client where they can call 
        // `notify()` from the element that initited the call (if that matters)
        default:
        // 2xx (and 3xx and the other 4xx-5xx for the time being)
        // console.log('not forbidden/bad gateway', resp.status, url, params)
      }

      return resp
    }).catch(ex => { throw ex })
  })(window.fetch)

  $(document)
    .data('forbidden', [])
    .on('502', (e, url, params) => {
      if (url === 'valid') {
        // disable auth check?
      } else {
        // something's really wrong, e.g.: the API host is still authing
        // but the webserver doesn't have a route to the auth server
      }
      throw { // remove this throw when the above is properly implemented
        status: 502,
        message: "bad gateway (see index.js)",
      }
    })
    .on('403', (e, url, params) => {
      noretry.includes(url) || $(e.currentTarget)
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
      ).catch(ex => $(e.currentTarget).notify('error',
        `GET ${url} statusCode: ${ex.status ?? 'unsent'}`,
        ex,
      ))
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

      $(e.currentTarget)
        .addClass('active')
        .find(`>.table.${slug}`)
        .trigger('fetch')
    })
    .on('add-child', '[x-child]', (e, resolve = _ => _) => {
      e.stopPropagation()

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
        return await resp.text()
      }).then(html => $(e.currentTarget)
        .append($(html))
        .removeAttr('x-child') // once is enough
        .trigger('activate', slug)
      ).then(ws => resolve(ws)
      ).catch(ex => $(e.currentTarget).notify('error',
        `GET ${url} statusCode: ${ex.status ?? 'unsent'}`,
        ex,
      ))
    })
    .on('click', `>${hide}`, e => {
      localStorage[e.currentTarget.id] = e.currentTarget.checked

      $('body>.main')[e.currentTarget.checked // withClass doesn't exist yet
        ? 'addClass'
        : 'removeClass'
      ](e.currentTarget.id)
    })

  Array('deleted', 'uuid', 'timestamp').forEach(v => {
    let id = `hide-${v}`
    localStorage[id] === 'true' && $(`body>${hide}#${id}`).click()
  })
})
