(_ => {
  let ws = '.workspace.substrate'
  let table = `${ws}>.table.substrate`
  let sub = `${table}>.rows`
  let subrows = `${sub}>.row.record`
  let child = `${table}>.child-table>.table.ingredient`
  let ing = `${child}>.rows`
  let ingrows = `${ing}>.row.record`

  $(document.body)
    .on('activate', `>${ws}`, e => {
      e.stopPropagation()

      $(e.currentTarget) // create a modified ingredients
        .find('>.table.lifecycle>.ingredients')
        .trigger('add-child')

      let $ingredients = $(`body>${child}`).addClass('')
    })

})()