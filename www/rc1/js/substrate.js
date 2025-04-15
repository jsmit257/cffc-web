(_ => {
  let ws = '.main>.workspace.substrate'
  let table = `${ws}>.table.substrate`
  let sub = `${table}>.rows`
  let subrow = `${sub}>.row.record`
  let child = `${table}>.workspace.ingredients>.table.ingredient`
  let ing = `${child}>.rows`
  let ingrows = `${ing}>.row.record`

  let selecting = `.substrate .table.ingredient.selecting>.rows>.record`

  $(document.body)
    .on('activate', `>${ws}`, e => {
      e.stopPropagation()

      $(`body>${child}`).trigger('activate')

      $(`body>${table}>[x-child]`).trigger('add-child', _ => {
        $(`body>${ing}>.x-template`).addClass('managed')
        // FIXME: outstanding sync issue, substrate has no rows yet; but 
        //  when select is called from rows::send, ingredients has no rows;
        //  what's the intersection when both tables are settled in
        $(`${sub}`).selected().data('ingredients')?.forEach(v => {
          $(`body>${ingrows}#${v.id}`).addClass('selected')
        })
      })
    })
    .on('unmarshal', subrow, (e, data) => {
      e.stopPropagation()

      $(e.currentTarget).addClass(data.type)
    })
    .on('select', `>${subrow}`, e => {
      e.stopPropagation()

      console.log('select substrate', $(`body>${ingrows}`).length)
      $(`body>${child}`)
        .removeClass('selecting')
        .find('>.rows>.row.selected')
        .removeClass('selected')

      $(e.currentTarget).data('ingredients')?.forEach(v => {
        $(`body>${ingrows}#${v.id}`).addClass('selected')
      })
    })
    .on('click', `${selecting}:not(.selected)`, e => {
      e.stopPropagation()

      $(e.currentTarget).trigger('update-children', [
        `substrate/${$(`body>${subrow}.selected`).attr('id')}/ingredients`,
        {
          method: 'POST',
          body: JSON.stringify($(e.currentTarget).data()),
        },
        201,
      ])
    })
    .on('click', `${selecting}.selected`, e => {
      e.stopPropagation()

      $(e.currentTarget).trigger('update-children', [
        `substrate/${$(`body>${subrow}.selected`).attr('id')}/ingredients/${e.currentTarget.id}`,
        { method: 'DELETE' },
        200,
      ])
    })
    .on('update-children', selecting, (e, url, args, ok = 201) => {
      e.stopPropagation()

      fetch(url, args).then(async resp => {
        if (resp.status !== ok) throw {
          status: resp.status,
          message: await resp.text(),
        }
        return await resp.json()
      }).then(json => {
        $(e.currentTarget)
          .toggleClass('selected')
        $(`body>${subrow}.selected`)
          .data('ingredients', json.ingredients)
      }).catch(ex => $(e.currentTarget).notify('error',
        `${args.method} '${url}' statusCode: ${ex.status ?? 'unsent'}`,
        ex,
      ))
    })
    .on('click', `${child}>.buttonbar`, e => {
      e.stopPropagation()

      $(e.currentTarget.parentNode).toggleClass('selecting')
    })
    .on('change', `${table}>.columns>.type>label>select`, e => {
      e.stopPropagation()

      $(e.currentTarget)
        .parents('.table.substrate')
        .first()
        .attr('type-filter', e.currentTarget.value)
    })
})()