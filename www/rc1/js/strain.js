(_ => {
  let ws = '.main>.workspace.strain'
  let table = `${ws}>.table.strain`
  let cols = `${table}>.columns`
  let strain = `${table}>.rows`
  let strainrow = `${strain}>.row.record`
  let photos = `${strain}>.workspace.photos>.table.photos`
  let btn = `${table}>.buttonbar>.button`
  let sa = `${table}>.table.strainattributes`
  let sadatalist = `${sa}>#strain-attr-names`
  let attrs = `${sa}>.rows`
  let attrrows = `${attrs}>.row.record`
  let sabtns = `${sa}>.buttonbar`

  $(document.body)
    .on('activate', `>${ws}`, e => {
      e.stopPropagation()

      $(sadatalist).trigger('fetch')

      $(`body>${strain}>[x-child]`).trigger('add-child', $ws => {
        let breadcrumb = `photos/${sessionStorage.strain}`
        $ws.find('>.table.photos').attr({
          breadcrumb,
          'x-fetch': breadcrumb,
        })
      })
    })
    .on('select', `>${strainrow}`, e => {
      e.stopPropagation()

      let id = $(e.currentTarget).data('id')

      // FIXME: same problem with clutter as notes child in lifecycle, et al
      let breadcrumb = `photos/${id}`
      $(`body>${photos}`).attr({
        breadcrumb,
        'x-fetch': breadcrumb,
      })

      $(e.currentTarget)
        .parents('.table.strain')
        .first()
        .find('>.buttonbar>.gen')
        .attr('gen-id', $(e.currentTarget).data('generation')?.id ?? null)

      // XXX: how much do we want attributes to follow the URL pattern
      //  used by photos/notes? it's not a trivial change if we go all
      //  the way back to the database; might as well do events while 
      //  we're at it /snark
      let attrurl = `strain/${$(e.currentTarget).data('id')}`
      fetch(attrurl)
        .then(async resp => {
          if (resp.status !== 200) throw {
            status: resp.status,
            message: await resp.text(),
          }

          // XXX: this will eventually cause a lot of noise in localstorage
          $(`body>${sa}`)
            .attr('breadcrumb', `${attrurl}/attribute`)
            .find('>.rows>.row.record')
            .remove()

          return await resp.json()
        })
        .then(json => {
          if (!$(`body>${attrs}`)
            .trigger('send', json.attributes)
            .selected(sessionStorage[$(`body>${sa}`).attr('breadcrumb')])
            .length
          ) {
            $(`body>${attrrows}:first-child`).click()
          }
        })
        .catch(ex => $(e.currentTarget).notify('error',
          `GET ${attrurl} statusCode: ${ex.status ?? 'unsent'}`,
          ex))
    })
    .on('click', `${btn}.gen`, e => {
      e.stopPropagation()

      $('body>.menubar').trigger('restore', [
        'main',
        'generation',
        $(e.currentTarget).attr('gen-id'),
      ])
    })
})()