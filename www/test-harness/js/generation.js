(_ => {
  $('.progeny')
    .on('sent', (e, ...data) => $(e.currentTarget)
      .prepend($('<option>')
        .addClass('null-pointer')
        .text('-- None --')))

  $('select[url="lifecycles"]')
    .on('attrs', '>option', (e, lc) => $(e.currentTarget)
      .data('record', lc)
      .text(`${lc.location || lc.id} | ${(lc.mtime || '?').replace('T', ' ').replace(/:\d{1,2}(\..+)?Z.*/, '')}`))

  let $generation = $('body>.main>.workspace>.generation')
    .on('activate', (e, selected) => {
      if (!selected || selected.constructor.prototype !== String.prototype) {
        selected = $ndx.find('>.selected').attr('id')
      }

      $.ajax({
        url: '/strains',
        method: 'GET',
        success: s => $generation
          .find('select.strains')
          .trigger('send', s),
        error: console.log,
      })

      $('.table.generation .row.template>select[url="lifecycles"]').trigger('refresh')

      $.ajax({
        url: '/substrates',
        method: 'GET',
        success: s => $gentable
          .find('select.substrate')
          .trigger('send', s),
        error: console.log,
      })

      $ndx.trigger('refresh')

      setTimeout(_ => {
        $ndx.find(`>.row#${selected}:not(.selected)`).click()
      }, 50)
    })
    .on('select', (e, gid) => $ndx.find(`.row#${gid}`).click())

  let $ndx = $generation.find('>.table.generation>.rows[name="generation"]')
    .on('refresh', _ => $gentable.removeClass('editing adding')) // ???
    .on('send', '>.row', (e, data = {}) => {
      e.stopPropagation()

      $(e.currentTarget)
        .attr('dtime', data.dtime)
        .find('>.lineage')
        .text((sources => (($(sources || [])
          .map((_, v) => v.strain.name)
          .get()
          .join(' + ')) || 'None') + ` - ${new Date(data.ctime).toLocaleString()}`)(data.sources))
    })
    .on('click', '>.row', e => {
      if (e.isPropagationStopped()) {
        return false
      }

      $gentable.trigger('refresh', { url: `/generation/${$(e.currentTarget).attr('id')}` })
    })

  let $gentable = $generation.find('>.table.generation>.rows[name="editor"]')
    .off('click').off('send')
    .on('refresh', e => $(e.currentTarget)
      .find('>.field>.progeny')
      .trigger('activate', $ndx.find('.selected').attr('id')))
    .on('send', (e, data = {
      plating_substrate: { vendor: {} },
      liquid_substrate: { vendor: {} },
      mtime: 'Now',
      ctime: 'Now',
    }) => {
      let $g = $(e.currentTarget)

      $g
        .data('row', data)
        .attr('id', data.id)
        .parent()
        .addClass('selecting') // gets removed on column.click
        .find('>.columns>.column.full')
        .text($ndx.find('>.selected>.lineage').text())
        .trigger('click')

      $g.find('>.field>.plating').val(data.plating_substrate.id)
      $g.find('>.field>.liquid').val(data.liquid_substrate.id)
      $g.find('>.field>.substrate').prop('disabled', true)
      $g.find('>.field>.mtime').trigger('format', data.mtime)
      $g.find('>.field>.ctime').trigger('format', data.ctime)

      $sources.trigger('send', data.sources)

      $events.trigger('send', data.events)
    })
    .on('resend', e => {
      $(e.currentTarget)
        .removeClass('editing adding')
        .trigger('send', $(e.currentTarget).data('row'))
        .find('>.field>select.substrate')
        .prop('disabled', true)
    })
    .on('change', '>.field>.progeny', e => {
      let $p = $(e.currentTarget)
      let curr = $p.attr('curr-id')
      let val = $p.val()
      let url = `/strain/${val}/generation`

      if (curr) {
        $.ajax({
          url: `/strain/${curr}/generation`,
          method: 'DELETE',
          // async: false,
          success: _ => {
            $p
              .removeAttr('curr-id')
              .find(`option[value=${curr}][disabled]`)
              .attr('disabled', false)
              .removeAttr('gid')
          },
          error: console.log,
        })
      }

      let $row = $p.parent()
      if (val === $p.children().first().text()) {
        $row.removeClass('link')
        return
      }

      url = `${url}/${$row.attr('id')}`

      $.ajax({
        url: url,
        method: 'PATCH',
        success: _ => {
          $p
            .attr('curr-id', val)
            .find(`option[value=${val}]`)
            .attr({
              disabled: true,
              gid: $row.attr('id'),
            })

          $row.addClass('link')
        },
        error: console.log,
      })
    })
    .on('activate', '>.field>.progeny', (e, gid) => {
      e.stopPropagation()

      $.ajax({
        url: `/strain/${gid}/generation`,
        method: 'GET',
        success: (strain = { id: '' }, status, xhr) => {
          let $link = $(e.currentTarget)
            .removeAttr('curr-id')
            .val(strain.id || $(e.currentTarget).children().first().text())
            .parents('.field')
            .first()
            .removeClass('link')

          if (strain.id) {
            $(e.currentTarget).attr('curr-id', strain.id)
            $link.addClass('link')
          }
        },
        error: (xhr, status, err) => { console.log('error', xhr, status, err) },
      })
    })
    .on('click', '>.field.link>.label', e => {
      e.stopPropagation()

      $('body>.main>.header>.menuitem[name=strain]')
        .trigger('click', $(e.delegateTarget)
          .find('>.field.link>select.progeny')
          .attr('curr-id'))
    })

  $gentable.parents('.table.generation')
    .on('click', '>.columns>.column.full', e => {
      $(e.delegateTarget)
        .removeClass('noting')
        .toggleClass('selecting')
    })

  let $tablebar = $generation.find('>.table.generation>.buttonbar')
    .on('click', '.edit.active', e => {
      let id = $gentable.attr('id')
      let cleanup = _ => $gentable.removeClass('editing').trigger('resend')
      $gentable
        .addClass('editing')
        .trigger('edit', {
          url: `/generation/${id}`,
          cancel: _ => $gentable.trigger('resend'),
          data: _ => JSON.stringify({
            id: id,
            plating_substrate: { id: $gentable.find('>.field>.plating').val() },
            liquid_substrate: { id: $gentable.find('>.field>.liquid').val() },
          }),
          success: data => $gentable
            .removeClass('editing')
            .trigger('send', {
              ...$gentable.data('row'),
              ...data,
              ctime: $gentable.find('>.field>.ctime').text(),
            }),
          error: cleanup,
        })
        .find('>.field>select.progeny')
        .prop('disabled', false)
    })
    .on('click', '.add.active', e => {
      let cleanup = _ => $ndx.trigger('refresh')
      $gentable
        .addClass('adding')
        .trigger('send')
        .trigger('add', {
          url: '/generation',
          cancel: cleanup,
          data: _ => JSON.stringify({
            plating_substrate: { id: $gentable.find('>.field>.plating').val() },
            liquid_substrate: { id: $gentable.find('>.field>.liquid').val() },
          }),
          success: data => $gentable
            .removeClass('adding')
            .trigger('send', data)
            .find('>div>select')
            .attr('disabled', true),
          error: cleanup,
        })
        .find('select[disabled]')
        .prop('disabled', false)
    })
    .on('click', '.remove.active', e => $gentable
      .trigger('delete', `/generation/${$gentable.attr('id')}`))
    .on('click', '.refresh', e => {
      $gentable.removeClass('editing')
      $ndx.trigger('refresh')
    })
    .trigger('subscribe', {
      clazz: 'notes',
      attrs: { 'hover': 'notes' },
      clicker: e => {
        e.stopPropagation()

        if ($generation
          .find('>.table.generation')
          .removeClass('selecting')
          .toggleClass('noting')
          .hasClass('noting')
        ) {
          $notes.trigger('refresh', $gentable.attr('id'))
        }
      },
    })
    .trigger('subscribe', {
      clazz: 'report',
      attrs: { 'hover': 'go to report' },
      clicker: e => {
        e.stopPropagation()
        $('body>.main>.header>.menu-scroll')
          .trigger('select', ['reporting', 'history.gen', $ndx.find('>.selected').attr('id')])
      }
    })

  let $sources = $generation.find('>.table.generation>.rows.sources')
    .off('refresh')
    .off('send')
    .on('refresh', e => $(e.currentTarget)
      .trigger('send', $(e.currentTarget).data('rows')))
    .on('send', (e, ...data) => {
      e.stopPropagation()

      $(e.currentTarget)
        .removeAttr('source-type')
        .data('rows', data)
        .find('>.removable')
        .remove()

      data.forEach(s => $source
        .clone(true, true)
        .insertBefore($(e.delegateTarget).find('.add-source'))
        .toggleClass('removable template')
        .data('record', s)
        .trigger('send', s))

      $tablebar
        .find('>.buttonbar>.remove, >.buttonbar>.edit')[data.length > 0
          ? 'addClass'
          : 'removeClass'
      ]('active')
    })
    .on('click', '.add-source', e => {
      let $curr = $source
        .clone(true, true)
        .insertBefore($(e.delegateTarget).find('.add-source'))
        .toggleClass('removable editing adding template')

      $curr.find('>select').prop('disabled', false)
      $curr.find('>select[name="type"]').val('spore').trigger('change')
      $curr.find('>select[name="origin"]').val('strain').trigger('change')
    })

  let $source = $sources.find('>.source.template')
    .on('send', (e, data = {}) => {
      e.stopPropagation()

      let $s = $(e.currentTarget)
        .data('record', data)
        .attr('id', data.id)

      let strainsource = typeof data.lifecycle === 'undefined'

      $s.find('>select[name="origin"]')
        .val(strainsource ? 'strain' : 'event')
        .trigger('change')

      $s.find('>select.strains')
        .val(data.strain.id)

      $s.find('>select[name="type"]')
        .val(data.type.toLowerCase())
        .trigger('change')

      if (!strainsource) {
        $s.find('>select[name="lcs"]')
          .val(data.lifecycle.id)
          .trigger('change')
      }
    })
    .on('resend', e => {
      e.stopPropagation()

      $(e.currentTarget)
        .trigger('send', $(e.currentTarget).data('record'))
        .find('select')
        .prop('disabled', true)
    })
    .on('change', '>select[name="origin"]', e => {
      $(e.delegateTarget).attr("source-origin", $(e.currentTarget).val())
    })
    .on('change', '>select[name="type"]', e => {
      $(e.delegateTarget)
        .parents('.sources')
        .first()
        .attr('source-type', $(e.currentTarget).val())
    })
    .on('events', '>select[name="progenitor"]', (e, p) => {
      e.stopPropagation()

      let $e = $(e.currentTarget).empty()

      $.ajax({
        url: `/lifecycle/${p}`,
        method: 'GET',
        success: (result = [], status, xhr) => {
          result.events.forEach(v => {
            $e.append($(`<option>`)
              .attr(
                'disabled',
                !v.event_type.name
                  .toLowerCase()
                  .startsWith($(e.delegateTarget)
                    .parents('div[source-type]')
                    .first()
                    .attr('source-type')))
              .val(v.id)
              .text(`${v.event_type.name} | ${v.mtime.replace('T', ' ').replace(/:\d{1,2}(\..+)?Z.*/, '')}`)
              .data('record', v))
          })
          $e.val($(e.delegateTarget).data('record').lifecycle.events[0].id)
        },
        error: console.log,
      })
    })
    .on('change', '>select[name="lcs"]', e => {
      e.stopPropagation()

      $(e.delegateTarget)
        .find('select[name="progenitor"]')
        .trigger('events', $(e.currentTarget).val())
    })
    .on('click', '>.buttonbox>.action', e => {
      let $src = $(e.delegateTarget)
      if ($src.toggleClass('editing').hasClass('adding')) {
        $src.remove()
      } else if ($src.hasClass('editing')) {
        $src.find('select').attr('disabled', false)
      } else {
        $src.trigger('resend')
      }
    })
    .on('click', '>.buttonbox>.commit', e => {
      let $src = $(e.delegateTarget)
      let type = $src.find('>select[name="type"]').val()
      let method = 'POST'
      let url = `/generation/${$gentable.attr('id')}/sources`
      let other = {}

      $src.find('select').attr('disabled', true)

      if ($src.hasClass('adding')) {
        url = `${url}/${$src.attr('source-origin')}`
        other.data = JSON.stringify({
          ...$src
            .find('>select[name="progenitor"]>option:selected')
            .data('record'),
          strain: $src
            .find('>select.strains>option:selected')
            .data('record'),
          type: type[0].toUpperCase().concat(type.slice(1)) // mea culpa
        })
      } else if ($src.hasClass('editing')) {
        method = 'PATCH'
        let temp = {
          id: $src.attr('id'),
          type: type[0].toUpperCase().concat(type.slice(1)),
          strain: $src
            .find('>select.strains>option:selected')
            .data('record'),
        }
        if ($src.attr('source-origin') !== 'strain') {
          temp.lifecycle = {
            ...$src
              .find('>select[name="lcs"]>option:selected')
              .data('record'),
            events: [
              $src
                .find('>select[name="progenitor"]>option:selected')
                .data('record'),
            ]
          }
        }
        other.data = JSON.stringify(temp)
      } else {
        url = `${url}/${$src.attr('id')}`
        method = 'DELETE'
        other.success = (result, status, xhr) => {
          $src.remove()
          if ($sources.find('.removable').length === 0) {
            $sources.attr('source-type', 'spore')
          }
        }
      }

      $.ajax({
        url: url,
        method: method,
        success: console.log,
        error: (xhr, status, err) => {
          console.log(status, err, xhr)
          $src.trigger('resend')
        },
        complete: _ => { $src.removeClass('adding editing') },
        ...other,
      })
    })

  let $events = $('body>.template>.table.events')
    .clone(true, true)
    .appendTo($generation)
    .find('>div.rows')
    .on('send', (e, ...ev) => {
      $tablebar.find('.remove')[((ev ||= []).length !== 0 ? "removeClass" : "addClass")]('active')
    })
    .trigger('initialize', {
      parent: 'generation',
      $owner: $gentable,
    })

  let $notes = $('body>.template>.notes')
    .clone(true, true)
    .insertAfter($gentable)
})()
