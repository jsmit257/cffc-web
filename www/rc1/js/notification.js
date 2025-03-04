(_ => {
  $(document.body)
    .on('app-error', 'body>.notification', (e, ...data) => {
      console.log('app-error', data)
    })
})()