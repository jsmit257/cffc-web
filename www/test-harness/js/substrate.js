$(_ => {
  let $substrate = $('body>.main>.workspace>.substrate')
    .on('activate', e => {
      $('.table.substrate .row.template>select.vendor').trigger('refresh')
      $('.table.ingredients .row.template>.ingredients').trigger('refresh')

      $table.trigger('refresh')
    })

  let $table = $substrate.find('>.table.substrate>.rows')
    .on('send', '>.row', (e, data = { vendor: {} }) => {
      e.stopPropagation()

      let $s = $(e.currentTarget).addClass((data.type || '').toLowerCase())

      $s.find('>.name').val(data.name)
      $s.find('>.type').val(data.type)
      $s.find('>.vendor').val(data.vendor.id)

      data.ingredients ||= []
    })
    .on('click', '>.row', e => {
      if (e.isPropagationStopped()) {
        return
      }

      $ingredients.trigger('send', ($(e.currentTarget)
        .data('row')
        .ingredients)
        .sort((a, b) => a.name.localeCompare(b.name)))
    })

  let $buttonbar = $substrate.find('>.table.substrate>.buttonbar')
    .on('click', '>.edit.active', e => {
      $table.trigger('edit', {
        url: `/substrate/${$table.find('>.selected').attr('id')}`,
        data: $selected => {
          return JSON.stringify({
            name: $selected.find('>.name').val(),
            type: $selected.find('>.type').val(),
            vendor: {
              id: $selected.find('>.vendor').val()
            }
          })
        },
      })
    })
    .on('click', '>.add.active', e => {
      $table.trigger('add', {
        data: $selected => JSON.stringify({
          name: $selected.find('>.name').val(),
          type: $selected.find('>.type').val(),
          vendor: {
            id: $selected.find('>.vendor').val()
          }
        }),
        success: console.log,
      })
    })
    .on('click', '.remove.active', e => $table
      .trigger('delete', `/substrate/${$table.find('>.selected').attr('id')}`))
    .on('click', '>.refresh', e => $table.trigger('refresh'))

  let $ingredients = $substrate.find('>.table.ingredients>.rows')
    .on('send', e => {
      e.stopPropagation()
      $buttonbar.find('>.remove')[$(e.currentTarget).children('.removable').length > 0
        ? 'removeClass'
        : 'addClass'
      ]('active')
    })
    .on('send', '>.row', (e, data = {}) => $(e.currentTarget)
      .find('>.ingredients')
      .val(data.id))
    .on('change', '>.row>.ingredients', e => {
      let $ing = $(e.currentTarget)
      let rec = $ing.find('>option:selected').data('record')
      let $selected = $ing.parent()

      $.ajax({
        url: `/substrate/${$table.find('.selected').attr('id')}/ingredients/${$selected.attr('id')}`,
        contentType: 'application/json',
        method: 'PATCH',
        dataType: 'json',
        async: true,
        data: JSON.stringify({
          id: $selected.find('>.ingredients').val(),
          name: $selected.find('>.ingredients>option:selected').text(),
        }),
        success: _ => {
          let ing = $table
            .find('>.selected')
            .data('row')
            .ingredients

          ing.forEach((v, i) => {
            if (v.id == $selected.attr('id')) {
              ing[i] = rec
            }
          })

          $selected
            .data('row', rec)
            .attr('id', $ing.val())
        },
        error: console.log,
      })
    })

  $substrate.find('>.table.ingredients>.buttonbar')
    .on('click', '>.add.active', e => {
      $ingredients.trigger('add', {
        url: `/substrate/${$table.find('.selected').attr('id')}/ingredients`,
        data: $selected => JSON.stringify({
          id: $selected.find('>.ingredients').val(),
          name: $selected.find('>.ingredients>option:selected').text()
        }),
        success: console.log,
      })
    })
    .on('click', '.remove.active', e => {
      $ingredients.trigger('delete', `/substrate/${$table.find('.selected').attr('id')}/ingredients/${$ingredients.find('.selected').attr('id')}`)
      $buttonbar.find('.remove')[$ingredients.children().length > 0
        ? 'removeClass'
        : 'addClass'
      ]('active')
    })
    .find('.edit, .refresh').remove()

  $('.table.substrate>.columns>.column.type>select')
    .on('change', e => {
      let val = $(e.currentTarget).val()
      $('.table.substrate')
        .removeClass('plating liquid grain bulk all')
        .addClass(val)

      if ($table.find(`.selected.${val}:visible`).length === 0) {
        $table.find(`.row.${val}`).first().click()
      }
    })
    .trigger('change')
})