(_ => {
  let table = '.table.events'
  let datarows = `${table}>.rows>.row.record`

  $(document.body)
    .on('change', `${datarows}>label>.eventtype`, e => {
      e.stopPropagation()

      let $selected = $(e.currentTarget).find('option:selected')
      $(e.currentTarget)
        .parents('.row')
        .first()
        .find('>.eventattrs')
        .text(`${$selected.attr('severity')}/${$selected.attr('stage')}`)
    })
})()