$(_ => $('body>.main>.workspace>div .table>.rows, body>.template>.table>.rows')
  .on('refresh', (e, args = {}) => {
    let $table = $(e.currentTarget)
    let $parent = $table
      .parents('.table')
      .first()

    args.buttonbar ||= $parent.find('.buttonbar')

    $.ajax({
      url: args.url || `/${$(e.currentTarget).attr('name')}s`,
      method: 'GET',
      async: true,
      success: data => {
        $table.trigger('send', (args.xform || (d => d))(data))

        args.buttonbar.find('.remove, .edit')[$table.find('>.removable, >.countable').length > 0
          ? 'addClass'
          : 'removeClass'
        ]('active')

        $parent
          .find('.columns>.column[sort-order]')
          .removeAttr('sort-order')
      },
      error: args.error || console.log
    })
  })
  .on('send', (e, ...data) => {
    e.stopPropagation()

    let $table = $(e.currentTarget)
      .trigger('pre-send')
    let selected = $table
      .find('>.selected')
      .attr('id')
    let $tmpl = $table.find('>.row.template')

    $table.find('>.row.removable').remove()

    data.forEach(v => {
      $tmpl
        .clone(true, true)
        .appendTo($table)
        .toggleClass('template removable')
        .trigger('send', v)
    })

    if ($table
      .parents('.table')
      .first()
      .find('>.buttonbar>.remove, >.buttonbar>.edit')[data.length > 0
        ? 'addClass'
        : 'removeClass'
    ]('active')
      .hasClass('active')
    ) {
      $table.trigger('select', selected)
    }
  })
  .on('edit', (e, args) => {
    let $table = $(e.currentTarget)
    $table
      .find('.row.selected')
      .addClass('editing')
      .trigger('edit')
      .find('input, select')
      .first()
      .focus()

    args.buttonbar ||= $table
      .parents('.table')
      .first()
      .find('>.buttonbar')

    let data = args.data
    delete args.data

    args.buttonbar.trigger('set', {
      target: $table,
      handlers: {
        cancel: args.cancel || (_ => $table.find('>.selected').trigger('resend')),
        ok: args.ok || (e => {
          let $selected = $table.find('>.selected')

          $.ajax({
            url: `/${$table.attr('name')}/${$selected.attr('id')}`,
            contentType: 'application/json',
            method: 'PATCH',
            dataType: 'json',
            data: data($selected),
            async: true,
            success: $selected.trigger('reset'),
            error: console.log, //$selected.trigger('resend'),
            ...args,
          })
        })
      }
    })
  })
  .on('add', (e, args) => {
    let $table = $(e.currentTarget)

    let $selected = $table
      .find('.selected')
      .removeClass('selected editing')

    let $row = (args.newRow || (_ => $table.find('>.row.template')
      .clone(true, true)
      .toggleClass('template removable')
      .prependTo($table)
      .trigger('edit')
      .trigger('send')))
      ()
      .prependTo($table)
      .addClass('selected editing')

    if ($selected.length !== 0) {
      $row.insertBefore($selected)
    }

    $row.find('input, select')
      .first()
      .focus()

    args.buttonbar ||= $table
      .parents('.table')
      .first()
      .find('>.buttonbar')

    let data = args.data
    delete args.data

    args.buttonbar.trigger('set', {
      target: $table,
      handlers: {
        cancel: args.cancel || (_ => $table.trigger('remove-selected')),
        ok: args.ok || (e => {
          let $selected = $table.find('.selected').trigger('reset')

          $.ajax({
            url: `/${$table.attr('name')}`,
            contentType: 'application/json',
            method: 'POST',
            dataType: 'json',
            data: data($selected),
            async: true,
            success: (result, status, xhr) => {
              (args.success || (_ => 1))(result, status, xhr) // anything to get out of writing an if statement
              args.buttonbar.find('.remove, .edit')[$table.find('>.removable, >.countable').length > 0
                ? 'addClass'
                : 'removeClass'
              ]('active')
            },
            error: args.error || (_ => $table.trigger('remove-selected')),
            ...args
          })
        })
      }
    })
  })
  .on('delete', (e, url) => {
    let $table = $(e.currentTarget)
    $.ajax({
      url: url || `/${$table.attr('name')}/${$table.find('.selected').attr('id')}`,
      contentType: 'application/json',
      method: 'DELETE',
      async: false,
      success: (result, status, xhr) => {
        $table.trigger('remove-selected')

        $table
          .parents('.table')
          .first()
          .find('>.buttonbar.edit, >.buttonbar.remove')[$table.find('>.removable, >.countable').length === 0
            ? 'removeClass'
            : 'addClass'
        ]('active')

      },
      error: console.log,
    })
  })
  .on('sort', (e, key, order) => {
    $(e.currentTarget)
      .append(...$(e.currentTarget)
        .find(`.static.${key}`)
        .sort((a, b) => (order === 'sort-desc' ? -1 : 1) * a.innerText.localeCompare(b.innerText))
        .map((_, x) => $(x).parent()))
  })
  .on('select', (e, id) => {
    e.stopPropagation()

    let $e = $(e.currentTarget)
    if ($e.find(`.row#${id}`).click().length === 0) {
      $e.find('.removable').first().click()
    }
  })
  .on('remove-selected', e => {
    let $selected = $(e.currentTarget).find('>.selected')
    if ($selected.next('.row:not(.template)').trigger('click').length == 0) {
      $selected.prev('.row:not(.template)').trigger('click')
    }
    $selected.remove()
  })
  .on('keyup', e => {
    let btn = {
      13: 'ok',
      27: 'cancel'
    }[e.which]
    if (!btn) {
      return
    }

    $(e.currentTarget)
      .parents('.table')
      .first()
      .find(`.buttonbar>.${btn}`)
      .click()
  })
  .on('send', '>.row', (e, data = { mtime: 'Now', ctime: 'Now' }) => {
    e.stopPropagation()

    let $row = $(e.currentTarget)

    // back where we started with the uuid table; set additional attribute
    // handlers in subsequent 'send' events
    $row
      .data('row', data)
      .attr({
        id: data.id,
        dtime: data.dtime,
      })
    $row.find('>.mtime').trigger('format', data.mtime)
    $row.find('>.ctime').trigger('format', data.ctime)
  })
  .on('resend', '>.row', (e, data) => {
    e.stopPropagation()

    let $e = $(e.currentTarget)
    $e
      .trigger('reset')
      .trigger('send', $e.data('row'))
  })
  .on('edit', '>.row', e => {
    e.stopPropagation()

    let $e = $(e.currentTarget)

    $e.find('>input').prop('readonly', false)
    $e.find('>select').prop('disabled', false)
  })
  .on('reset', '>.row', e => {
    e.stopPropagation()

    let $e = $(e.currentTarget)

    $e.find('>input').prop('readonly', true)
    $e.find('>select').prop('disabled', true)
  })
  .on('click', '>.row:not(.template)', e => {
    let $row = $(e.currentTarget)

    if ($row.hasClass('selected')) {
      e.stopPropagation()
      return false
    }

    $row
      .parents('.table')
      .first()
      .find('.buttonbar')
      .trigger('reset')

    $row
      .parent()
      .find('.row.selected')
      .removeClass('selected editing')

    $row.addClass('selected')
  })
  .on('dblclick', '>.row:not(.template)', e => {
    $(e.currentTarget)
      .parents('.table')
      .first()
      .find('.buttonbar>.edit')
      .click()
  }))
