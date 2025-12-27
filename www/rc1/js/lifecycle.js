(_ => {
  const ws = '.main>.workspace.lifecycle'
  const table = `${ws}>.table.lifecycle`
  const ndx = `${table}>.rows.ndx`
  const ndxrow = `${ndx}>.row.record`
  const lifecycle = `${table}>.singleton.lifecycle`
  const events = `${table}>.child-table.event>.table.event`
  const eventrow = `${events}>.rows>.row.record`
  const notes = `${table}>.child-table.note>.table.note`
  const yield = `${lifecycle}>label>.yield`
  const count = `${lifecycle}>label>.count`
  const gross = `${lifecycle}>label>.gross`

  $(document.body)
    .on('activate', `>${ws}`, e => e.stopPropagation())
    .on('select', `>${ndxrow}`, e => {
      e.stopPropagation()

      const id = $(e.currentTarget).data('id'),
        url = `${sessionStorage[sessionStorage.menu]}/${id}`

      fetch(url).then(async resp => {
        if (resp.status !== 200) throw {
          status: resp.status,
          msg: await resp.text()
        }

        $(`body>${notes}`).attr({
          breadcrumb: `${url}/note`,
          'x-fetch': `notes/${id}`,
        })

        $(`body>${events}`).attr({
          breadcrumb: `${url}/event`,
          'x-fetch': `${url}/events`,
        })

        $(`body>${table}`).removeClass('seeking')

        return await resp.json()
      }).then(json => new Object({
        yield: 0,
        count: 0,
        gross: 0,
        bulk_cost: 0,
        strain_cost: 0,
        grain_cost: 0,
        ...json,
      })
      ).then(json => $(`body>${lifecycle}`).data(json).trigger('unmarshal', json)
      ).catch(ex => $(e.currentTarget).notify('error',
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
