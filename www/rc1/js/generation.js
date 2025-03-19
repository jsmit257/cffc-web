(_ => {
  let ws = '.main>.workspace.generation'
  let table = `${ws}>.table.generation`
  let ndx = `${table}>.rows.ndx`
  let ndxrows = `${ndx}>.row.record`
  let gen = `${table}>.singleton.generation`
  let progeny = `${gen}>.field>.progeny`
  let srctable = `${table}>.workspace.sources>.table.sources`
  let srcrows = `${srctable}>.rows>.row.record`
  let events = `${table}>.child-table>.events>.rows`
  let eventrows = `${events}>.row.record`

  $(document.body)
    .on('activate', `>${ws}`, e => {
      e.stopPropagation()

      $(`body>${progeny}`).trigger('fetch')

      $(e.currentTarget)
        .find('>.table.generation>.child-table.sources')
        .trigger('add-child')

      $(e.currentTarget)
        .find('>.table.generation>.child-table.events')
        .trigger('add-child')
    })
    .on('click', `>${ndxrows}.selected`, e => {
      if ($(e.currentTarget)
        .parents('.table.generation')
        .first()
        .hasClass('editing')) {
        return
      }
      e.stopPropagation()
      $(e.currentTarget.parentNode.parentNode)
        .toggleClass('seeking')
    })
    .on('click', `>${ndxrows}:not(.selected)`, e => {
      if ($(e.currentTarget)
        .parents('.table.generation')
        .first()
        .hasClass('editing')) {
        return
      }
      e.stopPropagation()

      let url = `generation/${$(e.currentTarget).data('id')}`
      fetch(url).then(async resp => {
        if (resp.status !== 200) throw {
          status: resp.status,
          msg: await resp.text()
        }

        $(`body>${events}`)
          .parent()
          // XXX: this will eventually cause a lot of noise in localstorage
          .attr('breadcrumb', `${url}/events`)

        return resp.json()
      }).then(json => {
        $(e.currentTarget.parentNode.parentNode)
          .removeClass('seeking')

        return {
          events: [],
          ...json,
        }
      }).then(json => {
        $(`body>${eventrows}`).remove()

        $(`body>${gen}`)
          .data(json)
          .trigger('unmarshal', json)
          .data('events')
        return json.events
      }).then(evts => {
        if (!$(`body>${events}`)
          .trigger('send', evts)
          .selected()
        ) {
          $(`body>${eventrows}:first-child`).click()
        }
      }).catch(ex => $('.alert').trigger('app-error', [
        'error',
        `fetching index rows '${url} statusCode: ${ex.status}`,
        ex.message ?? ex,
      ]))
    })

    .on('click', `>${table}:not(.editing)>.buttonbar>.add`, e => {
      e.stopPropagation()

      $(`body>${ndx}`)
        .trigger('new-record')
        .selected()
        .prependTo(`body>${ndx}`)
        .trigger('unmarshal', {
          id: 'newrow',
          ctime: new Date().toISOString(),
        })

      $(`body>${gen}`).trigger('enable-record')
    })
    .on('click', `>${table}:not(.editing)>.buttonbar>.update`, e => {
      e.stopPropagation()

      $(e.currentTarget.parentNode.parentNode)
        .find('>.singleton.generation')
        .trigger('enable-record')
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
        .find('>.singleton.generation')
        .trigger('marshal', params.body)
        .trigger('default-update', [
          `generation/${params.body.id}`.replace(/\/$/, ''),
          params,
        ])

      console.log(".trigger('default-update", `generation/${params.body.id}`, params)
    })
    .on('click', `>${table}.editing>.buttonbar>.cancel`, e => {
      e.stopPropagation()

      let $singleton = $(e.currentTarget.parentNode.parentNode)
        .find('>.singleton.generation')

      $singleton
        .removeClass('editing adding')
        .trigger('unmarshal', $singleton.data())
    })

    .on('unmarshal', `>${gen}`, (e, data) => {
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
        .join(' & ') || 'None')
    })
})()