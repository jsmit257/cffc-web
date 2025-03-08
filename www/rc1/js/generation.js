(_ => {
  let ws = '.main>.workspace.generation'
  let table = `${ws}>.table.generation`
  let ndx = `${table}>.rows.ndx`
  let ndxrows = `${ndx}>.row`
  let gen = `${table}>.singleton.generation`
  let progeny = `${gen}>.field>.progeny`
  let srctable = `${table}>.workspace.sources>.table.sources`
  let srcrows = `${srctable}>.rows>.row.record`
  let events = `${table}>.child-table>.events>.rows`
  let eventrows = `${events}>.row.record`

  $(document.body)
    .on('activate', `>${ws}`, e => {
      e.stopPropagation()

      $(`body>${progeny}`)
        // .attr('x-fetch', 'strains')
        .trigger('fetch')
      // .removeAttr('x-fetch')

      $(e.currentTarget)
        .find('>.table.generation>.child-table.sources')
        .trigger('add-child')

      $(e.currentTarget)
        .find('>.table.generation>.child-table.events')
        .trigger('add-child')
    })
    .on('fetch', `>${progeny}`, e => {
      e.stopPropagation()

      $(e.currentTarget)
        .prepend($('<option>')
          .addClass('permanent')
          .val('#')
          .text('none'))
    })
    .on('click', `>${ndxrows}:not(.selected)`, e => {
      e.stopPropagation()

      let url = `generation/${$(e.currentTarget).data('id')}`
      fetch(url).then(async resp => {
        if (resp.status !== 200) throw {
          status: resp.status,
          msg: await resp.text()
        }
        return resp.json()
      }).then(json => {
        return {
          plating_substrate: {
            id: '#',
            name: 'n/a',
            severity: 'n/a',
            stage: {
              name: 'n/a',
            }
          },
          events: [],
          ...json,
        }
      }).then(json => {
        $(`body>${eventrows}`).remove()

        // console.log('im adding more records in main', json)
        $(`body>${gen}`)
          .data(json)
          .trigger('render-record', json)
          .data('events')
        return json.events
      }).then(evts => {
        console.log('im adding more records', evts)
        $(`body>${events}`).trigger('send', evts)
      }).catch(ex => $('.alert').trigger('app-error', [
        'error',
        `fetching index rows '${url} statusCode: ${ex.status}`,
        ex.message ?? ex,
      ]))
    })

    .on('render-record', `>${gen}`, (e, data) => {
      e.stopPropagation()

      let url = `/strain/${data.id}/generation`
      fetch(url).then(async resp => {
        switch (resp.status) {
          case 200: return await resp.json()
          case 204: return { id: '#' }
          default: throw {
            status: resp.status,
            message: await resp.text(),
          }
        }
      }).then(json => {
        $(`body>${progeny}`).val(json?.id)
      }).catch(ex => $('.alert').trigger('app-error', [
        'error',
        `GET ${url} statusCode: ${ex.status}`,
        ex.message ?? ex,
      ]))

      $(`body>${srcrows}`).remove()

      $(`body>${srctable}>.rows`)
        .send(data.sources)
        .find('.row:not(.x-template) input, .row:not(.x-template) select')
        .trigger('change')
    })

    // called from tablejs's render-record: div.trigger(format, v) when render=sources
    .on('sources', `>${ndxrows}>.sources`, (e, ...sources) => {
      e.stopPropagation()

      $(e.currentTarget).text($(sources)
        .map((_, v) => v.strain.name)
        .get()
        .join(' + ') || 'None')
    })
})()