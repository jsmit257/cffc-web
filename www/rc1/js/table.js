$(_ => {
  let record = '.table>.rows>.row.record, .table>.singleton'

  $(document.body)
    // initialize tables
    .on('clear', '.table>.rows', e => {
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

      $(e.currentTarget)
        .removeData()
        .removeAttr('id')
        .find('>.field>input, >.field>select')
        .val('')

      $(e.currentTarget).find('div[name]').text('')
    })
    .on('fetch', '.table[x-fetch]', (e, resolve = _ => _) => {
      e.stopPropagation()

      $(e.currentTarget)
        .removeClass('editing adding')
        .find('>.columns>[sort-order]')
        .removeAttr('sort-order')

      let url = e.currentTarget.attributes['x-fetch'].value
      fetch(url).then(async resp => {
        if (resp.status !== 200) throw {
          status: resp.status,
          message: await resp.text(),
        }
        return resp.json()
      }).then((resp = []) => resolve($(e.currentTarget)
        .find(e.currentTarget.attributes['x-target'].value)
        .trigger('clear')
        .trigger('send', resp))
      ).catch(ex => $(e.currentTarget).notify('error',
        `GET ${url} statusCode: ${ex.status ?? 'unsent'}`,
        ex))
    })
    .on('fetch-multi', '.table>.rows>.row.record, .table>.singleton', (e, url) => {
      e.stopPropagation()

      fetch(url).then(async resp => {
        if (resp.status !== 200) throw {
          status: resp.status,
          message: await resp.text(),
        }
        $(e.currentTarget)
          .find(`[x-fetch-multi="${url}"]`)
          .send(await resp.json())
      }).catch(ex => $(e.currentTarget).notify('error',
        `GET ${url} statusCode: ${ex.status ?? 'unsent'}`,
        ex,
      ))
    })
    .on('send', '.table>.rows', (e, ...data) => {
      e.stopPropagation()

      let $tmpl = $(e.currentTarget).find('>.row.x-template')

      data.forEach(record => $tmpl
        // TODO: if id!==null && exists(id) then update
        .clone(true, true)
        .toggleClass('x-template record')
        .data(record)
        .insertBefore($tmpl)
        .trigger('unmarshal', record))

      try {
        $(e.currentTarget).selected($(e.currentTarget).breadcrumb())
      } catch (ex) {
        throw new Error('failed to set selected', { cause: ex })
      }
    })
    .on('unmarshal', record, (e, data) => {
      let $row = $(e.currentTarget).attr({
        id: data.id,
        dtime: data.dtime,
      })

      // FIXME: zero everything with a name

      Object.entries(data).forEach(([k, v]) => {
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

      $row.find('input:not(.no-change), select:not(.no-change)').trigger('change')
    })
    .on('marshal', record, (e, data) => {
      e.stopPropagation()

      data.id = e.currentTarget.id

      $(e.target)
        .find('>label>input[name], >label>select[name].static, >label>textarea')
        .each((_, v) => data[v.name] = $(v).val())

      $(e.target)
        .find('>label>select[name]:not(.static)>option:selected')
        .each((_, v) => data[v.parentNode.name] = $(v).data())

      // TODO: check for missing required fields; currently it needs
      //  the server to fail
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
        .catch(ex => $(e.currentTarget).notify('error',
          `GET ${url} statusCode: ${ex.status ?? 'unsent'}`,
          ex))
    })
    .on('send', 'datalist', (e, ...data) => {
      e.stopPropagation()

      $(e.currentTarget).empty()

      data.forEach(name => $('<option>')
        .val(name)
        .appendTo(e.currentTarget))
    })
    .on('send', 'select', e => e.stopPropagation()) // so static lists don't bubble up
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
    .on('private-remove-record', '.table>.rows>.row.selected', e => {
      e.stopPropagation()

      let $row = $(e.currentTarget)

      $row.selected($row.breadcrumb())
      $row.remove()
    })
    .on('remove-record', '.table:not(.soft-delete)>.rows>.row.selected', e => {
      e.stopPropagation()

      $(e.currentTarget).trigger('private-remove-record')
    })
    .on('remove-record', '.table.soft-delete>.rows>.row.selected', (e, data) => {
      e.stopPropagation()

      let $row = $(e.currentTarget)
      if (!$row.data('id')) {
        $row.trigger('private-remove-record')
      } else {
        $row.attr('dtime', (data?.dtime ?? new Date()).toISOString())
      }
    })
    .on('new-record', '.table>.rows', (e, success = _ => _) => {
      e.stopPropagation()

      $(e.currentTarget.parentNode)
        .addClass('adding')
        .find('.selected')
        .removeClass('selected')

      let $newrow = $(e.currentTarget)
        .find('>.row.x-template')
        .clone(true, true)
        .toggleClass('x-template record selected adding')
        .prependTo(e.currentTarget)
        .trigger('enable-record')

      $newrow.find('input:not([type="radio"]), select').val('')

      success($newrow)
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
        .first()
        .focus()
    })
    .on('disable-record', '.table.editing', e => {
      e.stopPropagation()

      let $row = $(e.currentTarget)
        .removeClass('editing adding') // XXX: adding is superfluous here?
        .find('>.rows>.row.editing, >.singleton.editing')
        .removeClass('editing adding')

      $row.trigger('unmarshal', $row.data())
    })
    .on('default-update', '.table>.rows>.row.editing, .table>.singleton.editing', (e, url, params) => {
      e.stopPropagation()

      let $table = $(e.currentTarget)
        .parents('.editing')
        .first()

      fetch(url, { ...params, body: JSON.stringify(params.body) })
        .then(async resp => {
          switch (resp.status) {
            case 200:
            case 201: return await resp.json()
            case 204: return {
              ...$(e.currentTarget).data(),
              ...params.body
            }
            default: throw {
              status: resp.status,
              message: await resp.text(),
            }
          }
        })
        .then(json => json.id ? json : json?.at(0))
        .then(json => $(e.currentTarget).data(json).breadcrumb(json.id ?? 'quux'))
        // might be nice to re-sort and scroll-to as needed
        .catch(ex => $(e.currentTarget).notify('error',
          `${params.method} ${url} statusCode: ${ex.status ?? 'unsent'}`,
          ex,
          params)
        )
        .finally(_ => { $table.trigger('disable-record') })
    })
    .on('default-remove', '.table>.rows>.row.record.selected', (e, url) => {
      e.stopPropagation()

      let json
      fetch(url, { method: 'DELETE' })
        .then(async resp => {
          switch (resp.status) {
            case 200: json = await resp.json()
            case 204:
              $(e.currentTarget).trigger('remove-record', json)
              break
            default: throw {
              status: resp.status,
              message: await resp.text(),
            }
          }
        })
        .catch(ex => $(e.currentTarget).notify('error',
          `DELETE ${url} statusCode: ${ex.status ?? 'unsent'}`,
          ex,
        ))
    })

    // UI actions
    .on('select', '.table:not(.editing, .adding)>.rows>.row.record:not(.managed)', e => {
      e.stopPropagation()

      // $(e.currentTarget.parentNode)
      //   .find('>.selected')
      //   .removeClass('selected')

      $(e.currentTarget)
        .addClass('selected')
        .breadcrumb(e.currentTarget.id || 'foobar')
        .siblings('.selected')
        .removeClass('selected')

      // sessionStorage[$(e.currentTarget)
      //   .parents('[breadcrumb]')
      //   .first()
      //   .attr('breadcrumb')] = e.currentTarget.id || 'foobar'
    })
    .on('click', '.table>.rows>.row.record:not(.selected)', e => {
      e.stopPropagation()

      $(e.currentTarget).trigger('select')
    })
    .on('dblclick', record, e => {
      e.stopPropagation()

      $(e.currentTarget)
        .buttonbar()
        .find('>.update')
        .click()
    })

    // sort controls
    .on('click', '.column[sort-key]', e => {
      e.stopPropagation()

      let $col = $(e.currentTarget)
      let $cols = $(e.currentTarget.parentNode)
      let key = $col.attr('sort-key')

      $cols.data('sort-keys', ($cols.data('sort-keys') ?? [])
        .filter(v => v !== key))
        .data('sort-keys')
        .unshift(key)

      $col.attr('sort-order', ($col.attr('sort-order') ?? -1) * -1)
        .parents('.table')
        .first()
        .trigger('sort', $cols.data('sort-keys'))
    })
    .on('sort', '.table[x-target]', (e, ...keys) => {
      e.stopPropagation()

      let $rows = $(e.currentTarget).find($(e.currentTarget).attr('x-target'))

      $rows.prepend(
        $rows.find(`>.row.record`).sort((a, b) => keys.reduce((edge, key) => {
          let order = $(e.currentTarget)
            .find(`>.columns>.column[sort-key="${key}"]`)
            .attr('sort-order') ?? 1
          let [aval, bval] = [a, b].map(row => $(row)
            .find(`[name=${key}]`)
            .sortVal()
            // postgres collation is case-insensitive, but not sure we want that
            /*.toLowerCase()*/)

          return edge || order * (aval < bval ? -1 : aval > bval ? 1 : 0)
        }, 0))
      )
    })
})