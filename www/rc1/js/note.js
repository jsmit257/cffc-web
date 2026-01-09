(_ => {
  const ws = '.child-table.note'
  const table = `${ws}>.table.note`
  const row = `${table}>.rows>.row.record`
  const note = `${row}>label>textarea`
  const btn = `${row}>.rowbar>.button`
  const add = `${table}>.buttonbar>.add`

  $(document.body)
    .on('activate', `${ws}`, e => e.stopPropagation())
    .on('click', row, e => e.stopPropagation())
    .on('click', `${add}`, e => {
      e.stopPropagation()

      $(e.currentTarget.parentNode.parentNode)
        .find('>.rows')
        .first()
        .trigger('new-record')
        .find('>.selected>.rowbar')
        .trigger('toggle')
    })
})()
