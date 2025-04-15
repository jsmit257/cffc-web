(_ => {
  let ws = '.main>.workspace.generation'
  let table = `${ws}>.table.generation`
  let ndx = `${table}>.rows.ndx`
  let ndxrow = `${ndx}>.row.record`
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

      $(`body>${table}>[x-child]`).trigger('add-child')

      //       $(e.currentTarget)
      //         .find('>.table.generation>.child-table.sources')
      //         .trigger('add-child')
      // 
      //       $(e.currentTarget)
      //         .find('>.table.generation>.child-table.events')
      //         .trigger('add-child')
    })
    .on('select', `>${ndxrow}`, e => {
      // .on('click', `>${ndxrow}:not(.selected)`, e => {
      e.stopPropagation()

      // console.log(`target`, e.target.parentNode.parentNode, 'current', e.currentTarget.parentNode.parentNode)
      // alert('pause')

      let id = $(e.currentTarget).data('id')

      $(`body>${srctable}`).attr({
        breadcrumb: `source/${id}`,
        'x-fetch': `generation/${id}/sources`,
      })

      let url = `${sessionStorage[sessionStorage.menu]}/${id}`
      fetch(url).then(async resp => {
        if (resp.status !== 200) throw {
          status: resp.status,
          msg: await resp.text()
        }

        $(`body>${events}`).parent().attr('breadcrumb', `${url}/events`)

        $(e.currentTarget.parentNode.parentNode).removeClass('seeking')

        return await resp.json()
      }).then(json => {
        $(`body>${gen}`).data(json).trigger('unmarshal', json)
      }).catch(ex => $(e.currentTarget).notify('error',
        `GET ${url} statusCode: ${ex.status ?? 'unsent'}`,
        ex,
      ))
    })
    .on('click', `>${ndxrow}.selected`, e => {
      e.stopPropagation()

      if ($(e.currentTarget)
        .parents('.table.generation')
        .first()
        // // FIXME: include noting in this test
        // .attr('class')
        // .match(/\b(editing|noting)\b/)
        .hasClass('editing')) {
        return
      }

      $(e.currentTarget.parentNode.parentNode).toggleClass('seeking')
    })
    .on('click', `>${table}>.buttonbar>.strain`, e => {
      e.stopPropagation()

      $('body>.menubar').trigger('restore', [
        'main',
        'strain',
        $(e.currentTarget).attr('strain-id'),
      ])
    })
    .on('unmarshal', `>${gen}`, (e, data) => {
      // there are two unmarshals b/c all the current event consumers share
      // this block, but it's not trivial to pull them up into an abstract 
      // handler w/o more markup
      e.stopPropagation()

      $(`body>${eventrows}`).remove()

      if (!$(`body>${events}`)
        .trigger('send', data.events ?? [])
        .selected($(e.currentTarget).breadcrumb())
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
      }).then(json => $(`body>${progeny}`)
        .attr('curr', json?.id)
        .val(json?.id)
        .parents('.table.generation')  // buttonbar().find('>.strain')
        .first()
        .find('>.buttonbar>.strain')
        .attr('strain-id', json?.id)
      ).catch(ex => $(e.currentTarget).notify('error',
        `GET ${url} statusCode: ${ex.status ?? 'unsent'}`,
        ex,
      ))

      $(`body>${srcrows}`).remove()

      $(`body>${srctable}>.rows`)
        .send(data.sources)
        .find('.row:not(.x-template) input, .row:not(.x-template) select')
        .trigger('change')
    })
    .on('marshal', `>${ndxrow}`, (e, data) => {
      e.stopPropagation()

      $(`body>${gen}`).trigger('marshal', data)
    })
    .on('new-record', `>${ndx}`, e => {
      e.stopPropagation()

      $(`body>${gen}`).trigger('clear')
    })
    .on('enable-record', `>${ndxrow}`, e => {
      e.stopPropagation()

      $(`body>${gen}`).trigger('enable-record')
    })
    .on('disable-record', `>${ndx}`, e => {
      e.stopPropagation()

      let $singleton = $(`body>${gen}`)
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
          .catch(ex => $prog.notify('error',
            `DELETE ${url} statusCode: ${ex.status ?? 'unsent'}`,
            ex,
          ))
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
        .catch(ex => $prog.notify('error',
          `PATCH ${url} statusCode ${ex.status ?? 'unsent'}`,
          ex,
        ))
    })

    // called from tablejs's render-record: div.trigger(format, v) when render=sources
    .on('sources', `>${ndxrow}>.sources`, (e, ...sources) => {
      e.stopPropagation()

      $(e.currentTarget).text($(sources)
        .map((_, v) => v.strain.name)
        .get()
        .join(' & ') || 'None')
    })
})()
