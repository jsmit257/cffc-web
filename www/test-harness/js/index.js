$(_ => {
  let previous = {}
  let rownames = ['main', 'ancillary', 'reporting'/*,'analytics*/]
  let blacklist = ['/logout', '/valid']
  let changerow = ((len) => {
    return (curr, dir) => { return rownames[(len + rownames.indexOf(curr) + Number(dir)) % len] }
  })(rownames.length)

  $(document)
    .data('forbidden', [])
    .on('reload', e => {
      let hashes = document.location.hash.split('#')
      if (hashes.length > 1) {
        hashes.shift()
      } else {
        hashes = ['main', 'lifecycle']
      }

      $('body>.main>.header>.menu-scroll').trigger('select', hashes)
    })
    .on('error-message', (e, ...data) => {
      console.log('error-message', ...data)
    })
    .on("ajaxError", (e, xhr, opts, err) => {
      if (xhr.status == 403) {
        if (opts.url !== '/valid') {
          console.log('pushing opts', opts)
          $(e.delegateTarget).trigger('forbidden', opts)
        }
        $('body>.login').trigger('activate')
      } else {
        $(e.delegateTarget).trigger('error-message', [err, opts.url])
        console.log('xhr', opts.url, xhr)
        console.log('opts', opts.url, opts)
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
