$(_ => {
  let previous = {}
  let rownames = ['main', 'ancillary', 'reporting'/*,'analytics*/]
  let changerow = ((len) => {
    return (curr, dir) => { return rownames[(len + rownames.indexOf(curr) + Number(dir)) % len] }
  })(rownames.length)

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

  $(document.body)
    .on('error-message', (e, ...data) => {
      console.log('data', ...data)
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
