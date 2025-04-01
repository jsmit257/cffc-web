(_ => {
  let table = '.notification'
  let noterow = `${table}>.rows>.row.record`
  let alert = '.alert'

  $(document.body)
    .on('notify', `>${table}`, (e, severity, action, message, origin, ...state) => {
      e.stopPropagation()

      let $notice = $(e.currentTarget)
        .find('>.rows')
        .trigger('send', {
          severity,
          action,
          message,
          when: new Date().toISOString(),
          // from here down attrs are just stashed on the row.data, not
          // sure what to do with them
          origin,
          state,
          // FIXME, or remove me; stack only shows line numbers for 
          //  dynamically loaded scripts, no filename
          stack: new Error().stack.replace(/^(.*)?\n\s+at/m, ''),
        })
        .find('>.row.record')
        .last()

      switch (severity) {
        case 'error':
        case 'warn':
        case 'info':
        case 'ask':
          $('body>.alert').trigger('deactivate', 'replaced')
          $notice.trigger('alert')
          break
        case 'console':
          console.log({ severity, action, message, origin, state, stack })
        case 'debug':
          $notice.find('>[name="response"]').text('no UX')
          break
        default:
          $notice.find('>[name="response"]').text('unknown severity')
      }
    })
    .on('alert', `>${noterow}`, e => {
      e.stopPropagation()
      $(e.currentTarget)
        .clone(true, true)
        .toggleClass(`row record alert`)
        .appendTo($(document.body).addClass('alerting'))
        .trigger('activate', $(e.currentTarget))
        .find('>[name="response"]')
        .remove()
    })
    .on('click', `>${noterow}`, e => {
      e.stopPropagation()

      $(e.currentTarget).trigger('alert')
    })
    .on('activate', `>${alert}`, (e, src, timeout = 30) => {
      e.stopPropagation()

      // XXX: this mess would be a lot easier of alert was just a table
      // let order = (a) => {
      //   let head = $(e.currentTarget).find(`>[name="${a.shift()}"]`)
      //   if (a.length === 0) {
      //     return head
      //   }
      //   return $(e.currentTarget)
      //     .find(`>[name="${head}"]`)
      //     .insertBefore(order(a))
      // }
      // order(['action', 'message', 'severity', 'when'])
      $(e.currentTarget)
        .find('>[name="action"]')
        .insertBefore($(e.currentTarget)
          .find('>[name="message"]')
          .insertBefore($(e.currentTarget)
            .find('>[name="when"]')))

      let timer = -1, interval = -1
      let $to = $('<div>').addClass('timeout x-template')
      if (timeout) {
        $to.removeClass('x-template').text(timeout)
        timer = setTimeout(_ => $(e.currentTarget)
          .trigger('deactivate', 'timedout'), timeout * 1000)
        interval = setInterval(_ => $to.text(parseInt($to.text()) - 1), 1000)
      }

      $(e.currentTarget)
        .data({ src, timer, interval })
        .css({
          left: `${(visualViewport.width - e.currentTarget.clientWidth) / 2}px`,
          top: `${(visualViewport.height - e.currentTarget.clientHeight) * .4}px`,
        })
        .append($to.on('click', e => $(e.delegateTarget)
          .trigger('tbd')))
        .append($('<div>')
          .addClass('cancel dialog-button')
          .text('cancel')
          .on('click', e => $(e.delegateTarget)
            .trigger('deactivate', 'cancel (mouse)')))
        .append($('<div>')
          .addClass('ok dialog-button')
          .text('ok')
          .on('click', e => $(e.delegateTarget)
            .trigger('deactivate', 'ok (mouse)')))
    })
    .on('deactivate', `>${alert}`, (e, resp) => {
      e.stopPropagation()

      let data = $(document.body)
        .removeClass('alerting')
        .find('>.alert')
        .data()

      $(data.src).find('>div[name="response"]').text(resp)
      clearTimeout(data.timer)
      clearInterval(data.interval)

      $(e.currentTarget).remove()
    })
    .on('click', `>${alert}.ok`, e => {
      e.stopPropagation()

      $(e.delegateTarget).trigger('deactivate', 'ok')
    })
    .on('click', `>${alert}.cancel`, e => {
      e.stopPropagation()

      $(e.delegateTarget).trigger('deactivate', 'cancel')
    })
    .on('unmarshal', `>${noterow}`, (e, data) => {
      e.stopPropagation()

      $(e.currentTarget).addClass(data.severity)
    })

  $(document).on('keyup', 'body.alerting', e => {
    switch (e.code) {
      case 'Escape':
        $(`body>${alert}`).trigger('deactivate', 'cancel (keyboard)')
        break
      case 'Enter':
        $(`body>${alert}`).trigger('deactivate', 'ok (keyboard)')
        break
      default:
    }
  })
})()