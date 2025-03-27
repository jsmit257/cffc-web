$(_ => {
  let spaces = '.main>.workspace'

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

      $(`body>${spaces}.active`).removeClass('active')

      let sel = `#${localStorage[slug]}`
      if (sel === '#undefined') {
        sel = ':first-child'
      }

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
        resolve($(await resp.text()).appendTo($(e.currentTarget).removeAttr('x-child'))) // once is enough
      }).catch(ex => $(`.alert`).trigger('app-error', [
        'error',
        `loading fragment ${url} statusCode: ${ex.status}`,
        ex.message || ex,
      ]))
    })

    // menus (menubar.js?)
    .on('click', '.menubtn[category]:not(.selected)', e => {
      $('[category].selected').removeClass('selected')

      let $btn = $(e.currentTarget)
        .addClass('selected')

      $(e.currentTarget.parentNode.parentNode)
        .removeClass('menu-main menu-aux menu-reporting')
        .addClass(`menu-${$btn.attr('category')}`)

      let menu = localStorage.menu = $btn.attr('category')
      let slug = localStorage[localStorage.menu]

      $(`body>.menubar>.items>.menubtn.${menu}[x-stub=${slug}]`)
        .trigger('click')
    })
    .on('click', '.menubtn[x-stub]:not(.selected)', e => {
      $('[x-stub].selected').removeClass('selected')

      let slug = $(e.currentTarget)
        .addClass('selected')
        .attr('x-stub')

      localStorage[localStorage.menu ?? 'main'] = slug

      if ($(`body>${spaces}.${slug}`).trigger('activate', slug).length) {
        return
      }

      $(document.head).trigger('add-resource', {
        src: slug,
        href: slug,
      })

      let url = `./frag/${slug}.html`
      fetch(url)
        .then(async resp => {
          if (resp.status != 200) throw {
            status: resp.status,
            message: await resp.text()
          }
          return await resp.text()
        })
        .then(html => $('<div>')
          .addClass(`workspace active ${slug}`)
          .html(html)
          .appendTo('body>.main'))
        .then(workspace => workspace.trigger('activate', slug))
        .catch(ex => $('.alert').trigger('app-error', [
          'error',
          `loading fragment ${url}`,
          ex.message ?? ex,
        ]))
    })
})
