(_ => {
  let $eventtype = $('body>.main>.workspace>.eventtype')
    .on('activate', e => {
      $('.template>.stages').trigger('refresh')

      $eventtype
        .addClass('active')
        .find('>.table>.rows')
        .trigger('refresh')
    })

  let $table = $eventtype.find('>.table>.rows')
    .on('send', '>.row', (e, data = { stage: {} }) => {
      e.stopPropagation()

      let $e = $(e.currentTarget)

      $e.find('>.name').val(data.name)
      $e.find('>.severity').val(data.severity)
      $e.find('>.stages').val(data.stage.id)
    })

  $eventtype.find('>.table>.buttonbar')
    .on('click', '>.edit.active', e => {
      $table.trigger('edit', {
        data: $selected => JSON.stringify({
          name: $selected.find('>.name').val(),
          severity: $selected.find('>.severity').val(),
          stage: {
            id: $selected.find('>.stages').val()
          }
        }),
        cancel: _ => $table.find('>.selected').trigger('resend'),
      })
    })
    .on('click', '>.add.active', e => {
      $table.trigger('add', {
        data: $selected => JSON.stringify({
          name: $selected.find('>.name').val(),
          severity: $selected.find('>.severity').val(),
          stage: {
            id: $selected.find('>.stages').val()
          }
        }),
        success: console.log,
      })
    })
    .on('click', '.remove.active', e => $table.trigger('delete'))
    .on('click', '>.refresh', e => $table.trigger('refresh'))
})()