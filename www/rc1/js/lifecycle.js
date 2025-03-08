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
    .on('click', `>${ndxrows}:not(.selected)`, e => {
      e.stopPropagation()

      let url = `lifecycle/${$(e.currentTarget).data('id')}`
      fetch(url).then(async resp => {
        if (resp.status !== 200) throw {
          status: resp.status,
          msg: await resp.text()
        }
        return resp.json()
      }).then(lc => {
        return {
          yield: 0,
          count: 0,
          gross: 0,
          bulk_cost: 0,
          strain_cost: 0,
          grain_cost: 0,
          events: [],
          ...lc,
        }
      }).then(lc => {
        $(`body>${eventrows}`).remove()

        return $(`body>${lifecycle}`)
          .data(lc)
          .trigger('render-record', lc)
          .data('events')
      }).then(evts => {
        console.log('im adding more records', evts)
        $(`body>${events}`).trigger('send', evts)
      }).catch(ex => $('.alert').trigger('app-error', [
        'error',
        `fetching index rows '${url} statusCode: ${ex.status}`,
        ex.message || ex,
      ]))
    })
    .on('clear', `>${ndx}`, e => $(`body>${lifecycle}`).trigger('clear'))

    .on('change', `>${yield}, >${count}, >${gross}`, e => {
      let $fields = $(`body>${lifecycle}`).find('>label')

      let grs = $fields.find('>.gross').val()
      let cnt = $fields.find('>.count').val()
      let yld = $fields.find('>.yield').val()

      $fields.find('>.dry-weight').trigger('fixed', [yld / grs * 100, 3])
      $fields.find('>.per-kilo').trigger('fixed', [cnt / yld * 1000, 2])
    })
})()