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
        $(`body>${gen}`).data(json).trigger('unmarshal', json)
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
        .trigger('unmarshal', {
          id: 'newrow',
          ctime: new Date().toISOString(),
        })

      $(`body>${gen}`).trigger('clear').trigger('enable-record')
    })
    .on('click', `>${table}:not(.editing)>.buttonbar>.update`, e => {
      e.stopPropagation()

      $(`body>${gen}`).trigger('enable-record')
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

      // console.log(".trigger('default-update", `generation/${params.body.id}`, params)
    })
    .on('click', `>${table}.editing>.buttonbar>.cancel`, e => {
      e.stopPropagation()

      let $singleton = $(e.currentTarget.parentNode.parentNode)
        .find('>.singleton.generation')

      $singleton
        .removeClass('editing adding')
        .trigger('unmarshal', $singleton.data())
    })
    .on('change', `>${progeny}`, e => {
      e.stopPropagation()

      // console.log('value', `'${e.currentTarget.value}'`, new Error('stack trace'))
      let $prog = $(e.currentTarget)

      let curr = $prog.attr('curr')
      if (curr !== '#') {
        let url = `strain/${curr}/generation`
        fetch(url, { method: "DELETE" })
          .then(async resp => {
            if (resp.status !== 204) throw {
              status: resp.status,
              message: await resp.text()
            }
            return 'success'
          })
          .then(_ => $prog.removeAttr('curr')
            .find(`option[value=${curr}][disabled]`)
            .attr('disabled', false)
            // XXX: not sold on this gid thing
            .removeAttr('gid'))
          .catch(ex => console.log('this one?', ex))
      }

      let $row = $(e.currentTarget.parentNode.parentNode)
      let val = $prog.val()
      if (val === $prog.children().first().val()) {
        $row.removeClass('link')
        return
      }

      let url = `strain/${val}/generation/${$row.attr('id')}`
      fetch(url, { method: 'PATCH' })
        .then(async resp => {
          if (resp.status !== 204) throw {
            status: resp.status,
            message: await resp.text(),
          }
          return val
        })
        .then(curr => {
          $prog.attr('curr', curr)
            .find(`option[value=${val}]`)
            .attr({
              disabled: true,
              gid: $row.attr('id'),
            })
          $row.addClass('link')
        })
        .catch(ex => console.log('this other one?', ex))
    })

    .on('clear', `>${ndx}`, e => $(`body>${gen}`).trigger('clear'))
    .on('unmarshal', `>${gen}`, (e, data) => {
      // there are two unmarshals b/c all the current event consumers share
      // this block as well as `click` on ndx:not(selected), but it's not
      // trivial to pull them up into an abstract handler w/o more markup
      e.stopPropagation()

      $(`body>${eventrows}`).remove()

      if (!$(`body>${events}`).trigger('send', data.events ?? [])
        .selected(localStorage[$(e.currentTarget)
          .parents('[x-target]')
          .first()
          .attr('breadcrumb')])
        .length
      ) {
        $(`body>${eventrows}:first-child`).click()
      }
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
        $(`body>${progeny}`).attr('curr', json?.id).val(json?.id)
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