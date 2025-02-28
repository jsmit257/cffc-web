$(_ => {
  let previous = {}
  let rownames = ['main', 'ancillary', 'reporting'/*,'analytics*/]
  let blacklist = ['./logout', './valid']
  let changerow = ((len) => (curr, dir) =>
    rownames[(len + rownames.indexOf(curr) + Number(dir)) % len])(rownames.length)

  $(window)
    .on('focus', e => {
      e.stopPropagation();

      $('body>.login').trigger('check-valid')
    })
    .on('blur', e => { // cheap logout function, but unlikely use-case
      e.stopPropagation();

      $('body>.login').trigger('check-valid')
    })
    .trigger('focus')  // someday i'll figure out why both of these are needed
    .focus()

  $(document)
    .data('forbidden', [])
    .on('keyup', 'body', e => e.ctrlKey
      && e.key === 'F'
      && document.body.requestFullscreen())
    .on('reload', e => {
      let hashes = document.location.hash.split('#')
      if (hashes.length > 1) {
        hashes.shift()
      } else {
        hashes = ['main', 'lifecycle']
      }

      $('body>.main>.header>.menu-scroll').trigger('select', hashes)
    })
    .on("ajaxError", (e, xhr, opts, err) => {
      if (xhr.status == 403) {
        $(e.delegateTarget)
          .trigger('forbidden', opts)
          .find('body>.login')
          .trigger('activate')
      } else if (xhr.status != 302) {
        $(document.body).find('>.notification').trigger('activate', [
          'error',
          `${opts.method} - ${opts.url}`,
          err,
        ])
        // console.log('xhr', opts.url, xhr)
        // console.log('opts', opts.url, opts)
      }
    })
    .on('forbidden', (e, opts) => blacklist.includes(opts.url) || $(e.delegateTarget)
      .data('forbidden')
      .push(opts))
    .on('unforbidden', e => $(e.delegateTarget)
      .data('forbidden')
      .splice(0, $(e.delegateTarget).data('forbidden').length)
      .forEach($.ajax))

  $('body>.main>.header')
    .on('click', '>.menuitem:not(.selected)', (e, data) => {
      let $t = $(e.currentTarget).addClass('selecting')
      let row = $(e.delegateTarget).attr('menu-row')
      let name = $t.attr('name')

      let $workspace = $(e.delegateTarget)
        .parent()
        .find('>.workspace')

      $(e.delegateTarget)
        .find('>.menuitem.selected')
        .removeClass('selected')

      $workspace
        .find(`>div.active`)
        .removeClass('active')

      $workspace
        .find(`>.${$t.attr('tab-name') || name}`)
        .trigger('activate', data || $t)
        .addClass('active')

      $t.toggleClass('selected selecting')

      previous[row] = name

      document.location.hash = `${row}#${name}`
    })
    .on('select', '>.menu-scroll', (e, ...path) => {
      let data
      let btn
      switch (path.length) {
        case 3:
          data = path[2] // let it fall through
        case 2:
          if (!(btn = previous[path[0]])) {
            btn = previous[path[0]] = path[1]
          }
          $(e.delegateTarget).attr('menu-row', path[0])
          break
        case 1:
          // this really shouldn't be allowed: things go wrong if the
          // button isn't on the active row
          btn = path[0]
          break
      }

      $(e.delegateTarget).find(`>.menuitem[name="${btn}"]`).trigger('click', data)
    })
    .on('click', '>.menu-scroll>div[dir]', e => {
      let $h = $(e.delegateTarget)

      let next = changerow($h.attr('menu-row'), $(e.currentTarget).attr('dir'))
      $h.attr('menu-row', next)

      let btn = previous[next]
      if (!btn) {
        btn = previous[next] = $h.find('>.menuitem:visible').first().attr('name')
      }

      $h.find(`>[name="${btn}"]`).click()
    })

  $('[x-frag]').each((i, n) => $(n)
    .one('activate', (e, ...data) => $(e.currentTarget)
      .trigger('fetch', [$(n).attr('x-frag'), ...data])))

  $('[x-frag]')
    .on('fetch', (e, frag, ...data) => $(e.currentTarget)
      .trigger('decorate', [
        e.currentTarget.attributes['x-style'] || `./css/${frag}.css`,
        e.currentTarget.attributes['x-script'] || `./js/${frag}.js`
      ])
      .trigger('activate', data))
    // ($.ajax({
    //   url: `./frag/_${frag}.html`,
    //   method: 'GET',
    //   success: html => $(e.currentTarget)
    //     .empty()
    //     .html(html)
    //     .trigger('decorate', [
    //       e.currentTarget.attributes['x-style'] || `./css/${frag}.css`,
    //       e.currentTarget.attributes['x-script'] || `./js/${frag}.js`
    //     ])
    //     .trigger('activate'),
    //   error: console.log,
    // }))
    .on('decorate', (e, link, script) =>
      $(document.head).append($('<link>').attr({
        href: link,
        rel: 'stylesheet',
        as: 'style',
      })).append($('<script>').attr({
        src: script,
        type: 'text/javascript',
      })))

  buildcss = query => {
    console.log($($(query)
      .parents()
      .get()
      .reverse())
      .map((_, v) => '.'
        + v.className.replace(/\s+/g, '.')
        + (v.id !== '' ? `#${v.id}` : '')
        + $(v.attributes)
          .map((_, v) => `[${v.nodeName + (v.nodeValue !== '' ? '="' + v.nodeValue + '"' : '')}]`)
          .get()
          .join(''))
      .get()
      .filter(v => v !== '.')
      .join('>'))
  }
})
