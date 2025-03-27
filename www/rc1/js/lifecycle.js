(_ => {
  let ws = '.main>.workspace.lifecycle'
  let table = `${ws}>.table.lifecycle`
  let ndx = `${table}>.rows.ndx`
  let ndxrows = `${ndx}>.row.record`
  let lifecycle = `${table}>.singleton.lifecycle`
  let events = `${table}>.child-table>.events>.rows`
  let eventrows = `${events}>.row.record`

  let yield = `${lifecycle}>label>.yield`
  let count = `${lifecycle}>label>.count`
  let gross = `${lifecycle}>label>.gross`

  $(document.body)
    .on('activate', `>${ws}`, e => {
      e.stopPropagation()

      $(e.currentTarget) // create events
        .find('>.table.lifecycle>.events')
        .trigger('add-child')
    })
    .on('click', `>${ndxrows}.selected`, e => {
      if ($(e.currentTarget)
        .parents('.table.lifecycle')
        .first()
        .hasClass('editing')) {
        return
      }
      e.stopPropagation()

      $(e.currentTarget.parentNode.parentNode).toggleClass('seeking')
    })
    .on('click', `>${ndxrows}:not(.selected)`, e => {
      e.stopPropagation()

      let url = `${localStorage[localStorage.menu]}/${$(e.currentTarget).data('id')}`
      fetch(url).then(async resp => {
        if (resp.status !== 200) throw {
          status: resp.status,
          msg: await resp.text()
        }

        // XXX: this will eventually cause a lot of noise in localstorage
        $(`body>${events}`).parent().attr('breadcrumb', `${url}/events`)

        $(e.currentTarget.parentNode.parentNode).removeClass('seeking')

        return await resp.json()
      }).then(json => {
        return {
          yield: 0,
          count: 0,
          gross: 0,
          bulk_cost: 0,
          strain_cost: 0,
          grain_cost: 0,
          ...json,
        }
      }).then(json => {
        $(`body>${lifecycle}`).data(json).trigger('unmarshal', json)
      }).catch(ex => $('.alert').trigger('app-error', [
        'error',
        `fetching index rows '${url} statusCode: ${ex.status}`,
        ex.message || ex,
      ]))
    })

    .on('click', `>${table}:not(.editing)>.buttonbar>.add`, e => {
      e.stopPropagation()

      $(`body>${ndx}`)
        .trigger('new-record')
        .selected()
        .trigger('unmarshal', {
          id: 'newrow',
          mtime: new Date().toISOString(),
        })

      $(`body>${lifecycle}`).trigger('clear').trigger('enable-record')
    })
    .on('click', `>${table}:not(.editing)>.buttonbar>.update`, e => {
      e.stopPropagation()

      $(`body>${lifecycle}`).trigger('enable-record')
    })
    .on('click', `>${table}.editing>.buttonbar>.ok`, e => {
      e.stopPropagation()

      let params = {
        method: /\badding\b/.test(e.currentTarget.parentNode.parentNode.className)
          ? 'POST'
          : 'PATCH',
        body: {}
      }
      $(e.currentTarget.parentNode.parentNode)
        .find('>.singleton.lifecycle')
        .trigger('marshal', params.body)
        .trigger('default-update', [
          `lifecycle/${params.body.id}`.replace(/\/$/, ''),
          params,
        ])

      console.log(".trigger('default-update",
        `lifecycle/${params.body.id}`.replace(/\/$/, ''),
        params)
    })
    .on('click', `>${table}.editing>.buttonbar>.cancel`, e => {
      e.stopPropagation()

      let $singleton = $(`body>${lifecycle}`)

      $singleton
        .removeClass('editing adding')
        .trigger('unmarshal', $singleton.data())
    })

    .on('clear', `>${ndx}`, e => $(`body>${lifecycle}`).trigger('clear'))
    .on('clear', `>${lifecycle}`, e => {
      e.stopPropagation()

      $(e.currentTarget).find('.per-kilo, .dry-weight, div[name]')
        .text('')
    })
    .on('unmarshal', `>${lifecycle}`, (e, data) => {
      e.stopPropagation()

      $(`body>${eventrows}`).remove()

      if (!$(`body>${events}`).trigger('send', data.events ?? [])
        .selected(localStorage[$(e.currentTarget)
          .parents('[x-target]')
          .first()
          .attr('breadcrumb')])
      ) {
        $(`body>${eventrows}:first-child`).click()
      }
    })

    .on('change', `>${yield}, >${count}, >${gross}`, e => {
      let $fields = $(`body>${lifecycle}`).find('>label')
      let grs = $fields.find('>.gross').val()
      let cnt = $fields.find('>.count').val()
      let yld = $fields.find('>.yield').val()

      $fields.find('>.dry-weight').trigger('fixed', [yld / grs * 100, 3])
      $fields.find('>.per-kilo').trigger('fixed', [cnt / yld * 1000, 2])
    })
})()