$(_ => {
  $(document.body)
    // initialize tables
    .on('clear', '.table .rows', e => {
      e.stopPropagation()

      $(e.currentTarget)
        .find('>.row.record')
        .remove()
    })
    .on('clear', 'select[x-fetch], select[x-fetch-multi]', e => {
      e.stopPropagation()

      $(e.currentTarget)
        .find('>option:not(.permanent)')
        .remove()
    })
    .on('clear', '.singleton', e => {
      e.stopPropagation()

      $(e.currentTarget).removeData().find('>.field>input, >.field>select')
        .val('')
      $(e.currentTarget).removeData().find('.per-kilo, .dry-weight, div[name]')
        .text('')
    })
    .on('fetch', '.table[x-fetch], select[x-fetch]', (e, resolve = _ => _) => {
      e.stopPropagation()

      let url = e.currentTarget.attributes['x-fetch'].value
      fetch(url)
        .then(async resp => {
          if (resp.status !== 200) throw {
            status: resp.status,
            message: await resp.text(),
          }
          return resp.json()
        })
        .then(resp => {
          let $target = $(e.currentTarget)
          if ($target.get(0).nodeName !== 'SELECT') {
            $target = $target
              .find(e.currentTarget.attributes['x-target'].value)
          }

          $target.trigger('clear')
          resolve($target.trigger('send', resp))
        })
        .catch(ex => $('.alert').trigger('app-error', [
          'error',
          `fetching table data: '${url}' statusCode: ${ex.status}`,
          ex.message ?? ex,
        ]))
    })
    .on('fetch-multi', '.table .rows>.row, .table .singleton', (e, url) => {
      fetch(url).then(async resp => {
        if (resp.status !== 200) throw {
          status: resp.status,
          message: await resp.text(),
        }
        $(e.currentTarget)
          .find(`[x-fetch-multi="${url}"]`)
          .send(await resp.json())
      }).catch(ex => $('.alert').trigger('app-error', [
        'error',
        `GET ${url} statusCode: ${ex.status}`,
        ex.message ?? ex,
      ]))
    })
    .on('send', '.table .rows', (e, ...data) => {
      e.stopPropagation()

      let $tmpl = $(e.currentTarget).find('.row.x-template')

      data.forEach(record => $tmpl
        .clone(true, true)
        .toggleClass('x-template record')
        .data(record)
        .insertBefore($tmpl)
        .trigger('render-record', record))
    })
    .on('render-record', '.table>.rows>.row.record, .singleton', (e, data) => {
      let $row = $(e.currentTarget).attr({
        id: data.id,
        dtime: data.dtime,
      })


      Object.keys(data).forEach(k => {
        let v = data[k]
        let $fld = $row.find(`>.field>[name="${k}"], >[name="${k}"]`)

        switch (($fld.get(0) || { nodeName: 'x-none' }).nodeName.toLowerCase()) {
          case 'select':
            $fld.trigger('send', [v])
            if (v.id) {
              v = v.id
            }
            break
          case 'button':
            break
          case 'div':
            $fld.trigger("format", [v])
            return
          case 'x-none':
            // console.log('x-none', k, 'value', v)
            break
          default:
          // console.log('default', nodeName, 'key', k, 'value', v)
        }

        $fld.val(v)
      })

      $row.find('input, select').trigger('change')
    })


    // initialize other lists
    .on('fetch', 'datalist[x-fetch], select[x-fetch]', e => {
      e.stopPropagation()

      fetch(e.currentTarget.attributes['x-fetch'].value)
        .then(async resp => {
          $(e.currentTarget).trigger('send', await resp.json())
        })
        .catch(ex => $('').trigger('alert'))
    })
    .on('send', 'datalist', (e, ...data) => {
      e.stopPropagation()

      $(e.currentTarget).empty()

      data.forEach(name => $('<option>')
        .val(name)
        .appendTo(e.currentTarget))
    })
    .on('send', 'select', e => // so static lists don't bubble up
      e.stopPropagation())
    .on('send', 'select[x-fetch], select[x-fetch-multi]', (e, ...data) => {
      e.stopPropagation()

      $(e.currentTarget).trigger('clear')

      data.forEach(record => $('<option>')
        .data(record)
        .val(record.id)
        .attr({
          id: record.id,
          dtime: record.dtime,
        })
        .appendTo(e.currentTarget)
        .trigger('extend', record))
    })
    .on('send', 'input[type="radio"]', (e, opt) => $(e.currentTarget)
      .prop('checked', e.currentTarget.value === opt))


    // update actions
    .on('remove-record', '.table .rows>.row.selected', e => {
      if ($(e.currentTarget).prev('.row.record').click().length === 0) {
        $(e.currentTarget).next('.row.record').click()
      }
      $(e.currentTarget).remove()
    })
    .on('new-row', '.table>.rows', e => {
      e.stopPropagation()

      localStorage.lastid = $(e.currentTarget)
        .find('>.row.selected')
        .removeClass('selected')
        .attr('id')

      $(e.currentTarget.parentNode).addClass('adding')

      $(e.currentTarget)
        .find('>.row.x-template')
        .clone(true, true)
        .toggleClass('x-template record selected adding')
        .prependTo(e.currentTarget)
        .trigger('enable-record')
    })
    .on('enable-record', '.table>.rows>.selected, .table>.singleton', e => {
      e.stopPropagation()

      let $row = $(e.currentTarget).addClass('editing')

      $row.parents('.table').first().addClass('editing')

      $row.find('[x-fetch]').trigger('fetch')

      $row.find('[x-fetch-multi]')
        .map((_, v) => v.attributes['x-fetch-multi'].value)
        .sort()
        .get()
        .filter((v, i, a) => a.lastIndexOf(v) <= i)
        .forEach(url => $row.trigger('fetch-multi', url))

      $row.find('input, select')
        .first()
        .focus()
    })
    .on('end-edit', '.table.editing', (e, data) => {
      e.stopPropagation()

      $(e.currentTarget)
        .removeClass('editing adding')
        .find('.row.editing')
        .removeClass('editing adding')
        .trigger('render-record', data)
    })
    .on('default-update', '.table>.rows>.row.editing', (e, url, params) => {
      e.stopPropagation()

      fetch(url, params).then(async resp => {
        switch (resp.status) {
          case 200:
          case 201:
            $(e.currentTarget).trigger('end-edit', await resp.json())
          case 204:
            break
          default: throw {
            status: resp.status,
            message: await resp.text(),
          }
        }
      }).catch(ex => {
        $(e.currentTarget).trigger('end-edit', $(e.currentTarget).data())

        $('.alert').trigger('app-error', [
          'error',
          `POST ${url} statusCode: ${ex.status || 'unsent'}`,
          ex.message ?? ex,
          params,
        ])
      }).finally(_ => $(e.currentTarget).trigger('disable-row'))
    })
    .on('default-remove', '.table .rows>.row.record.selected', (e, url) => {
      e.stopPropagation()

      fetch(url, { method: 'DELETE' })
        .then(async resp => {
          if (resp.status !== 204) throw {
            status: resp.status,
            message: await resp.text(),
          }
          $(e.currentTarget).trigger('remove-record')
        })
        .catch(ex => $('.alert').trigger('app-error', [
          'error',
          `DELETE ${url} statusCode: ${ex.status || 'unsent'}`,
          ex.message ?? ex,
        ]))
    })
    .on('marshal', '.row, .singleton', (e, data) => {
      e.stopPropagation()

      $(e.target)
        .find('>label>input[name], >label>select[name].static')
        .each((_, v) => data[v.name] = v.value)

      $(e.target)
        .find('>label>select[name]:not(.static)>option:selected')
        .each((_, v) => data[v.parentNode.name] = $(v).data())
    })


    // UI actions
    .on('select', '.table:not(.editing, .adding) .row.record:not(.managed)', e => {
      e.stopPropagation()

      $(e.currentTarget.parentNode)
        .find('>.selected')
        .removeClass('selected')

      $(e.currentTarget).addClass('selected')

      // TODO: events from one of generations and lifecycles will clobber the
      // other one's history console.log(new Error())
      localStorage[$(e.currentTarget).parents('[breadcrumb]').first().attr('breadcrumb')] = e.currentTarget.id
    })
    .on('click', '.row.record:not(.selected)', e => $(e.currentTarget)
      .trigger('select'))
    .on('sort', '.table', e => { })
})