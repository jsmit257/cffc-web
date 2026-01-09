(_ => {
  let fmt = (v, r) => v.toFixed ? v.toFixed(r) : v

  let $lifecycle = $('body>.main>.workspace>.lifecycle')
    .one('activate', _ => {
      $tableremove.get(0).jsonData = ($ndx, $fields) => JSON.stringify({
        id: $ndx.find('>.selected').attr('id'),
        location: $fields.find('>.location').val(),
        strain_cost: $fields.find('>.strain_cost').val(),
        grain_cost: $fields.find('>.grain_cost').val(),
        bulk_cost: $fields.find('>.bulk_cost').val(),
        yield: $fields.find('>.yield').val(),
        count: $fields.find('>.count').val(),
        gross: $fields.find('>.gross').val(),
        strain: $fields.find('>.strains>option:selected').data('record'),
        grain_substrate: $fields.find('>.grain_substrate>option:selected').data('record'),
        bulk_substrate: $fields.find('>.bulk_substrate>option:selected').data('record'),
      })
    })
    .on('activate', e => $ndx.trigger('refresh'))

  let $ndx = $lifecycle.find('.table.lifecycle>.rows.ndx')
    .on('add', e => {
      $tableremove
        .trigger('send')
        .trigger('set-editing', 'add')

      $events.find('>.removable').remove()
    })
    .on('send', '>.row', (e, data = { location: 'far, far away...', mtime: new Date().toISOString() }) => {
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
    .on('click', '>.row', e => e.isPropagationStopped()
      || $tableremove
        .trigger('set-editing', false)
        .trigger('refresh', { url: `/lifecycle/${$(e.currentTarget).attr('id')}` }))

  let $tableremove = $lifecycle.find('.table.lifecycle>.rows.lc')
    .off('click')
    .off('send')
    .on('refresh-substrate', e => $.ajax({
      url: '/substrates',
      method: 'GET',
      success: data => {
        let $sub = $(e.currentTarget).find('>.row>.field>.substrate')
        let val = $sub.val()

        $sub
          .each((_, v) => v.saveid = v.value)
          .send(data)
          .each((_, v) => v.value = v.saveid)

      },
      error: (xhr, status, err) => xhr.status === 403 ||
        $('body>.notification').trigger('activate', [
          'error',
          `GET - /substrates`,
          err,
        ]),
    }))
    .on('send', (e, lc = {
      strain: {
        name: 'New',
        vendor: {},
        ctime: 'singularity'
      },
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

      simpletxt.forEach(n => $table.find(`>.row>.field>.${n}`).val(lc[n] || 0))

      $table.find('.row>.field>.yield').trigger('change')

      $table.find('.row>.field>.strains')
        .send(lc.strain)
        .val(lc.strain.id)
      $table.find('.row>.field>.grain_substrate')
        .send(lc.grain_substrate)
        .val(lc.grain_substrate.id)
      $table.find('.row>.field>.bulk_substrate')
        .send(lc.bulk_substrate)
        .val(lc.bulk_substrate.id)

      $table.find('.row>.field>.mtime').trigger('format', lc.mtime)
      $table.find('.row>.field>.ctime').trigger('format', lc.ctime)

      $events
        .trigger('send', lc.events)
        .parent()
        .removeClass('noting photoing')
    })
    .on('change', '.yield, .count, .gross', e => {
      let $fields = $(e.delegateTarget).find('>.row>.field')
      let gross = $fields.find('>.gross').val()
      let count = $fields.find('>.count').val()
      let yield = $fields.find('>.yield').val()

      $fields.find('>.dry-weight').text(fmt(yield / gross * 100, 3))
      $fields.find('>.per-kilo').text(fmt(count / yield * 1000, 2))
    })
    .on('edit', (e, args) => {
      let $fields = $(e.currentTarget)
        .trigger('set-editing', 'edit')
        .find('>.row>.field')

      $fields.find('>.mtime').trigger('format')
    })
    .on('set-editing', (e, status) => {
      e.stopPropagation()

      let $table = $(e.currentTarget)

      status && $table
        .trigger('refresh-substrate')
        .find('>.row>.field>.strains').trigger('refresh')

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
    .on('focus', 'input, select', e => $(e.currentTarget)
      .parent()
      .addClass('selected'))
    .on('blur', 'input, select', e => $(e.currentTarget)
      .parent()
      .removeClass('selected'))

  let $tablebar = $lifecycle.find('.table.lifecycle>.buttonbar')
    .on('click', '>.edit.active', e => {
      let $fields = $tableremove.find('>.row>.field')
      console.log()
      $tableremove.trigger('edit', {
        url: `/lifecycle/${$ndx.find('>.selected').attr('id')}`,
        cancel: _ => $tableremove.trigger('resend'),
        data: _ => $tableremove.get(0).jsonData($ndx, $fields),
        success: data => $tableremove
          .trigger('set-editing', false)
          // data doesn't have events, so we have to set the time this way
          .find('>.row>.field>.mtime')
          .trigger("format", data.mtime),
        error: console.log,
      })
    })
    .on('click', '>.add.active', e => {
      let $fields = $tableremove.find('.row>.field')
      $ndx.trigger('add', {
        cancel: _ => $ndx.trigger('remove-selected'),
        data: _ => $tableremove.get(0).jsonData($ndx, $fields),
        success: _ => $ndx.trigger('refresh'),
        error: _ => $ndx.trigger('remove-selected'), // FIXME: this isn't working
      })
    })
    .on('click', '.remove.active', _ => $ndx.trigger('delete'))
    .on('click', '.refresh.active', _ => $ndx.trigger('refresh'))
    .trigger('subscribe', {
      clazz: 'notes',
      attrs: { 'hover': 'notes' },
      clicker: e => {
        e.stopPropagation()
        if ($lifecycle
          .find('>.table.lifecycle')
          .toggleClass('noting')
          .hasClass('noting')
        ) {
          $notes.trigger('refresh', ($tableremove.data('row') || {}).id)
        }
      },
    })
    .trigger('subscribe', {
      clazz: 'report',
      attrs: { 'hover': 'go to report' },
      clicker: e => {
        e.stopPropagation()
        $('body>.main>.header>.menu-scroll')
          .trigger('select', ['reporting', 'history.lc', $ndx.find('>.selected').attr('id')])
      }
    })

  let $notes = $('body>.template>.notes')
    .clone(true, true)
    .insertAfter($tableremove)

  let $events = $('body>.template>.table.events')
    .clone(true, true)
    .appendTo($lifecycle)
    .find('>div.rows')
    .on('send', (e, ...ev) => $tablebar
      .find('.remove')[(ev.length !== 0 ? "removeClass" : "addClass")]('active'))
    .trigger('initialize', {
      parent: 'lifecycle',
      $owner: $tableremove,
    })

  let simpletxt = ['id', 'location', 'strain_cost', 'grain_cost', 'bulk_cost', 'yield', 'count', 'gross']
})()
