// $(() => {
(_ => {
  let $ingredient = $('body>.main>.workspace>.ingredient')
    .on('activate', e => $(e.currentTarget)
      .addClass('active')
      .find('>.table>.rows')
      .trigger('refresh'))

  let $table = $ingredient.find('>.table>.rows')
    .on('send', '>.row', (e, data = {}) =>
      $(e.currentTarget).find('>.name').val(data.name))

  let $buttonbar = $ingredient.find('>.table>.buttonbar')
    .on('click', '>.edit.active', e => {
      $table.trigger('edit', {
        data: $selected => JSON.stringify({ name: $selected.find('>.name').val() }),
        cancel: _ => $table.find('>.selected').trigger('resend'),
      })
    })
    .on('click', '>.add.active ', e => {
      $table.trigger('add', {
        data: $selected => JSON.stringify({ name: $selected.find('>.name').val() }),
        success: console.log,
      })
    })
    .on('click', '>.remove.active', e => $table.trigger('delete'))
    .on('click', '>.refresh', e => $table.trigger('refresh'))
})()
