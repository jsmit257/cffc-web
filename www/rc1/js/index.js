$(_ => {
  let spaces = '.main>.workspace'
  let notify = '.notification'

  $(document.body)
    .on('activate', `>${spaces}`, (e, stub) => {
      e.stopPropagation()

      localStorage.active = stub

      let $table = $(e.currentTarget)
        .addClass('active')
        .find(`>.table.${stub}`)
        .trigger('fetch')

      $table
        .find(`${$table.attr('x-target')}>.row`)
        .trigger('select')
    })
    .on('click', '[x-stub]:not(.selected)', e => {
      $('[x-stub].selected').removeClass('selected')
      let stub = $(e.currentTarget)
        .addClass('selected')
        .attr('x-stub')

      $(`body>${spaces}.active`).removeClass('active')
      if ($(`body>${spaces}.${stub}`).trigger('activate', stub).length) {
        return
      }

      fetch(`./js/${stub}.js`)
        .then(async resp => await resp.text())
        .then(text => {
          let script = document.createElement('script')
          script.text = text
          document.head.appendChild(script)
        })
        .catch(ex => $(`${notify}`).trigger('app-error', [
          `loading script ${stub}`,
          ex,
        ]))

      fetch(`./frag/${stub}.html`)
        .then(async resp => $('<div>')
          .addClass(`workspace active ${stub}`)
          .html(await resp.text())
          .appendTo('body>.main'))
        .then(workspace => workspace.trigger('activate', stub))
        .then(_ => $(document.head)
          .append($('<link>').attr({
            href: `./css/${stub}.css`,
            rel: 'stylesheet',
            as: 'style',
          })))
        .catch(ex => $(`${notify}`).trigger('app-error', [
          `loading fragment/css ${stub}`,
          ex,
        ]))
    })
    .on('add-child', '[x-child]', e => {
      fetch(`./frag/${e.currentTarget.attributes['x-child'].value}.html`)
        .then(async resp => $(await resp.text())
          .appendTo($(e.currentTarget)
            .removeAttr('x-child'))) // once is enough
        .catch(ex => $(`.notification`).trigger('app-error', [
          `loading event fragment ${stub}`,
          ex,
        ]))
    })
})
