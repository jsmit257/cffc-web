(_ => {
  const ws = '.main>.workspace.strain'
  const table = `${ws}>.table.strain`
  const cols = `${table}>.columns`
  const strain = `${table}>.rows`
  const strainrow = `${strain}>.row.record`
  const photos = `${strain}>.workspace.photos>.table.photos`
  const btn = `${table}>.buttonbar>.button`
  const sa = `${table}>.table.strainattributes`
  const sadatalist = `${sa}>#strain-attr-names`
  const attrs = `${sa}>.rows`
  const attrrows = `${attrs}>.row.record`
  const sabtns = `${sa}>.buttonbar`

  $(document.body)
    .on('activate', `>${ws}`, e => {
      e.stopPropagation()

      $(sadatalist).trigger('fetch')
    })
    .on('select', `>${strainrow}`, e => {
      e.stopPropagation()

      let id = $(e.currentTarget).data('id')

      let breadcrumb = `strain/${id}/photo`
      $(`body>${photos}`).attr({
        breadcrumb,
        'x-fetch': `photos/${id}`,
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
