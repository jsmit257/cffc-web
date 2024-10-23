$(() => {
  let icon = _ => $('<div>')
    .addClass('icon')
    .text(' ')

  let $btntmpl = (clz) => $('<div>')
    .addClass(`${clz} button`)
    .append(icon())

  $('.button').append(icon())

  $('.buttonbar')
    .on('reset', (e, h) => {
      var $buttonbar = $(e.currentTarget)
      $buttonbar
        .find('>.add, >.edit')
        .addClass('active')

      $buttonbar
        .find('>.ok, >.cancel')
        .removeClass('active')

      for (let [clazz, handler] of Object.entries(h || {})) {
        $buttonbar.find(`.${clazz}`).off('click', handler)
      }
    })
    .on('set', (e, data) => {
      let $buttonbar = $(e.currentTarget)
      let wrappers = {}

      $buttonbar
        .find('>.add, >.edit, >.ok, >.cancel')
        .removeClass('active')

      for (let [clazz, handler] of Object.entries(data.handlers)) {
        $buttonbar
          .find(`>.${clazz}`)
          .on('click', wrappers[clazz] = e => {
            handler(e)
            data.target.find('.row.selected').removeClass('editing')
            $buttonbar.trigger('reset', wrappers)
          })
          .addClass('active')
      }
    })
    .on('subscribe', (e, cfg) => {
      $btntmpl(`${cfg.clazz} active`)
        .appendTo($(e.currentTarget))
        .attr(cfg.attrs || {})
        .on('click', e => {
          if (!$(e.currentTarget).hasClass('active')) {
            return
          }
          cfg.clicker(e)
        })
    })
    .append($btntmpl('remove stdctrl').attr('hover', 'remove'))
    .append($btntmpl('cancel stdctrl').attr('hover', 'cancel'))
    .append($btntmpl('ok stdctrl').attr('hover', 'ok'))// .html('&#xe013;')
    .append($btntmpl('add active stdctrl').attr('hover', 'add new'))
    .append($btntmpl('edit stdctrl').attr('hover', 'edit'))// .html('&#x270D;')
    .append($btntmpl('refresh active').attr('hover', 'refresh'))
    .append($('<div>')
      .addClass('bumper')
      .html('&nbsp;'))
})
