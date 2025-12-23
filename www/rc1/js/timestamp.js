$(_ => {
  const ts = 'body.ts-editing>.timestamp'
  const title = `${ts}>.title`
  const toggle = `${title}>.toggle>.relative`
  const include = `${ts}>.includes>label>.include`
  const form = `${ts}>.form`
  const update = `${form}>.relative`
  const refdate = `${ts}>.absolute>input`
  const btn = `${ts}>.buttons>.button`
  const editable = '.contexting [ts-edit] [id]:not(.adding)'
  // so far, we don't display dtime, so trigger on mtime and 
  // include dtime with the update
  const stamps = `${editable} .mtime, ${editable} .ctime`

  $(document)
    // open the editor
    .on('click', stamps, e => {
      e.stopPropagation()

      if ($(document.body).hasClass('ts-editing')) {
        // warn and bail?
        $(e.currentTarget).notify('warn', 'editing timestamp', 'editor already open')
        return
        // or replace old data with the new one and continue?
      }

      $(document.body).addClass('ts-editing')

      const $fld = $(e.currentTarget)
      const $ts = $(ts)
      const data = {
        $fld,
        val: $fld.data('src-date'),
        table: $fld.parents('[ts-edit]').first().attr('ts-edit'),
        key: $fld.parents('[id]').first().attr('id'),
      }
      $ts
        .data(data)
        .css($fld.get(0)
          .getBoundingClientRect()
          .timestampCSS($ts.get(0).getBoundingClientRect()))

      $(`${title}>.tablename`).text(data.table)
      $(toggle).prop('checked', true).trigger('change')
      $(include).each((_, fld) => $(fld).prop('checked', fld.name === $fld.attr('name')))
      $(form).trigger('reset')
      $(refdate).val(data.val.localVal())
    })

    // actions
    .on('close', ts, e => {
      e.stopPropagation()

      const $fld = $(e.currentTarget).data('$fld')

      $(e.currentTarget).removeData()

      $fld
        .parents('.row.editing, .singleton.editing')
        .first()
        .removeClass('editing')
        .parents('.table.editing')
        .first()
        .removeClass('editing')

      $(document.body).removeClass('ts-editing')
    })
    .on('update', ts, e => {
      e.stopPropagation()

      let $edit = $(e.currentTarget)
      let data = $edit.data()
      let url = `/ts/${data.table}/${data.key}`
      let $included = $(`${include}:checked`).toArray()
      let params = {
        method: 'PATCH',
        body: JSON.stringify({
          fields: $included.map(val => val.name),
          factors: $(update).toArray()
            .filter(row => ~~$(row).find('>label>input').val())
            .map(row => Object.fromEntries([
              ['delta', $(row).find('>label>input').val()],
              ['interval', $(row).find('>label>select').val()],
            ])),
          utc: new Date($edit.find('>.absolute>input').val()).toISOString(),
        }),
      }
      console.log('url', url, 'params', params)
      fetch(url, params).then(async resp => {
        if (resp.status !== 204) throw {
          status: resp.status,
          message: await resp.text()
        }
        // service should return something we can use to update;
        return new Date().toISOString() // BOGUS VALUE! need to modify the endpoint
      }).then(json => data.$fld.parents('[id]').first()
        .find($included
          .map(v => `label>.${v.name}`)
          .join(','))
        .trigger('format', json)
      ).catch(ex => $(e.currentTarget).notify('error',
        `PATCH ${url} statusCode: ${ex.status ?? 'unsent'}`,
        ex,
      )).finally(_ => $(e.currentTarget).trigger('close'))
    })
    .on('add-row', `${update}.x-template`, e => {
      e.stopPropagation()

      $(e.currentTarget)
        .clone(true, true)
        .toggleClass('x-template active')
        .insertBefore(e.currentTarget)
    })
    .on('reset', ts, e => {
      $(`${update}.active`).remove()
      $(`${update}.x-template`).trigger('add-row')
      $(refdate).val($(ts).data('val').localVal())
    })

    // controls
    .on('change', toggle, e => {
      e.stopPropagation()

      $(ts).toggleClass('relative absolute')
    })
    .on('click', `${btn}.cancel`, e => {
      e.stopPropagation()

      $(e.currentTarget.parentNode.parentNode).trigger('close')
    })
    .on('click', `${btn}.update`, e => {
      e.stopPropagation()

      $(e.currentTarget.parentNode.parentNode).trigger('update')
    })
    .on('click', `${btn}.reset`, e => {
      e.stopPropagation()

      $(e.currentTarget.parentNode.parentNode).trigger('reset')
    })
    .on('click', `${btn}.undel`, e => {
      let url = `/undel/${$(e.delegateTarget).data('urlParams')}`
      fetch(url, { method: 'DELETE' }).then(async resp => {
        if (resp.status !== 204) throw {
          status: resp.status,
          ex: await resp.text()
        }
        $(e.currentTarget.parentNode.parentNode).trigger('close')
      }).catch(ex => $(e.currentTarget).notify('error',
        `DELETE ${url} statusCode: ${ex.status ?? 'unsent'}`,
        ex,
      ))
    })
    .on('click', `${update}.active>.delete`, e => {
      e.stopPropagation()

      $(e.currentTarget.parentNode).remove()
    })
    .on('click', `${ts}>.add`, e => {
      e.stopPropagation()

      // $(`${update}.x-template`).trigger('add-row')
      $(e.currentTarget.parentNode)
        .find('>.form>.x-template')
        .trigger('add-row')
    })
})
