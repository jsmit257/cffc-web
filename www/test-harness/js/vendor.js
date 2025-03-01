// $(_ => {
(_ => {
  let $vendor = $('body>.main>.workspace>.vendor')
    .on('activate', e => $vendor
      .addClass('active')
      .find('>.table>.rows')
      .trigger('refresh'))

  let $table = $vendor.find('>.table>.rows')
    .on('send', '>.row', (e, data = {}) => {
      e.stopPropagation()

      let $row = $(e.currentTarget)

      $row.find('>.name').val(data.name)
      $row.find('>.website').val(data.website)
    })
    .on('click', '>.row>.website', e => {
      e.stopPropagation()

      if (e.ctrlKey) {
        window.open($(e.currentTarget).val(), '_erehwon').focus()
      }
    })

  $vendor.find('>.table>.buttonbar')
    .on('click', '>.edit.active', e => {
      $table.trigger('edit', {
        data: $selected => JSON.stringify({
          name: $selected.find('>.name').val(),
          website: $selected.find('>.website').val(),
        }),
      })
    })
    .on('click', '>.add.active', e => {
      $table.trigger('add', {
        data: $selected => JSON.stringify({
          name: $selected.find('>.name').val(),
          website: $selected.find('>.website').val()
        }),
        success: console.log,
      })
    })
    .on('click', '>.remove.active', e => $table.trigger('delete'))
    .on('click', '>.refresh', e => $table.trigger('refresh'))
})()