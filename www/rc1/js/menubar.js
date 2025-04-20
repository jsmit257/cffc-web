$(_ => {
  let menubar = '.menubar'
  let ndx = `${menubar}>.ndx`
  let ndxbtn = `${ndx}>.menubtn`
  let items = `${menubar}>.items`
  let itembtn = `${items}>.menubtn`
  let main = '.main'
  let spaces = `${main}>.workspace`

  $(document.body)
    // this is where it all starts
    .on('init', `>${menubar}`, e => {
      e.stopPropagation()

      let menu = sessionStorage.menu ?? (sessionStorage.menu =
        $(`body>${ndxbtn}`)
          .first()
          .attr('category'))

      let slug = sessionStorage[menu] ?? (sessionStorage[menu] =
        $(`body>${itembtn}.${menu}`)
          .first()
          .attr('x-stub'))

      let itemkey = menu === 'reporting' ? 'x-report' : 'x-stub'
      if (itemkey === 'x-report') {
        // it looks simple to merge this block with slug above, just change `.report` 
        // to '[menu]`, but that complicates `enable-workspace` in non-trivial ways; 
        // still, may be it would make reporting.js `activate`/`fetch` simpler?
        slug = sessionStorage.report ?? (sessionStorage.report =
          $(`body>${itembtn}.${menu}`)
            .first()
            .attr(itemkey))
      }

      $(e.currentTarget)
        .find('>div>.selected')
        .removeClass('selected')

      $(e.currentTarget).addClass(`menu-${menu}`)
        .find(`[category="${menu}"], .${menu}[${itemkey}="${slug}"]`)
        .addClass('selected')

      $(e.currentTarget).trigger('enable-workspace')
    })
    .on('restore', `>${menubar}`, (e, category, item, itemid, ...extra) => {
      e.stopPropagation()

      if ((sessionStorage.menu = category) === 'reporting') {
        category = 'report'
        sessionStorage[`reports/${item}`] = itemid
      } else {
        sessionStorage[item] = itemid
      }
      sessionStorage[category] = item

      $(e.currentTarget)
        .removeClass('menu-main menu-aux menu-reporting')
        .addClass(`menu-${category}`)

      $(e.currentTarget).trigger('init')
    })
    .on('camera', `>${menubar}`, (e, fetchurl, method, success) => {
      e.stopPropagation()

      $(e.currentTarget)
        .data('camera-consumer', $(`body>${spaces}.active`).removeClass('active'))
        .trigger('enable-workspace', 'camera')

      // FIXME: setTimeout is lame; the interval probably matters less than 
      //  breaking out of the main thread
      setTimeout(_ => $(`body>${spaces}.camera`).trigger('init', [
        fetchurl,
        method,
        success,
      ]), 10)
    })
    .on('un-camera', `>${menubar}`, e => {
      e.stopPropagation()

      $(`body>${spaces}.active`).removeClass('active') // this should be camera

      $(e.currentTarget).data('camera-consumer').addClass('active')
    })
    .on('enable-workspace', `>${menubar}`, (e, slug) => {
      e.stopPropagation()

      slug ??= sessionStorage[sessionStorage.menu]

      $(document.body).removeClass('disabled')

      if ($(`body>${spaces}.${slug}`).trigger('activate', slug).length) {
        return
      }

      $('<div>')
        .addClass(`workspace ${slug}`)
        .attr('x-child', slug)
        .appendTo($(`body>${main}`))
        .trigger('add-child')
    })
    .on('click', `>${menubar} .menubtn.selected`, e => {
      e.stopPropagation()

      if ($(e.currentTarget.parentNode.parentNode)
        .toggleClass('selecting')
        .hasClass('selecting')
      ) {
        // // FIXME: move to enable-workspace?
        // $(document.body).addClass('disabled')
      }
    })
    .on('click', `>.selecting${ndxbtn}.selected`, e => {
      e.stopPropagation()

      $(e.currentTarget.parentNode.parentNode).trigger('enable-workspace')
    })
    .on('click', `>${ndxbtn}:not(.selected)`, e => {
      e.stopPropagation()

      $(`body>${ndxbtn}.selected`).removeClass('selected')

      let menu = sessionStorage.menu = $(e.currentTarget)
        .addClass('selected')
        .attr('category')

      $(e.currentTarget.parentNode.parentNode)
        .removeClass('menu-main menu-aux menu-reporting')
        .addClass(`menu-${menu}`)

      let slug = sessionStorage[menu] ?? (sessionStorage[menu] =
        $(`body>${itembtn}.${menu}`)
          .first()
          .attr('x-stub'))

      let itemkey = menu === 'reporting' ? 'x-report' : 'x-stub'
      if (itemkey === 'x-report') {
        // see `init` event for why this is here and not elsewhere
        slug = sessionStorage.report ?? (sessionStorage.report =
          $(`body>${itembtn}.${menu}`)
            .first()
            .attr(itemkey))
      }

      $(`body>${itembtn}.${menu}[${itemkey}=${slug}]`).addClass('selected')
    })
    .on('click', `>.selecting${itembtn}.selected`, e => {
      e.stopPropagation()

      $(e.currentTarget.parentNode.parentNode).trigger('enable-workspace')
    })
    .on('click', `>${itembtn}:not(.selected)`, e => {
      e.stopPropagation()

      $('[x-stub].selected').removeClass('selected')

      sessionStorage[sessionStorage.menu] = $(e.currentTarget)
        .addClass('selected')
        .attr('x-stub')

      $(e.currentTarget.parentNode.parentNode)
        .removeClass('selecting')
        .trigger('enable-workspace')
      // // FIXME: move to enable-workspace?
      // .parent()
      // .removeClass('disabled')

    })
})