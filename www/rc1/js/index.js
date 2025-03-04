$(_ => {
  let spaces = 'body>.main>.workspace'
  let notify = 'body>.notification'

  $(document.body)
    // .on('activate', `${spaces}`, (e, stub) => {
    .on('activate', `.workspace`, (e, stub) => {
      e.stopPropagation()

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

      $(`${spaces}.active`).removeClass('active')
      if ($(`${spaces}.${stub}`).trigger('activate', stub).length) {
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
    .on('add-events', '.workspace>.table', e => {
      fetch(`./frag/event.html`)
        .then(async resp => $('<div>')
          .html(await resp.text())
          .appendTo(e.currentTarget))
        .then(workspace => workspace.trigger('activate', stub))
        .catch(ex => $(`.notification`).trigger('app-error', [
          `loading event fragment ${stub}`,
          ex,
        ]))
    })
})
