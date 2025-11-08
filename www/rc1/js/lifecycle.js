(_ => {
  let ws = '.main>.workspace.lifecycle'
  let table = `${ws}>.table.lifecycle`
  let ndx = `${table}>.rows.ndx`
  let ndxrow = `${ndx}>.row.record`
  let lifecycle = `${table}>.singleton.lifecycle`
  let events = `${table}>.child-table.events>.table.events`
  let eventrow = `${events}>.rows>.row.record`
  let notes = `${table}>.child-table.notes>.notes`

  let yield = `${lifecycle}>label>.yield`
  let count = `${lifecycle}>label>.count`
  let gross = `${lifecycle}>label>.gross`

  $(document.body)
    .on('activate', `>${ws}`, e => {
      e.stopPropagation()

      $(`body>${table}>[x-child="note"]`).trigger('add-child', $ws => {
        let breadcrumb = `lifecycle/${sessionStorage.lifecycle}/note`
        $ws.find('>.table.notes').attr({
          breadcrumb,
          'x-fetch': `notes/${sessionStorage.lifecycle}`,
        })
      })

      $(`body>${table}>[x-child="event"]`).trigger('add-child', $ws => {
        let breadcrumb = `lifecycle/${sessionStorage.lifecycle}/events`
        $ws.find('>.table.events').attr({
          breadcrumb,
          'x-fetch': breadcrumb,
        })
      })
    })
    .on('select', `>${ndxrow}`, e => {
      e.stopPropagation()

      let breadcrumb = `notes/${$(e.currentTarget).data('id')}`
      $(`body>${notes}`).attr({
        breadcrumb,
        'x-fetch': breadcrumb,
      })
    })
    .on('select', `>${ndxrow}`, e => {
      e.stopPropagation()

      let url = `${sessionStorage[sessionStorage.menu]}/${$(e.currentTarget).data('id')}`
      fetch(url).then(async resp => {
        if (resp.status !== 200) throw {
          status: resp.status,
          msg: await resp.text()
        }
        $(`body>${events}`).attr({
          breadcrumb: `${url}/events`,
          'x-fetch': `${url}/events`,
        })
        $(`body>${table}`).removeClass('seeking')
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
      }).catch(ex => $(e.currentTarget).notify('error',
        `GET ${url} statusCode: ${ex.status ?? 'unsent'}`,
        ex,
      ))
    })
    .on('click', `>${ndxrow}.selected`, e => {
      if ($(e.currentTarget)
        .parents('.table.lifecycle')
        .first()
        .hasClass('editing')) {
        return
      }
      e.stopPropagation()

      $(e.currentTarget.parentNode.parentNode).toggleClass('seeking')
    })

    .on('clear', `>${lifecycle}`, e => {
      e.stopPropagation()

      $(e.currentTarget).find('.per-kilo, .dry-weight, div[name]')
        .text('')
    })
    .on('unmarshal', `>${lifecycle}`, (e, data) => {
      e.stopPropagation()

      $(`body>${eventrow}`).remove()

      if (!$(`body>${events}>.rows`)
        .trigger('send', data.events ?? [])
        .selected($(e.currentTarget).breadcrumb())
        .length
      ) {
        $(`body>${eventrow}:first-child`).click()
      }
    })
    .on('marshal', `>${ndxrow}`, (e, data) => {
      e.stopPropagation()

      $(`body>${lifecycle}`).trigger('marshal', data)
    })
    .on('new-record', `>${ndx}`, e => {
      e.stopPropagation()

      $(`body>${lifecycle}`).trigger('clear')
    })
    .on('enable-record', `>${ndxrow}`, e => {
      e.stopPropagation()

      $(`body>${lifecycle}`).trigger('enable-record')
    })
    .on('disable-record', `>${ndx}`, e => {
      e.stopPropagation()

      let $singleton = $(`body>${lifecycle}`)
      $singleton
        .removeClass('editing adding')
        .trigger('unmarshal', $singleton.data())
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