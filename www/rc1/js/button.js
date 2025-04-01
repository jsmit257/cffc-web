(_ => {
  let static = '.table:not(.editing, .adding)>.buttonbar'
  let editing = '.table.editing:not(.adding)>.buttonbar'
  let adding = '.table.adding>.buttonbar'

  $(document.body)
    .on('click', `${static}>.default.refresh`, e => {
      e.stopPropagation()

      $(e.currentTarget)
        .parents('[breadcrumb][x-target]')
        .first()
        .trigger('fetch')
    })
    .on('click', `${static}>.default.delete`, e => {
      e.stopPropagation()

      let $table = $(e.currentTarget)
        .parents('[breadcrumb][x-target]')
        .first()

      let $sel = $table.find(`${$table.attr('x-target')} .selected`)
      if ($sel.length === 0) {
        throw new Error(`${$table.attr('x-target')} .selected`)
      }

      let url = `${$table.attr('breadcrumb')}/${$sel.attr('id')}`
      // console.log('default-remove', url)
      $sel.trigger('default-remove', url)
    })
    .on('click', `${static}>.default.add`, e => {
      e.stopPropagation()

      let $table = $(e.currentTarget)
        .parents('[x-target]')
        .first()

      $table
        .find($table.attr('x-target'))
        .trigger('new-record')
    })
    .on('click', `${static}>.default.update`, e => {
      e.stopPropagation()

      $(e.currentTarget).selected().trigger('enable-record')
    })
    .on('click', `${editing}>.default.ok`, e => {
      e.stopPropagation()

      let $table = $(e.currentTarget)
        .parents('[breadcrumb][x-target]')
        .first()

      let params = { method: 'PATCH', body: {} }
      $(e.currentTarget)
        .selected()
        .trigger('marshal', params.body)
        .trigger('default-update', [
          `${$table.attr('breadcrumb')}/${params.body.id}`,
          params,
        ])

      // console.log('default-update', params)
    })
    .on('click', `${adding}>.default.ok`, e => {
      e.stopPropagation()

      let $table = $(e.currentTarget)
        .parents('[breadcrumb][x-target]')
        .first()

      let body = {}, args
      $(e.currentTarget)
        .selected()
        .trigger('marshal', body)
        .trigger('default-update', args = [
          $table.attr('breadcrumb'),
          {
            method: 'POST',
            body: body,
          }])

      // console.log('default-update', args)
    })
    .on('click', `${editing}>.default.cancel`, e => {
      e.stopPropagation()

      $(e.currentTarget)
        .parents('.editing')
        .first()
        .trigger('disable-record')
    })
    .on('click', `${adding}>.default.cancel`, e => {
      e.stopPropagation()

      $(e.currentTarget)
        .parents('.adding')
        .first()
        .removeClass('editing adding')
        .selected()
        .trigger('remove-record')
    })
})()