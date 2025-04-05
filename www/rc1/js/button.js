(_ => {
  let bar = '.buttonbar'
  let defaults = `${bar}>.default`
  let static = `:not(.editing, .adding)>${defaults}`

  $(document.body)
    .on('click', `${defaults}.delete`, e => {
      e.stopPropagation()

      let $table = $(e.currentTarget)
        .parents('[breadcrumb]')
        .first()

      let $row = $(e.currentTarget).selected()

      let url = `${$table.attr('breadcrumb')}/${$row.attr('id')}`
      $row.trigger('default-remove', url)
    })
    .on('click', `${static}.notes`, e => {
      e.stopPropagation()

      let $parent = $(e.currentTarget)
        .parents('.table')
        .first()

      if ($parent.hasClass('noting')) $parent
        .find('.table.notes')
        .trigger('fetch')
        .removeClass('editing adding')
        .find('.editing')
        .removeClass('editing adding')
        .find('.rowbar')
        .trigger('reset')

      $parent.toggleClass('noting')
    })
    .on('click', `${static}.photos`, e => {
      e.stopPropagation()

      let $parent = $(e.currentTarget)
        .parents('.table')
        .first()

      if ($parent.hasClass('photoing')) $parent
        .find('.table.photos')
        .trigger('fetch')
        .addClass('gallery')
        .removeClass('detail noting editing adding')
        .find('.editing')
        .removeClass('editing adding')
        .find('.rowbar')
        .trigger('reset') // XXX: what about this?

      $parent.toggleClass('photoing')
    })
    .on('click', `${static}.refresh`, e => {
      e.stopPropagation()

      $(e.currentTarget)
        .parents('[breadcrumb][x-target]')
        .first()
        .trigger('fetch')
    })
    .on('click', `${defaults}.save`, e => {
      e.stopPropagation()

      let $table = $(e.currentTarget.parentNode)
        .trigger('toggle', e.currentTarget)
        .parents('[breadcrumb]')
        .first()

      let body = {}, args
      $(e.currentTarget)
        .selected()
        .trigger('marshal', body)
        .trigger('default-update', args = [
          `${$table.attr('breadcrumb')}/${body.id}`.replace(/\/$/, ''),
          {
            method: body.id ? 'PATCH' : 'POST',
            body: body,
          }])
    })
    .on('toggle', bar, (e, caller) => {
      e.stopPropagation()

      let $bar = $(e.currentTarget)
      if (!caller) {
        caller = $bar.find('>.edit').get(0)
      }
      let classes = caller?.className
      if (/\badd\b/.test(classes)) {
        $(caller).toggleClass('add cancel').attr('x-alt', 'add')
      } else if (/\bedit\b/.test(classes)) {
        $(caller).toggleClass('edit cancel').attr('x-alt', 'edit')
      } else {
        let $alt = $bar.find('[x-alt]')
        $alt
          .toggleClass(`cancel ${$alt.attr('x-alt')}`)
          .removeAttr('x-alt')
      }
      $bar.find('>.action').toggleClass('delete save')
    })
    .on('click', `${defaults}.control`, e => { // handles add, edit and cancel
      e.stopPropagation()

      if ($(e.currentTarget).css('cursor') === 'not-allowed') {
        return // unfortunate consequence of the rest of this being so simple
      }

      let classes = e.currentTarget.className
      let $table = $(e.currentTarget.parentNode)
        .trigger('toggle', e.currentTarget)
        .parents('[x-target]')
        .first()

      if (/\badd\b/.test(classes)) {
        $table
          .find($table.attr('x-target'))
          .first()
          .trigger('new-record')
      } else if (/\bedit\b/.test(classes)) {
        $table.selected().trigger('enable-record')
      } else if ($table.hasClass('adding')) { // button must be cancel
        $table
          .removeClass('editing adding')
          .selected()
          .trigger('remove-record')
      } else {
        $table.trigger('disable-record')
      }
    })
})()