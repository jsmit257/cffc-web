(_ => {
  let ws = '.main>.workspace.strain'
  let table = `${ws}>.table.strain`
  let cols = `${table}>.columns`
  let strain = `${table}>.rows`
  let strainrows = `${strain}>.row.record`
  let btns = `${table}>.buttonbar`
  let sa = `${table}>.table.strainattributes`
  let salist = `${sa}>#strain-attr-names`
  let sacols = `${sa}>.columns`
  let attrs = `${sa}>.rows`
  let attrrows = `${attrs}>.row.record`
  let sabtns = `${sa}>.buttonbar`

  $(document.body)
    .on('activate', `>${ws}`, e => {
      e.stopPropagation()
      // console.log('strain', strain, $(`body>${strain}`))
    })
    .on('send', `>${strain}`, e => $(salist).trigger('fetch'))
    .on('click', `>${strainrows}:not(.selected)`, e => {
      e.stopPropagation()

      $(`body>${attrrows}`).remove()

      let url = `strain/${$(e.currentTarget).data('id')}`
      fetch(url)
        .then(async resp => await resp.json())
        .then(json => $(`body>${attrs}`).trigger('send', json.attributes))
        .catch(ex => $('.alert')
          .trigger('app-error', [`fetching index rows '${url}`, ex]))
    })
})()