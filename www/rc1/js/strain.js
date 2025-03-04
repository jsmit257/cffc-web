(_ => {
  let ws = 'body>.main>.workspace.strain'
  let table = `${ws}>.table.strain`
  let cols = `${table}>.columns`
  let rows = `${table}>.rows`
  let btns = `${table}>.buttonbar`
  let sa = `${table}>.table.strainattributes`
  let salist = `${sa}>.strain-attr-names`
  let sacols = `${sa}>.columns`
  let sarows = `${sa}>.rows`
  let sabtns = `${sa}>.buttonbar`

  $(document.body)
    .on('activate', `${ws}`, e => $(`${salist}`).trigger('fetch'))

})()