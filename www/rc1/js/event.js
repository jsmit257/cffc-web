(_ => {
  let table = '.table.events'
  let eventrow = `${table}>.rows>.row.record`

  $(document.body)
    .on('activate', '.child-table.events', (e, slug) => {
      e.stopPropagation()

      $(e.currentTarget)
        .find(`>${table}>[x-child]`)
        .trigger('add-child', _ => $(e.currentTarget).selected().trigger('select'))
    })
    .on('select', `${eventrow}`, e => {
      e.stopPropagation()

      const $eventrow = $(e.currentTarget),
        id = $eventrow.data('id'),
        $table = $eventrow.parents(table),
        breadroot = `${$table.attr('breadcrumb')}/${id}`

      $table.find('>.workspace.photos>.table.photos').attr({
        breadcrumb: `${breadroot}/photo`,
        'x-fetch': `photos/${id}`,
      })

      $table.find('>.workspace.notes>.table.notes').attr({
        breadcrumb: `${breadroot}/note`,
        'x-fetch': `notes/${id}`,
      })
    })
    .on('change', `${eventrow}>label>.eventtype`, e => {
      e.stopPropagation()

      let $selected = $(e.currentTarget).find('option:selected')
      $(e.currentTarget)
        .parents('.row')
        .first()
        .find('>.eventattrs')
        .text(`${$selected.attr('severity')}/${$selected.attr('stage')}`)
    })
})()