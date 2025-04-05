(_ => {
  let ws = '.main>.workspace.strain'
  let table = `${ws}>.table.strain`
  let cols = `${table}>.columns`
  let strain = `${table}>.rows`
  let strainrow = `${strain}>.row.record`
  let photos = `${strain}>.workspace.photos>.table.photos`
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

      $(`body>${strain}>[x-child]`).trigger('add-child')
    })
    .on('send', `>${strain}`, e => {
      e.stopPropagation()

      $(sadatalist).trigger('fetch')
    })
    .on('click', `>${strainrow}:not(.selected)`, e => {
      e.stopPropagation()

      let id = $(e.currentTarget).data('id')

      // FIXME: same problem with clutter as notes child in lifecycle, et al
      let photourl = `photos/${id}`
      $(`body>${photos}`).attr({
        breadcrumb: photourl,
        'x-fetch': photourl,
      })

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

    // strain attribute edit functions
    .on('click', `>${sabtns} >.save`, e => {
      e.stopPropagation()

      let $sel = $(e.currentTarget).selected()
      if ($sel.length === 0) {
        throw new Error('no strainattribute selected')
      }

      let url = `${$(e.currentTarget)
        .parents('[breadcrumb]')
        .first()
        .attr('breadcrumb')}/${$sel.attr('id')}`

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

      let url = `${$(e.currentTarget)
        .parents('[x-target]')
        .first()
        .attr('breadcrumb')}/${$sel.attr('id')}`

      $sel.trigger('default-remove', url)
    })
})()