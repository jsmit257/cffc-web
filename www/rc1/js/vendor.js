(_ => {
  $(document.body)
    .on('refresh', '>.main>.table.vendor', e => console.log('refreshed', e.delegateTarget))
})()
