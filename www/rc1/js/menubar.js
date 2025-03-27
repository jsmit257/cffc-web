$(_ => {
  let menubar = '.menubar'
  let ndx = `${menubar}>.ndx`
  let ndxbtn = `${ndx}>.menubtn`
  let items = `${menubar}>.items`
  let itembtn = `${items}>.menubtn`
  let main = '.main'
  let spaces = `${main}>.workspace`

  $(document.body)
    .on('init', `>${menubar}`, e => {
      e.stopPropagation()

      let menu = localStorage.menu ?? (localStorage.menu = 'main')
      let slug = localStorage[menu] ?? (localStorage[menu] =
        $(`body>${itembtn}.${menu}`)
          .first()
          .attr('x-stub'))

      $(e.currentTarget).addClass(`menu-${menu}`)
        .find(`[category="${menu}"], [x-stub="${slug}"]`)
        .addClass('selected')

      $(e.currentTarget).trigger('enable-workspace')
    })
    .on('enable-workspace', `>${menubar}`, e => {
      e.stopPropagation()

      let slug = localStorage[localStorage.menu]

      console.log('wtf?', $(`body>${spaces}.${slug}`))
      if ($(`body>${spaces}.${slug}`).trigger('activate', slug).length) {
        console.log('already loaded')
        return
      }

      $('<div>')
        .addClass(`workspace ${slug}`)
        .attr('x-child', slug)
        .appendTo($(`body>${main}`))
        .trigger('add-child', $table => $table
          .parent()
          .trigger('activate', slug))
    })
    .on('click', `>${menubar} .menubtn.selected`, e => {
      e.stopPropagation()

      $(e.currentTarget.parentNode.parentNode).toggleClass('selecting')
    })
    .on('click', `>.selecting${ndxbtn}.selected`, e => {
      e.stopPropagation()

      $(e.currentTarget.parentNode.parentNode).trigger('enable-workspace')
    })
    .on('click', `>${ndxbtn}:not(.selected)`, e => {
      e.stopPropagation()

      $(`body>${ndxbtn}.selected`).removeClass('selected')

      let menu = localStorage.menu = $(e.currentTarget)
        .addClass('selected')
        .attr('category')

      $(e.currentTarget.parentNode.parentNode)
        .removeClass('menu-main menu-aux menu-reporting')
        .addClass(`menu-${menu}`)

      let slug = localStorage[menu] ?? (localStorage[menu] =
        $(`body>${itembtn}.${menu}`)
          .first()
          .attr('x-stub'))

      $(`body>${itembtn}.${menu}[x-stub=${slug}]`).addClass('selected')
    })
    .on('click', `>.selecting${itembtn}.selected`, e => {
      e.stopPropagation()

      $(e.currentTarget.parentNode.parentNode).trigger('enable-workspace')
    })
    .on('click', `>${itembtn}:not(.selected)`, e => {
      e.stopPropagation()

      $('[x-stub].selected').removeClass('selected')

      localStorage[localStorage.menu] = $(e.currentTarget)
        .addClass('selected')
        .attr('x-stub')

      $(e.currentTarget.parentNode.parentNode)
        .removeClass('selecting')
        .trigger('enable-workspace')
    })
})