(_ => {
  $(document.body)
    .on('activate', '.workspace.lifecycle', e => {
      $(e.currentTarget) // create events
        .find('[x-stub]')
        .attr('x-stub', `events/${1}`)
    })
})()