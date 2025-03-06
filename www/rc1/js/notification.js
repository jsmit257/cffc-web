(_ => {
  $(document.body)
    .on('app-error', '>.notification', (e, lvl, act, msg, state) => {
      console.log('app-error', lvl, act, msg, state)
    })
})()