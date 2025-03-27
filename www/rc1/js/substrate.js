(_ => {
  let ws = '.main>.workspace.substrate'
  let table = `${ws}>.table.substrate`
  let sub = `${table}>.rows`
  let subrows = `${sub}>.row.record`
  let child = `${table}>.workspace.ingredients>.table.ingredient`
  let ing = `${child}>.rows`
  let ingrows = `${ing}>.row.record`

  let selecting = `.substrate .table.ingredient.selecting>.rows>.record`

  $(document.body)
    .on('activate', `>${ws}`, e => {
      e.stopPropagation()

      $(e.currentTarget) // create a modified ingredients
        .find('>.table.substrate>.ingredients')
        .trigger('add-child', $ingredients => {
          $ingredients
            .find('>.rows>.row.x-template')
            .addClass('managed')

          $ingredients.trigger('fetch', $ing => $(`body>${table}`)
            .selected()
            .data('ingredients')
            // ?.forEach(v => $(`body>${ingrows}#${v.id}`).addClass('selected'))
            ?.forEach(v => $ing.find(`>.row#${v.id}`).addClass('selected')))
        })
        .find('>.table.ingredient')
        .trigger('fetch') // XXX: why don't we need resolve here
    })
    .on('unmarshal', subrows, (e, data) => {
      e.stopPropagation()

      $(e.currentTarget).addClass(data.type)
    })
    .on('click', `>${subrows}:not(.selected)`, e => {
      // this probably shouldn't happen when `.editing`
      e.stopPropagation()

      // remove selecting from table before removing selected? ...
      $(`body>${child}`)
        .removeClass('selecting')
        .find('>.rows>.row.selected')
        .removeClass('selected')

      // ... or, leave the table selecting?
      // $(`body>${ingrows}.selected`).removeClass('selected')

      $(e.currentTarget).data('ingredients')?.forEach(v =>
        $(`body>${ingrows}#${v.id}`).addClass('selected'))
    })
    .on('click', `${selecting}:not(.selected)`, e => {
      e.stopPropagation()

      $(e.currentTarget).trigger('update-children', [
        `substrate/${$(`body>${subrows}.selected`).attr('id')}/ingredients`,
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
        `substrate/${$(`body>${subrows}.selected`).attr('id')}/ingredients/${e.currentTarget.id}`,
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
        $(`body>${subrows}.selected`)
          .data('ingredients', json.ingredients)
      }).catch(ex => $('.alert').trigger('app-error', [
        'error',
        `${args.method}: '${url}' statusCode: ${ex.status}`,
        ex.message ?? ex,
      ]))
    })
    .on('click', `.substrate .table.ingredient>.buttonbar`, e =>
      $(e.currentTarget.parentNode).toggleClass('selecting'))
    .on('change', `${table}>.columns>.type>label>select`, e => {
      e.stopPropagation()

      $(e.currentTarget)
        .parents('.table.substrate')
        .first()
        .attr('type-filter', e.currentTarget.value)
    })
})()