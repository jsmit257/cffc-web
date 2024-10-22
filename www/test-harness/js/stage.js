$(_ => {
  let $stage = $('body>.main>.workspace>.stage')
    .on('activate', e => $(e.currentTarget)
      .addClass('active')
      .find('>.table>.rows')
      .trigger('refresh'))

  let $table = $stage.find('>.table>.rows')
    .on('send', '>.row', (e, data = {}) => {
      e.stopPropagation()

      $(e.currentTarget).find('>.name').val(data.name)
    })

  $stage.find('>.table>.buttonbar')
    .on('click', '>.edit.active', e => $table.trigger('edit', {
      data: $selected => JSON.stringify({ name: $selected.find('>.name').val() })
    }))
    .on('click', '>.add.active', e => {
      $table.trigger('add', {
        data: $selected => JSON.stringify({ name: $selected.find('>.name').val() }),
        success: console.log,
      })
    })
    .on('click', '>.remove.active', e => $table.trigger('delete'))
    .on('click', '>.refresh', e => $table.trigger('refresh'))
})