(_ => {
  let ws = '.child-table.notes'
  let table = `${ws}>.table.notes`
  let row = `${table}>.rows>.row.record`
  let note = `${row}>label>textarea`
  let btn = `${row}>.rowbar>.button`
  let add = `${table}>.buttonbar>.add`

  $(document.body)
    .on('activate', `${ws}`, e => {
      e.stopPropagation()

      // console.log('activating notes', $(e.currentTarget)
      //   .parents('.table')
      //   .first())
    })
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
