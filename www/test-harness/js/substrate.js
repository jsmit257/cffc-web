$(_ => {
  let $substrate = $('body>.main>.workspace>.substrate')
    .on('activate', e => { $table.trigger('reinit') })
  let $table = $substrate.find('>.table.substrate>.rows')
  let $buttonbar = $substrate.find('>.table.substrate>.buttonbar')
  let $ingredients = $substrate.find('>.table.ingredients>.rows')
  let $ingredientbar = $substrate.find('>.table.ingredients>.buttonbar')

  let types = [
    '<option value="plating">Plating</option>',
    '<option value="liquid">Liquid</option>',
    '<option value="grain">Grain</option>',
    '<option value="bulk">Bulk</option>',
  ]
  let vendors = []
  let ingredients = []

  let newRow = (data) => {
    data ||= { type: "", vendor: {} }
    return $('<div>')
      .addClass(`row hover ${data.type.toLowerCase()}`)
      .attr('id', data.id)
      .append($('<div class="name static" />').text(data.name))
      .append($('<input class="name live" />').val(data.name))
      .append($('<div class="type static" />').html(data.type))
      .append($('<select class="type live" />')
        .val(data.type)
        .append(types))
      .append($('<div class="vendor static" />').text(data.vendor.name))
      .append($('<select class="vendor live" />')
        .append(vendors)
        .data('vendor_uuid', data.vendor.id)
        .val(data.vendor.id))
  }

  $('.table.substrate>.columns>.column.type>select')
    .on('change', e => {
      $('.table.substrate')
        .removeClass('plating liquid grain bulk all')
        .addClass($(e.currentTarget).val())

      if ($table.find(`.selected.${$(e.currentTarget).val()}`).length === 0) {
        $table.find(`.row.${$(e.currentTarget).val()}`).first().click()
      }
    })
    .trigger('change')

  $table
    .on('reinit', e => {
      vendors.length = 0
      ingredients.length = 0

      $.ajax({
        url: '/vendors',
        method: 'GET',
        async: true,
        success: (result, status, xhr) => {
          result.forEach(r => {
            vendors.push($(`<option value="${r.id}">${r.name}</option>`))
          })
        },
        error: console.log,
      })

      $.ajax({
        url: '/ingredients',
        method: 'GET',
        async: true,
        success: data => {
          data.forEach(r => { ingredients.push($(`<option value="${r.id}">${r.name}</option>`)) })
        },
        error: console.log,
      })

      $(e.currentTarget).trigger('refresh', {
        newRow: newRow,
        buttonbar: $buttonbar
      })
    })
    .on('click', '>.row', e => {
      if (e.isPropagationStopped()) {
        return
      }
      $ingredients.trigger('refresh', $(e.currentTarget))
    })

  let newIngredientRow = (data) => {
    data ||= {}
    return $('<div>')
      .addClass('row hover')
      .attr('id', data.id)
      .append($('<div class="ingredient static" />').text(data.name))
      .append($('<select class="ingredient live" />')
        .append(ingredients)
        .val(data.id))
  }

  $ingredients.off('refresh').on('refresh', (e, row) => {
    $.ajax({
      url: `/substrate/${$(row).attr('id')}`,
      method: 'GET',
      async: true,
      success: (result, sc, xhr) => {
        $ingredients.empty()
        result.ingredients ||= []
        result.ingredients.forEach(a => {
          $ingredients.append(newIngredientRow(a))
        })
        $ingredients.find('.row').first().click()
        $buttonbar.find('.remove')[$ingredients.children().length > 0 ? 'removeClass' : 'addClass']('active')
        $ingredientbar.find('.remove, .edit')[$ingredients.children().length === 0 ? 'removeClass' : 'addClass']('active')
      },
      error: console.log
    })
  })

  $buttonbar
    .on('click', '>.edit.active', e => {
      if (!$(e.currentTarget).hasClass('active')) {
        return
      }

      $table.find('.selected>select.type')
        .empty()
        .append(types)
        .val($table.find('.selected>.type.static').text())
      $table.find('.selected>select.vendor')
        .empty()
        .append(vendors)
        .val($table.find('.selected>select.vendor').data('vendor_uuid'))

      $table.trigger('edit', {
        url: `/substrate/${$table.find('>.selected').attr('id')}`,
        data: $selected => {
          return JSON.stringify({
            "name": $selected.find('>.name.live').val(),
            "type": $selected.find('>.type.live').val(),
            "vendor": {
              "id": $selected.find('>.vendor.live').val()
            }
          })
        },
        success: (data, status, xhr) => {
          let $selected = $table.find('.selected')
          $selected.find('>.name.static').text($selected.find('>.name.live').val())
          $selected
            .removeClass('grain bulk')
            .addClass($selected.find('>.type.live').val().toLowerCase())
            .find('>.type.static')
            .text($selected.find('>.type.live').val())
          $selected
            .find('>.vendor.static')
            .text($selected.find('>.vendor.live>option:selected').text())
        },
        buttonbar: $buttonbar
      })
    })
    .on('click', '>.add.active', e => {
      if (!$(e.currentTarget).hasClass('active')) {
        return
      }
      $table.trigger('add', {
        newRow: newRow,
        data: $selected => {
          return JSON.stringify({
            "name": $selected.find('>.name.live').val(),
            "type": $selected.find('>.type.live').val(),
            "vendor": {
              "id": $selected.find('>.vendor.live').val()
            }
          })
        },
        success: (data, status, xhr) => {
          let $selected = $table.find('.selected')
          $selected.attr('id', data.id)
          $selected.find('>.name.static').text(data.name)
          $selected
            .removeClass('grain bulk')
            .addClass(data.type.toLowerCase())
            .find('>.type.static')
            .text(data.type)
          $selected
            .find('>.vendor.static')
            .text($selected.find('>.vendor.live>option:selected').text())
        },
        error: (xhr, status, error) => { $table.trigger('remove-selected') },
        buttonbar: $buttonbar
      })
    })
    .on('click', '.remove.active', e => {
      $table.trigger('delete', {
        url: `/substrate/${$table.find('>.selected').attr('id')}`,
        buttonbar: $buttonbar
      })
    })
    .on('click', '>.refresh', e => {
      $table.trigger('reinit')
    })

  $ingredientbar
    .on('click', '>.edit.active', e => {
      if (!$(e.currentTarget).hasClass('active')) {
        return
      }
      $ingredients.find('.selected>.ingredient.live')
        .append(ingredients)
        .val($ingredients.find('.selected').attr('id'))

      $ingredients.trigger('edit', {
        newRow: newIngredientRow,
        url: `/substrate/${$table.find('.selected').attr('id')}/ingredients/${$ingredients.find('.selected').attr('id')}`,
        data: $selected => {
          return JSON.stringify({
            id: $selected.find('>.ingredient.live').val(),
            name: $selected.find('>.ingredient.live>option:selected').text(),
          })
        },
        success: (data, status, xhr) => {
          let $row = $ingredients.find('.selected')
          let $ingredient = $row.find('.ingredient.live')
          $row.attr('id', $ingredient.val())
          $row.find('>.ingredient.static').text($ingredient.find('>option:selected').text())
          $buttonbar.find('.remove')[$ingredients.children().length > 0 ? "removeClass" : "addClass"]("active")
        },
        error: (xhr, status, error) => { $ingredients.find('.selected').removeClass('editing') },
        buttonbar: $ingredientbar
      })
    })
    .on('click', '>.add.active', e => {
      $ingredients.trigger('add', {
        newRow: newIngredientRow,
        url: `/substrate/${$table.find('.selected').attr('id')}/ingredients`,
        data: $selected => {
          return JSON.stringify({
            id: $selected.find('>.ingredient.live').val(),
            name: $selected.find('>.ingredient.live>option:selected').text(),
          })
        },
        success: (data, status, xhr) => {
          let $row = $ingredients.find('.selected')
          let $ingredient = $row.find('.ingredient.live')
          $row.attr('id', $ingredient.val())
          $row.find('>.ingredient.static').text($ingredient.find('>option:selected').text())
          $buttonbar.find('.remove')[$ingredients.children().length > 0 ? "removeClass" : "addClass"]("active")
        },
        error: (xhr, status, error) => { $ingredients.trigger('remove-selected') },
        buttonbar: $ingredientbar
      })
    })
    .on('click', '.remove.active', e => {
      $ingredients.trigger('delete', {
        url: `/substrate/${$table.find('.selected').attr('id')}/ingredients/${$ingredients.find('.selected').attr('id')}`,
        buttonbar: $ingredientbar
      })
      if ($ingredients.children().length === 0) {
        $buttonbar.find('.remove').addClass('active')
      }
    })
    .find('.refresh').remove()
})