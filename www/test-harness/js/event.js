$(_ => {
  $('body>.template>.notes')
    .clone(true, true)
    .insertAfter($('body>.template>.table.events>.rows'))

  $('body>.template>.photos')
    .clone(true, true)
    .insertAfter($('body>.template>.table.events>.rows'))

  $('body>.main>.workspace .events>.rows, body>.template>.events>.rows')
    .on('send', '>.row', (e, data = { event_type: {}, mtime: 'Now', ctime: 'Now' }) => {
      e.stopPropagation()

      let $e = $(e.currentTarget)

      $e
        .find('>select.eventtype')
        .trigger('send', data.event_type)
        .val(data.event_type.id)
        .trigger('change')
      $e.find('>input.temperature').val(data.temperature)
      $e.find('>input.humidity').val(data.humidity)
      $e.find('>.mtime').trigger('format', data.mtime)
      $e.find('>.ctime').trigger('format', data.ctime)
    })
    .on('change', '>.row>.eventtype', e => {
      let $e = $(e.currentTarget.parentNode)

      let $opt = $(e.currentTarget).find('option:selected')

      // console.log('changing', e.currentTarget.value)
      $e.find('>.severity').text($opt.attr('severity'))
      $e.find('>.stage').text($opt.attr('stage'))
    })
    .on('attrs', '>.row>.eventtype>option', (e, v) => {
      e.stopPropagation()

      $(e.currentTarget)
        .attr({
          stage: (v.stage || {}).name,
          severity: v.severity
        })
        .val(v.id)
        .text(v.name)
    })
    .on('initialize', (e, cfg) => {
      let $events = $(e.currentTarget)
      let $parent = $(e.delegateTarget)
        .parents('.table.events')
        .first()
      let $eventbar = $events.buttonbar()
      let $owner = cfg.$owner

      $events.data('config', { $eventbar: $eventbar })

      $eventbar
        .on('click', '>.edit.active', e => {
          let $selected = $events
            .find('>.selected')
            .trigger('edit')

          $selected.find('>.mtime.static').text("Now")

          $events.trigger('edit', {
            url: `${cfg.parent}/${$owner.data('row').id}/events`,
            data: $selected => {
              return JSON.stringify({
                id: $selected.attr('id'),
                temperature: parseFloat($selected.find('>.temperature').val()) || 0,
                humidity: parseFloat($selected.find('>.humidity').val()) || 0,
                event_type: {
                  id: $selected.find('>.eventtype').val()
                },
                ctime: new Date($selected.find('>.ctime').data('value')).toISOString(),
              })
            },
            success: (data, status, xhr) => { $owner.trigger('send', data) },
          })
        })
        .on('click', '>.add.active', e => {
          $events.trigger('add', {
            url: `${cfg.parent}/${$owner.data('row').id}/events`,
            data: $selected => {
              return JSON.stringify({
                temperature: parseFloat($selected.find('>.temperature').val()) || 0,
                humidity: parseFloat($selected.find('>.humidity').val()) || 0,
                event_type: {
                  id: $selected.find('>.eventtype').val()
                },
              })
            },
            success: data => $events
              .find('>.selected')
              .trigger('reset')
              .trigger('send', data.events[0]),
          })
        })
        .on('click', '>.remove.active', e => $events
          .trigger('delete', `${cfg.parent}/${$owner.data('row').id}/events/${$events.find('.selected').attr('id')}`))
        .trigger('subscribe', {
          clazz: 'notes',
          attrs: { hover: 'notes' },
          clicker: e => {
            e.stopPropagation()

            if ($parent.toggleClass('noting').hasClass('noting')) {
              $parent.find('div.notes').trigger('refresh',
                $events.find('.selected').attr('id'))
            }
          },
        })
        .trigger('subscribe', {
          clazz: 'photos',
          attrs: { 'hover': 'photos' },
          clicker: e => {
            e.stopPropagation()

            if ($parent.toggleClass('photoing').hasClass('photoing')) {
              $parent
                .find('div.photos')
                .addClass('gallery')
                .removeClass('singleton')
                .trigger('refresh', $events.find('.selected').attr('id'))
            }
          },
        })
        .find('.refresh')
        .css('visibility', 'hidden')
    })
})
