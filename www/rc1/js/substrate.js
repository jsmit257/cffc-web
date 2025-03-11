(_ => {
  let ws = '.main>.workspace.substrate'
  let table = `${ws}>.table.substrate`
  let sub = `${table}>.rows`
  let subrows = `${sub}>.row.record`
  let child = `${table}>.workspace.ingredients>.table.ingredient`
  let ing = `${child}>.rows`
  let ingrows = `${ing}>.row.record`

  $(document.body)
    .on('activate', `>${ws}`, e => {
      e.stopPropagation()

      $(e.currentTarget) // create a modified ingredients
        .find('>.table.substrate>.ingredients')
        .trigger('add-child', $ingredients => {
          $ingredients
            .find('>.rows>.row.x-template')
            .addClass('managed')
          $ingredients.trigger('fetch')
        })
        .find('>.table.ingredient')
        .trigger('fetch')

      $(e.currentTarget)
        .find('>.table.substrate>.buttonbar')
        .trigger('register-target', `${subrows}.selected`)
    })
    .on('click', `>${subrows}:not(.selected)`, e => {
      e.stopPropagation()

      $(`body>${ingrows}.selected`).removeClass('selected')

      $(e.currentTarget).data('ingredients')?.forEach(v =>
        $(`body>${ingrows}#${v.id}`).addClass('selected'))
    })
    .on('click', `.substrate .table.ingredient.selecting>.rows>.row.record:not(.selected)`, e => {
      e.stopPropagation()

      if (e.target.nodeName !== 'LABEL') {
        return
      }

      $(e.currentTarget).trigger('update-children', [
        `substrate/${$(`body>${subrows}.selected`).attr('id')}/ingredients`,
        {
          method: 'POST',
          body: JSON.stringify($(e.currentTarget).data()),
        },
        201,
      ])
    })
    .on('click', `.substrate .table.ingredient.selecting>.rows>.row.record.selected`, e => {
      e.stopPropagation()

      if (e.target.nodeName !== 'LABEL') {
        return
      }

      $(e.currentTarget).trigger('update-children', [
        `substrate/${$(`body>${subrows}.selected`).attr('id')}/ingredients/${e.currentTarget.id}`,
        { method: 'DELETE' },
        200,
      ])
    })
    .on('update-children', `.substrate .table.ingredient.selecting>.rows>.row.record`, (e, url, args, ok = 201) => {
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
    .on('click', `.substrate .table.ingredient>.buttonbar`, e => $(e.currentTarget.parentNode)
      .toggleClass('selecting'))
})()