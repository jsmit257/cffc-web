$(_ => {
  let $lifecycle = $('body>.main>.workspace>.lifecycle')
    .on('activate', e => {
      $.ajax({
        url: '/strains',
        method: 'GET',
        async: true,
        success: data => $table
          .find('>.row>.field>.strain')
          .trigger('send', data),
        error: console.log,
      })

      $.ajax({
        url: '/substrates',
        method: 'GET',
        async: true,
        success: data => $table
          .find('>.row>.field>.substrate')
          .trigger('send', data),
        error: console.log,
      })

      $ndx.trigger('refresh')
    })

  let $ndx = $lifecycle.find('.table.lifecycle>.rows.ndx')
    .on('send', '>.row', (e, data = {}) => {
      e.stopPropagation()

      let $n = $(e.currentTarget)

      $n.find('>.mtime').trigger('format', data.mtime)
      $n.find('>.location').text(data.location)
    })
    .on('resend', e => {
      e.stopPropagation()

      $(e.currentTarget)
        .find('>.selected')
        .removeClass('selected')
        .click()
    })
    .on('click', '>.row', e => {
      if (e.isPropagationStopped()) {
        return false
      }

      $table
        .trigger('set-editing', false)
        .trigger('refresh', { url: `/lifecycle/${$(e.currentTarget).attr('id')}` })
    })

  let $table = $lifecycle.find('.table.lifecycle>.rows.lc')
    .off('click')
    .off('send')
    .on('send', (e, lc = {
      strain: { name: 'New', vendor: {} },
      grain_substrate: { vendor: {} },
      bulk_substrate: { vendor: {} },
      mtime: new Date().toISOString(),
      ctime: new Date().toISOString(),
    }) => {
      let $table = $(e.currentTarget)

      lc = {
        count: 0,
        yield: 0,
        gross: 0,
        strain_cost: 0,
        grain_cost: 0,
        bulk_cost: 0,
        ...lc,
      }

      $table
        .removeClass('noting photoing')
        .trigger('set-editing', false)
        .data('row', lc)
        .parent()
        .removeClass('noting photoing')
        .find('.columns>.column>span.title')
        .text(`${lc.strain.name} - ${new Date(lc.ctime).toLocaleString()}`)

      fields.forEach(n => $table.find(`>.row>.field>.${n}`).val(lc[n] || 0))

      $table.find('.row>.field>.strain').val(lc.strain.id)
      $table.find('.row>.field>.grain_substrate').val(lc.grain_substrate.id)
      $table.find('.row>.field>.bulk_substrate').val(lc.bulk_substrate.id)

      $table.find('.row>.field>.mtime').trigger('format', lc.mtime)
      $table.find('.row>.field>.ctime').trigger('format', lc.ctime)

      $events
        .trigger('send', lc.events)
        .parent()
        .removeClass('noting photoing')
    })
    .on('edit', (e, args) => {
      $(e.currentTarget)
        .trigger('set-editing', 'edit')
        .find('>.row>.field>.mtime')
        .trigger('format', new Date().toISOString())
    })
    .on('add', (e, args) => {
      $(e.currentTarget)
        .trigger('send')
        .trigger('set-editing', 'add')

      $events.find('>.removable').remove()
    })
    .on('set-editing', (e, status) => {
      e.stopPropagation()

      let $table = $(e.currentTarget)

      $table[!status ? "removeClass" : "addClass"](`editing ${status || "add edit"}`)
        .parent()
        .find('.columns>.column>span.status')
        .text(status ? `(${status})` : '')

      $table.find('>.row>.field>input').prop('readonly', status === false)
      $table.find('>.row>.field>select').prop('disabled', status === false)
    })
    .on('resend', e => {
      e.stopPropagation()

      $(e.currentTarget)
        .trigger('set-editing', false)
        .trigger('send', $(e.currentTarget).data('row'))
    })
    .on('send', '>.row>.field>.strain', (e, ...data) => {
      e.stopPropagation()

      let $list = $(e.currentTarget)
        .empty()

      data.forEach(s => $list
        .append($(new Option())
          .val(s.id)
          .text(`${s.name} | Species: ${s.species || "unknown"} | Vendor: ${s.vendor.name}`))
      )
    })
    .on('send', '>.row>.field>.substrate', (e, ...data) => {
      e.stopPropagation()

      let $list = $(e.currentTarget)
        .empty()

      data.forEach(s => $list
        .append($(new Option())
          .val(s.id)
          .attr('type', s.type)
          .text(`${s.name} | Vendor: ${s.vendor.name}`))
      )
    })

  let $tablebar = $lifecycle.find('.table.lifecycle>.buttonbar')
    .on('click', '>.edit.active', e => {
      $table.trigger('edit', {
        url: `/lifecycle/${$ndx.find('>.selected').attr('id')}`,
        cancel: _ => $table.trigger('resend'),
        data: _ => JSON.stringify({
          id: $ndx.find('>.selected').attr('id'),
          location: $table.find('.row>.field>.location').val(),
          strain_cost: parseFloat($table.find('.row>.field>.strain_cost').val()) || 0,
          grain_cost: parseFloat($table.find('.row>.field>.grain_cost').val()) || 0,
          bulk_cost: parseFloat($table.find('.row>.field>.bulk_cost').val()) || 0,
          yield: parseFloat($table.find('.row>.field>.yield').val()) || 0,
          count: parseFloat($table.find('.row>.field>.count').val()) || 0,
          gross: parseFloat($table.find('.row>.field>.gross').val()) || 0,
          strain: {
            id: $table.find('.row>.field>.strain').val(),
          },
          grain_substrate: {
            id: $table.find('.row>.field>.grain_substrate').val(),
          },
          bulk_substrate: {
            id: $table.find('.row>.field>.bulk_substrate').val(),
          },
        }),
        success: _ => $table.trigger('set-editing', false),
        error: console.log, //_ => $table.trigger('resend'),
      })
    })
    .on('click', '>.add.active', e => {
      $table.trigger('add', {
        url: '/lifecycle',
        cancel: _ => $ndx.trigger('resend'),
        data: _ => JSON.stringify({
          location: $table.find('.row>.field>.location').val(),
          strain_cost: parseFloat($table.find('.row>.field>.strain_cost').val()) || 0,
          grain_cost: parseFloat($table.find('.row>.field>.grain_cost').val()) || 0,
          bulk_cost: parseFloat($table.find('.row>.field>.bulk_cost').val()) || 0,
          yield: parseFloat($table.find('.row>.field>.yield').val()) || 0,
          count: parseFloat($table.find('.row>.field>.count').val()) || 0,
          gross: parseFloat($table.find('.row>.field>.gross').val()) || 0,
          strain: {
            id: $table.find('.row>.field>.strain').val(),
          },
          grain_substrate: {
            id: $table.find('.row>.field>.grain_substrate').val(),
          },
          bulk_substrate: {
            id: $table.find('.row>.field>.bulk_substrate').val(),
          },
        }),
        success: _ => {
          $ndx
            .find('>.selected')
            .removeClass('selected')

          $ndx.trigger('refresh')
        },
        error: _ => $ndx.trigger('resend'),
      })
    })
    .on('click', '.remove.active', _ => $ndx.trigger('delete'))
    .on('click', '.refresh.active', _ => $ndx.trigger('refresh'))
    .trigger('subscribe', {
      clazz: 'notes',
      clicker: e => {
        e.stopPropagation()
        if ($lifecycle.find('>.table.lifecycle').toggleClass('noting').hasClass('noting')) {
          $gennotes.trigger('refresh', ($table.data('record') || {}).id)
        }
      },
    })
    .trigger('subscribe', {
      clazz: 'report',
      clicker: e => {
        e.stopPropagation()
        $('body>.main>.header>.menu-scroll')
          .trigger('select', ['reporting', 'history.lc', $ndx.find('>.selected').attr('id')])
      }
    })

  let $gennotes = $('body>.template>.notes')
    .clone(true, true)
    .insertAfter($table)

  let $events = $('body>.template>.table.events')
    .clone(true, true)
    .appendTo($lifecycle)
    .find('>div.rows')
    .on('send', (e, ...ev) => {
      $tablebar.find('.remove')[(ev.length !== 0 ? "removeClass" : "addClass")]('active')
    })
    .trigger('initialize', {
      parent: 'lifecycle',
      $owner: $table,
    })

  let fields = ['id', 'location', 'strain_cost', 'grain_cost', 'bulk_cost', 'yield', 'count', 'gross']
})
