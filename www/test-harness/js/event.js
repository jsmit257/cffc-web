$(_ => {
  let $rowtmpl = $('body>.template>.events>.rows>.row.template')

  $('body>.template>.notes')
    .clone(true, true)
    .insertAfter($('body>.template>.table.events>.rows'))

  $('body>.template>.photos')
    .clone(true, true)
    .insertAfter($('body>.template>.table.events>.rows'))

  $('body>.main>.workspace .events>.rows, body>.template>.events>.rows').off('send')
    .on('send', (e, ...data) => {
      e.stopPropagation()

      let $table = $(e.currentTarget)
      let selected = $table.find('>.selected').attr('id')

      $.ajax({
        url: '/eventtypes',
        method: 'GET',
        async: false,
        success: data => $rowtmpl
          .find('>.eventtype')
          .trigger('send', data
            .sort((a, b) => a.name.localeCompare(b.name))
          ),
        error: console.log,
      })

      $table.find('>.row.removable').remove()

      data.forEach(v => {
        $rowtmpl
          .clone(true, true)
          .appendTo($table)
          .toggleClass('template removable')
          .trigger('send', v)
      })

      if ($table.data('config').$eventbar.find('.remove')[data.length > 0
        ? 'addClass'
        : 'removeClass'
      ]('active')
        .hasClass('active')
      ) {
        $table.trigger('select', selected)
      }
    })
    .on('send', '>.row', (e, data) => {
      e.stopPropagation()

      let $e = $(e.currentTarget).data('row', data).attr('id', data.id)

      $e
        .find('>select.eventtype')
        .val(data.event_type.id)
        .trigger('change')
      $e.find('>input.temperature').val(data.temperature)
      $e.find('>input.humidity').val(data.humidity)
      $e.find('>.mtime').trigger('set', data.mtime)
      $e.find('>.ctime').trigger('set', data.ctime)
    })
    .on('reset', '>.row', (e, data) => {
      e.stopPropagation()

      let $e = $(e.currentTarget)
      $e.trigger('send', $e.data('row'))
    })
    .on('change', '>.row>select.eventtype', e => {
      let $e = $(e.currentTarget.parentNode)

      let $opt = $(e.currentTarget).find('option:selected')

      // console.log('changing', e.currentTarget.value)
      $e.find('>.severity').text($opt.attr('severity'))
      $e.find('>.stage').text($opt.attr('stage'))
    })
    .on('send', '>.row>select.eventtype', (e, ...data) => {
      e.stopPropagation()

      let $e = $(e.currentTarget)
        .empty()

      data.forEach(r => {
        $e.append($(new Option())
          .attr('stage', r.stage.name)
          .attr('severity', r.severity)
          .val(r.id)
          .text(r.name))
      })
    })
    .on('initialize', (e, cfg) => {
      let $events = $(e.currentTarget)
      let $eventbar = $events
        .parents('div.table.events')
        .first()
        .find('>div.buttonbar')
      let $owner = cfg.$owner

      $events.data('config', { $eventbar: $eventbar })

      $eventbar
        .on('click', '>.edit.active', e => {
          let $selected = $events.find('>.selected')
          $selected.find('[disabled="disabled"]').removeAttr('disabled')
          $selected.find('>.mtime.static').text("Now")

          $events.trigger('edit', {
            url: `${cfg.parent}/${$owner.data('record').id}/events`,
            data: $selected => {
              return JSON.stringify({
                "id": $selected.attr('id'),
                "temperature": parseFloat($selected.find('>.temperature').val()) || 0,
                "humidity": parseFloat($selected.find('>.humidity').val()) || 0,
                "event_type": {
                  "id": $selected.find('>.eventtype').val()
                },
                "ctime": new Date($selected.find('>.ctime.static').data('value')).toISOString(),
              })
            },
            success: (data, status, xhr) => { $owner.trigger('send', data) },
            error: _ => $selected.trigger('reset'),
            complete: _ => $selected.find('select, input').attr('disabled', 'disabled'),
            cancel: _ => $selected
              .trigger('reset')
              .find('select, input')
              .attr('disabled', 'disabled'),
            buttonbar: $eventbar
          })
        })
        .on('click', '>.add.active', e => {
          $events.trigger('add', {
            newRow: _ => $rowtmpl
              .clone(true, true)
              .toggleClass('template removable')
              .prependTo($events)
              .find('[disabled="disabled"]')
              .removeAttr('disabled')
              .parent()
              .first()
              .trigger('send', { event_type: { stage: {} }, mtime: 'Now', ctime: 'Now' }),
            url: `${cfg.parent}/${$owner.data('record').id}/events`,
            data: $selected => {
              return JSON.stringify({
                "temperature": parseFloat($selected.find('>.temperature').val()) || 0,
                "humidity": parseFloat($selected.find('>.humidity').val()) || 0,
                "event_type": {
                  "id": $selected.find('>.eventtype').val()
                },
              })
            },
            success: data => $events
              .find('>.selected')
              .trigger('send', data.events[0])
              .find('select, input')
              .attr('disabled', 'disabled'),
            error: _ => $events.trigger('remove-selected'),
            buttonbar: $eventbar
          })
        })
        .on('click', '.remove.active', e => {
          $events.trigger('delete', {
            url: `${cfg.parent}/${$owner.data('record').id}/events/${$events.find('.selected').attr('id')}`,
            buttonbar: $eventbar
          })
        })
        .trigger('subscribe', {
          clazz: 'notes',
          clicker: e => {
            e.stopPropagation()

            let $p = $(e.delegateTarget)
              .parents('.table.events')
              .first()

            if ($p.toggleClass('noting').hasClass('noting')
            ) {
              $p.find('div.notes').trigger('refresh', $events.find('.selected').attr('id'))
            }
          },
        })
        .trigger('subscribe', {
          clazz: 'photos',
          clicker: e => {
            e.stopPropagation()

            let $p = $(e.delegateTarget)
              .parents('.table.events')
              .first()

            if ($p.toggleClass('photoing').hasClass('photoing')
            ) {
              $p
                .find('div.photos')
                .addClass('gallery')
                .removeClass('singleton')
                .trigger('refresh', $events.find('.selected').attr('id'))
            }
          },
        })
        .find('.refresh').remove()
    })
})
