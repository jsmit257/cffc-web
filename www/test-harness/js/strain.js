$(function () {
  let $strain = $('body>.main>.workspace>.strain')
    .on('activate', (e, selected) => {
      if (!selected || selected.constructor.prototype !== String.prototype) {
        selected = $table.find('>.row.selected').attr('id')
      }

      $('.table.strain .template>select.vendor').trigger('refresh')

      $table.trigger('refresh')

      setTimeout(_ => {
        $table.find(`>.row#${selected}`).click()
      }, 20)
    })

  let $table = $strain.find('>.table.strain>.rows')
    .on('send', '>.row', (e, data = { ctime: 'Now', vendor: {} }) => {
      e.stopPropagation()

      let $e = $(e.currentTarget)
        .data('row', data)
        .attr({
          id: data.id,
          gid: (data.generation || {}).id,
        })

      $e.find('>.name').val(data.name)
      $e.find('>.species').val(data.species)
      $e.find('>.vendor').val(data.vendor.id)
    })
    .on('click', '>.row', e => {
      if (e.isPropagationStopped()) {
        return
      }

      let $row = $(e.currentTarget)

      $.ajax({
        url: '/strainattributenames',
        method: 'GET',
        async: true,
        success: (result, status, xhr) => {
          let $attrlist = $strain
            .find('datalist#strain-attr-names')
            .empty()
          result.sort().forEach(r => $attrlist.append($(new Option()).val(r)))
        },
        error: console.log,
      })

      $attributes.trigger('refresh', {
        url: `/strain/${$row.attr('id')}`,
        xform: d => d.attributes,
      })

      $buttonbar.find('>.genlink')[$row.attr('gid')
        ? 'addClass'
        : 'removeClass'
      ]('active')
    })

  let $buttonbar = $strain.find('>.table.strain>.buttonbar')
    .on('click', '>.edit.active', e => {
      let $row = $table.find('>.selected').trigger('edit')

      $table.trigger('edit', {
        url: `/strain/${$row.attr('id')}`,
        data: $selected => JSON.stringify({
          name: $selected.find('>.name').val().trim(),
          species: $selected.find('>.species').val().trim(),
          vendor: {
            "id": $selected.find('>.vendor').val()
          }
        }),
        success: _ => $table.trigger('reset'),
      })
    })
    .on('click', '>.add.active', e => {
      let $oldattrs = $attributes.find('>.row.removable').remove()

      $table.trigger('add', {
        data: $selected => JSON.stringify({
          name: $selected.find('>.name').val(),
          species: $selected.find('>.species').val().trim(),
          vendor: {
            id: $selected.find('>.vendor').val()
          }
        }),
        success: (data, status, xhr) => {
          $table
            .trigger('reset')
            .find('>.selected')
            .trigger('send', data)
        },
        error: (xhr, status, error) => {
          $table.trigger('remove-selected')
          $attributes.append($oldattrs)
        },
        buttonbar: $(e.delegateTarget)
      })
    })
    .on('click', '.remove.active', e => $table.trigger('delete'))
    .on('click', '>.refresh.active', e => $table.trigger('reinit'))
    .trigger('subscribe', {
      clazz: 'photos',
      attrs: { 'hover': 'photos' },
      clicker: e => {
        e.stopPropagation()
        if ($strain
          .find('>.table.strain')
          .toggleClass('photoing')
          .hasClass('photoing')
        ) {
          $genphotos
            .trigger('refresh', $table.find('>.selected').attr('id'))
            .addClass('gallery')
            .removeClass('singleton')
        }
      },
    })
    .trigger('subscribe', {
      clazz: 'genlink',
      attrs: { 'hover': 'go to parent(s)' },
      clicker: e => {
        e.stopPropagation()

        $('body>.main>.header>.menuitem[name=generation]')
          .trigger('click', $table.find('>.row.selected').attr('gid'))
      },
    })
    .trigger('subscribe', {
      clazz: 'report',
      attrs: { 'hover': 'go to report' },
      clicker: e => {
        e.stopPropagation()
        $('body>.main>.header>.menu-scroll')
          .trigger('select', ['reporting', 'history.str', $table.find('>.selected').attr('id')])
      }
    })

  let $attributes = $strain.find('>.table.strainattribute>.rows')
    .on('send', '>.row', (e, data = {}) => {
      e.stopPropagation()

      let $r = $(e.currentTarget)
      $r.find('>.name').val(data.name)
      $r.find('>.value').val(data.value)
    })

  $strain.find('>.table.strainattribute>.buttonbar')
    .on('click', '>.edit.active', e => {
      $attributes.trigger('edit', {
        url: `/strain/${$table.find('.selected').attr('id')}/attribute`,
        data: $selected => {
          return JSON.stringify({
            id: $selected.attr('id'),
            name: $selected.find('>.name').val(),
            value: $selected.find('>.value').val()
          })
        },
        buttonbar: $(e.delegateTarget)
      })
    })
    .on('click', '>.add.active', e => {
      $attributes.trigger('add', {
        url: `/strain/${$table.find('.selected').attr('id')}/attribute`,
        data: $selected => {
          return JSON.stringify({
            name: $selected.find('>.name').val(),
            value: $selected.find('>.value').val()
          })
        },
        success: data => $attributes
          .find('>.selected')
          .trigger('reset')
          .trigger('send', data),
        buttonbar: $(e.delegateTarget)
      })
    })
    .on('click', '.remove.active', e => {
      $attributes.trigger('delete', [
        '/strain/',
        $table.find('.selected').attr('id'),
        '/attribute/',
        $attributes.find('.selected').attr('id')
      ].join())

      if ($attributes.children().length === 0) {
        $buttonbar.find('.remove').addClass('active')
      }
    })

  let $genphotos = $('body>.template>.photos')
    .clone(true, true)
    .insertAfter($('body>.main>.workspace>.strain>.table.strain>.rows'))
})
