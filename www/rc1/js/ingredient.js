(_ => {
  let ws = '.workspace.ingredient'
  let aschild = '.workspace.ingredients'

  $(document.body)
    .on('activate', `${ws}`, e => e.stopPropagation())
    .on('activate', `${aschild}`, e => {
      e.stopPropagation()

      $(e.currentTarget)
        .addClass('active')
        .find('>.table.ingredient')
        .trigger('fetch')

      console.log('selected',
        $(e.currentTarget).parents('.table'),
        $(e.currentTarget).parents('.table').selected().length)
    })
})()