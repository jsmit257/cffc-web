$(_ => {
  let $eventtype = $('body>.main>.workspace>.eventtype')
    .on('activate', e => $eventtype
      .addClass('active')
      .find('>.table>.rows')
      .trigger('refresh'))

  let $table = $eventtype.find('>.table>.rows')
    .on('pre-send', e => {
      e.stopPropagation()

      $.ajax({
        url: '/stages',
        method: 'GET',
        async: false,
        success: data => $(e.currentTarget)
          .find('>.row.template>.stage')
          .trigger('send', data),
        error: console.log,
      })
    })
    .on('send', '>.row', (e, data = { stage: {} }) => {
      e.stopPropagation()

      let $e = $(e.currentTarget)

      $e.find('>.name').val(data.name)
      $e.find('>.severity').val(data.severity)
      $e.find('>.stage').val(data.stage.id)
    })
    .on('send', '>.row>.stage', (e, ...data) => {
      e.stopPropagation()

      let $e = $(e.currentTarget)
        .empty()

      data.forEach(r => {
        $e.append($(new Option())
          .val(r.id)
          .text(r.name))
      })
    })

  $eventtype.find('>.table>.buttonbar')
    .on('click', '>.edit.active', e => {
      $table.trigger('edit', {
        data: $selected => JSON.stringify({
          name: $selected.find('>.name').val(),
          severity: $selected.find('>.severity').val(),
          stage: {
            id: $selected.find('>.stage').val()
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
            id: $selected.find('>.stage').val()
          }
        }),
        success: console.log,
      })
    })
    .on('click', '.remove.active', e => $table.trigger('delete'))
    .on('click', '>.refresh', e => $table.trigger('refresh'))
})