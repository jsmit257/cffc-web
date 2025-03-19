$(_ => {
  let record = '.table>.rows>.row.record, .table>.singleton'

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
    .on('fetch', '.table[x-fetch]', (e, resolve = _ => _) => {
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
        .then(resp => resolve($(e.currentTarget)
          .find(e.currentTarget.attributes['x-target'].value)
          .trigger('clear')
          .trigger('send', resp)))
        .catch(ex => $(e.currentTarget)
          .alert('error', `GET '${url}' statusCode: ${ex.status}`, ex.message ?? ex))
    })
    .on('fetch-multi', '.table>.rows>.row.record, .table>.singleton', (e, url) => {
      fetch(url).then(async resp => {
        if (resp.status !== 200) throw {
          status: resp.status,
          message: await resp.text(),
        }
        $(e.currentTarget)
          .find(`[x-fetch-multi="${url}"]`)
          .send(await resp.json())
      }).catch(ex => $(e.currentTarget)
        .alert('error', `GET ${url} statusCode: ${ex.status}`, ex.message ?? ex))
    })
    .on('send', '.table>.rows', (e, ...data) => {
      e.stopPropagation()

      let $tmpl = $(e.currentTarget).find('.row.x-template')

      data.forEach(record => $tmpl
        .clone(true, true)
        .toggleClass('x-template record')
        .data(record)
        .insertBefore($tmpl)
        .trigger('unmarshal', record))

      $(e.currentTarget).selected(localStorage[$(e.currentTarget).parents('[breadcrumb]').first().attr('breadcrumb')])
    })
    .on('unmarshal', record, (e, data) => {
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
    .on('marshal', record, (e, data) => {
      e.stopPropagation()

      data.id = e.currentTarget.id

      $(e.target)
        .find('>label>input[name], >label>select[name].static')
        .each((_, v) => data[v.name] = v.value)

      $(e.target)
        .find('>label>select[name]:not(.static)>option:selected')
        .each((_, v) => data[v.parentNode.name] = $(v).data())
    })

    // initialize other lists
    .on('fetch', 'datalist[x-fetch], select[x-fetch]', e => {
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
        .then(json => $(e.currentTarget).trigger('send', json))
        .catch(ex => $(e.currentTarget)
          .alert('error', `GET ${url} statusCode: ${ex.status}`, ex.message ?? ex))
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

      let val = e.currentTarget.value

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

      e.currentTarget.value = val
    })
    .on('send', 'input[type="radio"]', (e, opt) => $(e.currentTarget)
      .prop('checked', e.currentTarget.value === opt))

    // update actions
    .on('remove-record', '.table>.rows>.row.selected', e => {
      if ($(e.currentTarget).prev('.row.record').click().length === 0) {
        $(e.currentTarget).next('.row.record').click()
      }
      $(e.currentTarget).remove()
    })
    .on('new-record', '.table>.rows', (e, success = _ => _) => {
      e.stopPropagation()

      $(e.currentTarget.parentNode)
        .addClass('adding')
        .find('.selected')
        .removeClass('selected')

      success($(e.currentTarget)
        .find('>.row.x-template')
        .clone(true, true)
        .toggleClass('x-template record selected adding')
        .prependTo(e.currentTarget)
        .trigger('enable-record'))
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
        .filter((v, i, a) => v && a.lastIndexOf(v) <= i)
        .forEach(url => $row.trigger('fetch-multi', url))

      $row.find('input:not([type="radio"]), select')
        .val('')
        .first()
        .focus()
    })
    .on('disable-record', '.table.editing', e => {
      e.stopPropagation()

      let $row = $(e.currentTarget)
        .removeClass('editing adding')
        .find('>.rows>.row.editing, >.singleton.editing')
        .removeClass('editing adding')

      $row.trigger('unmarshal', $row.data())
    })
    .on('default-update', '.table>.rows>.row.editing, .table>.singleton.editing', (e, url, params) => {
      e.stopPropagation()

      let $table = $(e.currentTarget)
        .parents('.editing')
        .first()

      fetch(url, {
        ...params,
        body: JSON.stringify(params.body),
      }).then(async resp => {
        switch (resp.status) {
          case 200:
          case 201:
            $(e.currentTarget).data(await resp.json())
            break
          case 204:
            $(e.currentTarget).data({
              ...$(e.currentTarget).data(),
              ...params.body
            })
            break
          default: throw {
            status: resp.status,
            message: await resp.text(),
          }
        }
      }).catch(ex => $(e.currentTarget).alert('error',
        `${params.method} ${url} statusCode: ${ex.status || 'unsent'}`,
        ex.message ?? ex,
        params)
      ).finally(_ => { $table.trigger('disable-record') })
    })
    .on('default-remove', '.table>.rows>.row.record.selected', (e, url) => {
      e.stopPropagation()

      fetch(url, { method: 'DELETE' })
        .then(async resp => {
          switch (resp.status) {
            case 200:
            case 204:
              // TODO: don't be so hasty to remove it
              $(e.currentTarget).trigger('remove-record')
              break
            default: throw {
              status: resp.status,
              message: await resp.text(),
            }
          }
        })
        .catch(ex => $('.alert').trigger('app-error', [
          'error',
          `DELETE ${url} statusCode: ${ex.status || 'unsent'}`,
          ex.message ?? ex,
        ]))
    })

    // UI actions
    .on('select', '.table:not(.editing, .adding)>.rows>.row.record:not(.managed)', e => {
      e.stopPropagation()

      $(e.currentTarget.parentNode)
        .find('>.selected')
        .removeClass('selected')
      // $(e.currentTarget).selected().removeClass('selected')

      $(e.currentTarget).addClass('selected')

      // TODO: events from one of generations and lifecycles will clobber the
      // other one's history console.log(new Error())
      localStorage[$(e.currentTarget).parents('[breadcrumb]').first().attr('breadcrumb')] = e.currentTarget.id
    })
    .on('click', '.table>.rows>.row.record:not(.selected)', e => $(e.currentTarget).trigger('select'))
    .on('sort', '.table', (e, keys) => { })
})