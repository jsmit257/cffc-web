(_ => {
  let ws = '.main>.workspace.strain'
  let table = `${ws}>.table.strain`
  let cols = `${table}>.columns`
  let strain = `${table}>.rows`
  let strainrows = `${strain}>.row.record`
  let btns = `${table}>.buttonbar`
  let sa = `${table}>.table.strainattributes`
  let sadatalist = `${sa}>#strain-attr-names`
  let sacols = `${sa}>.columns`
  let attrs = `${sa}>.rows`
  let attrrows = `${attrs}>.row.record`
  let sabtns = `${sa}>.buttonbar`

  $(document.body)
    .on('activate', `>${ws}`, e => {
      e.stopPropagation()
      // console.log('strain', strain, $(`body>${strain}`))
    })
    .on('send', `>${strain}`, e => {
      e.stopPropagation()

      $(sadatalist).trigger('fetch')
    })
    .on('click', `>${strainrows}:not(.selected)`, e => {
      e.stopPropagation()

      $(`body>${attrrows}`).remove()

      let url = `strain/${$(e.currentTarget).data('id')}`
      fetch(url)
        .then(async resp => {
          if (resp.status !== 200) throw {
            status: resp.status,
            message: await resp.text(),
          }
          return await resp.json()
        })
        .then(json => $(`body>${attrs}`).trigger('send', json.attributes))
        .catch(ex => $(e.currentTarget).alert('error',
          `GET ${url} statusCode: ${ex.status || 'unsent'}`,
          ex.message ?? ex))
    })

    // strain attribute edit functions
    .on('click', `>${sabtns}>.ok`, e => {
      e.stopPropagation()

      let $sel = $(e.currentTarget).selected()
      if ($sel.length === 0) {
        throw new Error('no strainattribute selected')
      }

      let sid = $(e.currentTarget)
        .parents('.table.strain')
        .selected()
        .attr('id')
      let url = `strain/${sid}/attribute/${$sel.attr('id')}`

      let params = { method: 'PATCH', body: {} }
      if ($(e.currentTarget)
        .parents('[breadcrumb][x-target]')
        .first()
        .hasClass('adding')
      ) {
        params.method = 'POST'
        url = url.replace(/\/undefined$/, '')
        $(e.currentTarget.parentNode)
          .find('>.cancel')
          .toggleClass('add cancel -add')
      } else {
        $(e.currentTarget.parentNode)
          .find('>.cancel')
          .toggleClass('update cancel -update')
      }

      $sel
        .trigger('marshal', params.body)
        .trigger('default-update', [url, params])
    })
    .on('click', `>${sabtns}>.add`, e => {
      e.stopPropagation()

      $(e.currentTarget).toggleClass('add cancel -add')
    })
    .on('click', `>${sabtns}>.update`, e => {
      e.stopPropagation()

      $(e.currentTarget).toggleClass('update cancel -update')
    })
    .on('click', `>${sabtns}>.cancel`, e => {
      e.stopPropagation()

      if ($(e.currentTarget).hasClass('-add')) {
        $(e.currentTarget).toggleClass('add cancel -add')
      } else {
        $(e.currentTarget).toggleClass('update cancel -update')
      }
    })
    .on('click', `>${sabtns}>.delete`, e => {
      e.stopPropagation()

      let $sel = $(e.currentTarget).selected()
      if ($sel.length === 0) {
        throw new Error('no strainattribute selected')
      }

      let sid = $(e.currentTarget)
        .parents('.table.strain')
        .selected()
        .attr('id')
      let url = `strain/${sid}/attribute/${$sel.attr('id')}`

      $sel.trigger('default-remove', url)
    })
})()