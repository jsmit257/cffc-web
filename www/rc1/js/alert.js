(_ => {
  $(document.body)
    .on('app-error', '>.alert', (e, severity, action, message, state) => {
      $(e.currentTarget).find('>.rows').trigger('send', {
        severity,
        action,
        message,
        when: new Date().toISOString(),
      })
      let stack = new Error().stack.replace(/^(.*)?\n\s+at/m, '')
      console.log('app-error, level:', severity,
        'action:', action,
        'message:', message,
        'stack:', stack,
        'state:', state)
    })
})()