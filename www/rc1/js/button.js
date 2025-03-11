(_ => {
  let static = '.table:not(.editing, .adding)>.buttonbar'
  let editing = '.table.editing>.buttonbar'
  let adding = '.table.editing>.buttonbar'

  $(document.body)
    .on('click', `${static}>.default.delete`, e => {
      let $table = $(e.currentTarget)
        .parents('[breadcrumb][x-target]')
        .first()

      let $sel = $table.find(`${$table.attr('x-target')} .selected`)
      if ($sel.length === 0) {
        throw new Error(`${$table.attr('x-target')} .selected`)
      }

      let url = `${$table.attr('breadcrumb')}/${$sel.attr('id')}`
      console.log('default-remove', url)
      $sel.trigger('default-remove', url)
    })
    .on('click', `${static}>.default.add`, e => {
      e.stopPropagation()

      let $table = $(e.currentTarget)
        .parents('[x-target]')
        .first()

      $table
        .find($table.attr('x-target'))
        .trigger('new-row')
    })
    .on('click', `${static}>.default.update`, e => { })
    .on('click', '.table:not(.editing, .adding)>.buttonbar>.default.refresh', e => { })
    .on('click', '.table.editing>.buttonbar>.default.ok', e => { })
    .on('click', '.table.adding>.buttonbar>.default.ok', e => {
      e.stopPropagation()

      let $table = $(e.currentTarget)
        .parents('[breadcrumb][x-target]')
        .first()

      let $sel = $table.find(`${$table.attr('x-target')} .selected`)
      if ($sel.length === 0) {
        throw new Error($table.attr('x-target'))
      }

      let body = {}
      $sel
        .trigger('marshal', body)
        .trigger('default-update', [
          $table.attr('breadcrumb'),
          {
            method: 'POST',
            body: JSON.stringify(body),
          }])

      console.log('default-update', [$table.attr('breadcrumb'), {
        method: 'POST',
        body: JSON.stringify(body),
      }])
    })
    .on('click', '.table.editing>.buttonbar>.default.cancel', e => { })
    .on('click', '.table.adding>.buttonbar>.default.cancel', e => {
      // find editing and disable it
    })
})()