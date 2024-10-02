$(_ => {
  let $substrate = $('body>.main>.workspace>.substrate')
    .on('activate', e => $table.trigger('refresh'))

  let $table = $substrate.find('>.table.substrate>.rows')
    .on('pre-send', e => {
      e.stopPropagation()

      $.ajax({
        url: '/vendors',
        method: 'GET',
        async: false,
        success: data => $table
          .find('>.row.template>.vendor')
          .trigger('send', data),
        error: console.log,
      })

      e.stopPropagation()

      $.ajax({
        url: '/ingredients',
        method: 'GET',
        async: false,
        success: data => $ingredients
          .find('>.row.template>.ingredients')
          .trigger('send', data
          ),
        error: console.log,
      })
    })
    .on('send', '>.row', (e, data = { vendor: {} }) => {
      e.stopPropagation()

      let $s = $(e.currentTarget).addClass((data.type || '').toLowerCase())

      $s.find('>.name').val(data.name)
      $s.find('>.type').val(data.type)
      $s.find('>.vendor').val(data.vendor.id)
    })
    .on('click', '>.row', e => {
      if (e.isPropagationStopped()) {
        return
      }

      $ingredients.trigger('send', ($(e.currentTarget)
        .data('row')
        .ingredients || [])
        .sort((a, b) => a.name.localeCompare(b.name)))
    })
    .on('send', '>.row>.vendor', (e, ...data) => {
      e.stopPropagation()

      let $list = $(e.currentTarget)
        .empty()

      data.forEach(v => $list
        .append($(new Option())
          .val(v.id)
          .text(v.name)))
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
    .on('click', '.remove.active', e => $table.trigger('delete', `/substrate/${$table.find('>.selected').attr('id')}`))
    .on('click', '>.refresh', e => $table.trigger('refresh'))

  let $ingredients = $substrate.find('>.table.ingredients>.rows')
    .on('send', e => {
      e.stopPropagation()
      $buttonbar.find('>.remove')[$(e.currentTarget).children('.removable').length > 0
        ? 'removeClass'
        : 'addClass'
      ]('active')
    })
    .on('send', '>.row', (e, data = {}) => {
      e.stopPropagation()
      $(e.currentTarget).find('>.ingredients').val(data.id)
    })
    .on('send', '>.row>.ingredients', (e, ...data) => {
      e.stopPropagation()

      let $e = $(e.currentTarget)
        .empty()

      data.forEach(r => {
        $e.append($(new Option())
          .val(r.id)
          .text(r.name))
      })
    })

  $substrate.find('>.table.ingredients>.buttonbar')
    .on('click', '>.edit.active', e => {
      $ingredients.trigger('edit', {
        url: `/substrate/${$table.find('.selected').attr('id')}/ingredients/${$ingredients.find('.selected').attr('id')}`,
        data: $selected => {
          return JSON.stringify({
            id: $selected.find('>.ingredients').val(),
            name: $selected.find('>.ingredients>option:selected').text(),
          })
        },
      })
    })
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
    .find('.refresh').remove()

  $('.table.substrate>.columns>.column.type>select')
    .on('change', e => {
      $('.table.substrate')
        .removeClass('plating liquid grain bulk all')
        .addClass($(e.currentTarget).val())

      if ($table.find(`.selected.${$(e.currentTarget).val()}:visible`).length === 0) {
        $table.find(`.row.${$(e.currentTarget).val()}`).first().click()
      }
    })
    .trigger('change')
})