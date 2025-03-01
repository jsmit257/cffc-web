(_ => {
  $('body>.notification')
    .on('activate', (e, sev, action, msg, cfg = {}) => {
      let $notice = $(e.currentTarget)
        .find('>.row.template')
        .clone(true, true)
        .toggleClass(`template ${sev}`)
        .insertAfter($(e.currentTarget).find('.fieldnames'))
      $notice.find('>[name="when"]').text(new Date().toTimeString().slice(0, 8)) // FiXME
      $notice.find('>[name="severity"]').text(sev)
      $notice.find('>[name="action"]').text(action)
      $notice.find('>[name="message"]').text(msg)

      switch (sev) {
        case 'error':
        case 'warn':
        case 'info':
        case 'ask':
          $('body>.alert').trigger('deactivate', 'replaced')
          $notice.trigger('alert', cfg)
          break
        case 'console':
          console.log('severity', sev, 'action', action, 'message', msg)
        case 'debug':
          $notice.find('>[name="response"]').text('no UX')
          break
        default:
          $notice.find('>[name="response"]').text('unknown sev')
      }
    })
    .on('alert', '>.row', (e, cfg) => $(e.currentTarget)
      .clone(true, true)
      .toggleClass('row alert')
      .appendTo($(document.body).addClass('alerting'))
      .trigger('activate', [$(e.currentTarget), cfg])
      .find('>[name="response"]')
      .remove())
    .on('click', '>.row', e => $(e.currentTarget)
      .trigger('alert', $(e.currentTarget)))

  $(document)
    .on('activate', 'body>.alert', (e, src, cfg = {}) => {
      $(e.currentTarget)
        .find('>[name="action"]')
        .insertBefore($(e.currentTarget)
          .find('>[name="message"]')
          .insertBefore($(e.currentTarget).find('>[name="when"]')))

      let timeout = -1, interval = -1
      let $to = $('<div>').addClass('timeout template')
      if (cfg.timeout) {
        $to.removeClass('template').text(cfg.timeout)
        timeout = setTimeout(_ => $(e.currentTarget)
          .trigger('deactivate', 'timeout'), cfg.timeout * 1000)
        interval = setInterval(_ => $to.text(parseInt($to.text()) - 1), 1000)
      }

      let data = {
        src: src,
        timeout,
        interval,
        keyups: e => {
          switch (e.which) {
            case 27: return $(document.body)
              .find('>.alert')
              .trigger('deactivate', 'cancel (kbd)')
            case 13: return $(document.body)
              .find('>.alert')
              .trigger('deactivate', 'ok (kbd)')
          }
        },
      }
      $(e.currentTarget)
        .data(data)
        .css({
          left: `${(visualViewport.width - e.currentTarget.clientWidth) / 2}px`,
          top: `${(visualViewport.height - e.currentTarget.clientHeight) * .4}px`,
        })
        .append($to.on('click', e => $(e.delegateTarget).trigger('tbd')))
        .append($('<div>').addClass('cancel dialog-button').text('cancel')
          .on('click', e => $(e.delegateTarget).trigger('deactivate', 'cancel (mouse)')))
        .append($('<div>').addClass('ok dialog-button').text('ok')
          .on('click', e => $(e.delegateTarget).trigger('deactivate', 'ok (mouse)')))

      $(document).on('keyup', data.keyups)
    })
    .on('deactivate', 'body>.alert', (e, resp) => {
      let data = $(e.currentTarget).data()

      $(document).off('keyup', data.keyups)

      data.src.find('>div[name="response"]').text(resp)
      clearTimeout(data.timeout)
      clearInterval(data.interval)

      $(e.currentTarget).remove()
    })
    .on('click', 'body>.alert>.ok', e => $(e.delegateTarget).trigger('deactivate', 'ok'))
    .on('click', 'body>.alert>.cancel', e => $(e.delegateTarget).trigger('deactivate', 'cancel'))
})()
