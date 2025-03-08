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
    .on('fetch', '.table[x-fetch], select[x-fetch]', (e, id) => {
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
          $target
            .trigger('send', resp)
            .find(`#${id}`)
            .click()
        })
        .catch(ex => $('.alert').trigger('alert', [
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
    .on('new-row', '.table .rows', e => {
      e.stopPropagation()

      localStorage.lastid = $(e.currentTarget)
        .find('>.row.selected')
        .removeClass('selected')
        .attr('id')

      $(e.currentTarget)
        .find('>.row.x-template')
        .clone(true, true)
        .toggleClass('x-template record selected adding editing')
        .prependTo(e.currentTarget)
        .trigger('enable-row')
    })
    .on('enable-row', '.singleton', e => {
      e.stopPropagation()

      $(e.currentTarget).trigger('init-inputs', $(e.currentTarget))
    })
    .on('enable-row', '.table .rows', e => {
      e.stopPropagation()

      $(e.currentTarget).trigger('init-inputs', $(e.currentTarget)
        .find('>.row.selected')
        .addClass('editing'))
    })
    .on('init-inputs', '.table .rows, .singleton', (e, row) => {
      $(e.currentTarget).parents('.table').first().addClass('editing')

      let $row = $(row)

      $row.find('[x-fetch]').trigger('fetch')

      $row.find('[x-fetch-multi]')
        .map((_, v) => v.attributes['x-fetch-multi'].value)
        .sort()
        .get()
        .filter((v, i, a) => a.lastIndexOf(v) <= i)
        .forEach(url => $row.trigger('fetch-multi', url))
    })
    .on('disable-row', '.table.editing .rows', e => {
      e.stopPropagation()

      $(e.currentTarget)
        .parents('.editing')
        .first()
        .removeClass('adding editing')
    })
    .on('disable-row', '.table.adding .rows', e => {
      e.stopPropagation()

      // something about localStorage.lastid, but it seems dangerous
      // $(e.currentTarget).find(`#${???}`).trigger('select')

      $(e.currentTarget).find('>.row.selected').remove()
    })
    .on('disable-row', '.table.editing:not(.adding) .rows', e => {
      e.stopPropagation()

      let $row = $(e.currentTarget)
        .find('>.row.editing')
        .removeClass('adding editing')

      $row.trigger('render-record', $row.data())
    })
    .on('update-row', '.table .rows>.row.editing:not(.adding)', e => {
      e.stopPropagation()

      let $row = $(e.currentTarget)
        .find('>.row.selected')

      let url = `'foobar'`
      let data = { ...$row.data() }
      // 1/render-row

      $(e.currentTarget).trigger('private-update', [url, {
        method: 'POST',
        data,
      }])
    })
    .on('update-row', '.table .rows>.row.adding', e => {
      e.stopPropagation()

      let $row = $(e.currentTarget)
        .find('>.row.selected')

      let url = `selected ${$row.attr('id')}`
      let data = {}
      // 1/render-row

      $(e.currentTarget).trigger('private-update', [url, {
        method: 'POST',
        data,
      }])
    })
    .on('private-update', '.table .rows>.row.editing', (e, url, params) => {
      e.stopPropagation()

      let $row = $(e.currentTarget).find('>.row.selected')

      fetch(url, params).then(async resp => {
        switch (resp.status) {
          case 200:
            $row.data(data).trigger('update-response', await resp.json())
          case 204:
            // $(e.currentTarget).trigger('disable-row')
            break
          default:
            throw {
              status: resp.status,
              message: await resp.text(),
            }
        }
      }).catch(ex => $('.alert').trigger('app-error', [
        'error',
        `POST ${url} statusCode: ${ex.status || 'unsent'}`,
        ex.message ?? ex,
        params,
      ])).finally(_ => $(e.currentTarget).trigger('disable-row'))
    })
    .on('private-remove', '.table .rows>.row.record.selected', (e, url) => {
      e.stopPropagation()

      fetch(url, { method: 'DELETE' })
        .then(async resp => {
          if (resp.status !== 204) throw {
            status: resp.status,
            message: await resp.text(),
          }
        })
        .catch(ex => $('.alert').trigger('app-error', [
          'error',
          `DELETE ${url} statusCode: ${ex.status || 'unsent'}`,
          ex.message ?? ex,
        ]))
    })
    .on('marshal', (e, data) => {
      e.stopPropagation()

      $(e.target)
        .find('input[name], select[name]')
        .each((_, v) => data[v.name] = v.value)
    })


    // UI actions
    .on('select', '.row.record', e => {
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