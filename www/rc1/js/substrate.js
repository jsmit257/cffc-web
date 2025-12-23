(_ => {
  const ws = '.main>.workspace.substrate'
  const table = `${ws}>.table.substrate`
  const filter = `${table}>.columns>.type>label>select`
  const sub = `${table}>.rows`
  const subrow = `${sub}>.row.record`
  const child = `${table}>.workspace.ingredients>.table.ingredient`
  const ing = `${child}>.rows`
  const ingrows = `${ing}>.row.record`
  const selecting = `${child}.selecting>.rows>.record`

  $(document.body)
    .on('activate', `>${ws}`, e => {
      e.stopPropagation()

      setTimeout(_ => {
        $(`body>${child}`)
          .removeAttr('breadcrumb')
          .find('>.rows>.row')
          .addClass('managed')

        $(`body>${table}`).selected().trigger('select')
      }, 500)
    })
    .on('unmarshal', subrow, (e, data) => {
      e.stopPropagation()

      $(e.currentTarget).addClass(data.type)
    })
    .on('select', `>${subrow}`, e => {
      e.stopPropagation()

      $(`body>${child}`)
        .removeClass('selecting')
        .find('>.rows>.row.selected')
        .removeClass('selected')

      $(e.currentTarget).data('ingredients')?.forEach(v =>
        $(`body>${ingrows}#${v.id}`).addClass('selected'))
    })
    .on('click', `>${selecting}:not(.selected)`, e => {
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
    .on('click', `>${selecting}.selected`, e => {
      e.stopPropagation()

      $(e.currentTarget).trigger('update-children', [
        `substrate/${$(`body>${subrow}.selected`).attr('id')}/ingredients/${e.currentTarget.id}`,
        { method: 'DELETE' },
        200,
      ])
    })
    .on('update-children', `>${selecting}`, (e, url, args, ok = 201) => {
      e.stopPropagation()

      fetch(url, args).then(async resp => {
        if (resp.status !== ok) throw {
          status: resp.status,
          message: await resp.text(),
        }
        return await resp.json()
      }).then(json => $(`body>${subrow}.selected`).data('ingredients', json.ingredients)
      ).then(_ => $(e.currentTarget).toggleClass('selected')
      ).catch(ex => $(e.currentTarget).notify('error',
        `${args.method} '${url}' statusCode: ${ex.status ?? 'unsent'}`,
        ex,
      ))
    })
    .on('click', `>${child}>.buttonbar`, e => {
      e.stopPropagation()

      $(e.currentTarget.parentNode).toggleClass('selecting')
    })
    .on('change', `>${filter}`, e => {
      e.stopPropagation()

      const $table = $(`body>${table}`).attr('type-filter', e.currentTarget.value)

      if ($table.selected().is(':not(:visible)')) {
        $table.find('>.rows>.row:visible:first').trigger('select')
      }
    })
})()
