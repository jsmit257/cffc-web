$(function () {
  $('body>.main>.workspace>div .table>.rows, body>.template>.table>.rows')
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
    .on('remove-selected', e => {
      let $selected = $(e.currentTarget).find('>.selected')
      if ($selected.next('.row:not(.template)').trigger('click').length == 0) {
        $selected.prev('.row:not(.template)').trigger('click')
      }
      $selected.remove()
    })
    .on('refresh', (e, args) => {
      let $table = $(e.currentTarget)

      args ||= {}
      args.buttonbar ||= $table
        .parents('.table')
        .first()
        .find('.buttonbar')

      $.ajax({
        url: args.url || `/${$(e.currentTarget).attr('name')}s`,
        method: 'GET',
        async: true,
        success: (result, sc, xhr) => {
          let selected = $table.find('.selected>.uuid').text()
          $table.empty()
          result.forEach(r => {
            let $row = args.newRow(r)
            $table.append($row)
            if (r.id === selected) {
              $row.click()
            }
          })
          args.buttonbar.find('.remove, .edit')[$table.children().length === 0 ? "removeClass" : "addClass"]('active')
          if ($table.find('.selected').length == 0) {
            $table.find('.row').first().click()
          }
          $table
            .parents('.table')
            .first()
            .find('.columns>.column[sort-order]')
            .removeAttr('sort-order')
        },
        error: args.error || console.log
      })
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
    })
    .on('send', '>.row', (e, data = { mtime: 'Now', ctime: 'Now' }) => {
      let $row = $(e.currentTarget)

      // back where we started with the uuid table; set additional attribute
      // handlers in subsequent 'send' events
      $row.attr('id', data.id)
      $row.find('>.mtime').trigger('set', data.mtime)
      $row.find('>.ctime').trigger('set', data.ctime)
    })
    .on('add', (e, args) => {
      let $table = $(e.currentTarget)

      let $selected = $table
        .find('.selected')
        .removeClass('selected editing')

      let $row = args.newRow()
        .prependTo($table)
        .addClass('selected editing')

      if ($selected.length !== 0) {
        $row.insertBefore($selected)
      }

      $row.find('input, select')
        .first()
        .focus()

      args.buttonbar.trigger('set', {
        "target": $table,
        "handlers": {
          "cancel": e => {
            $table.trigger('remove-selected')
          },
          "ok": args.ok || (e => {
            let $selected = $table.find('.selected')
            $.ajax({
              url: args.url || `/${$table.attr('name')}`,
              contentType: 'application/json',
              method: 'POST',
              dataType: 'json',
              data: args.data($selected),
              async: true,
              success: (result, status, xhr) => {
                args.success(result, status, xhr)
                if ($table.children().length > 0) {
                  args.buttonbar.find('.remove, .edit').addClass('active')
                }
              },
              error: args.error,
            })
          })
        }
      })
    })
    .on('edit', (e, args) => {
      let $table = $(e.currentTarget)
      $table
        .find('.row.selected')
        .addClass('editing')
        .find('input, select')
        .first()
        .focus()

      args.buttonbar.trigger('set', {
        "target": $table,
        "handlers": {
          "cancel": args.cancel || console.log,
          "ok": args.ok || (e => {
            let $selected = $table.find('.selected')
            let data = args.data($selected)
            delete args.data
            $.ajax({
              ...{
                url: `/${$table.attr('name')}/${$selected.attr('id')}`,
                contentType: 'application/json',
                method: 'PATCH',
                dataType: 'json',
                data: data,
                async: true,
                success: console.log,
                error: console.log,
              },
              ...args,
            })
          })
        }
      })
    })
    .on('delete', (e, args) => {
      let $table = $(e.currentTarget)
      $.ajax({
        url: args.url || `/${$table.attr('name')}/${$table.find('.selected').attr('id')}`,
        contentType: 'application/json',
        method: 'DELETE',
        async: false,
        success: (result, status, xhr) => {
          $table.trigger('remove-selected')
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
        $e.children('.removable').first().click()
      }
    })
})
