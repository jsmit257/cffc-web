$(_ => {
  $('select[url]')
    .on('refresh', (e, params = {}) => {
      e.stopPropagation()

      let $list = $(e.currentTarget)

      $.ajax({
        url: $list.attr('url'),
        method: 'GET',
        async: true,
        success: data => $list.trigger('send', data),
        error: console.log,
        ...params,
      })
    })
    .on('send', (e, ...data) => {
      e.stopPropagation()

      let $list = $(e.currentTarget)
        .trigger('sending', data)
        // empty goes last so you have access to the old options in the sending handler;
        // not sure why you'd want it, but it feels weird to delete them first w/o asking
        .empty()

      data.forEach(v => $(new Option())
        .val(v.id)
        .appendTo($list)
        .trigger('attrs', v)) // attrs is anything: props, text, metadata, etc, per option

      $list.trigger('sent', data)
    })

  $(document.body)
    .on('strain-format', 'select>option', (e, s) => $(e.currentTarget)
      .text(`${s.name} | ${s.species} | ${s.vendor.name} | ${s.ctime.replace('T', ' ').replace(/:\d{1,2}(\..+)?Z.*/, '')}`))
    .on('substrate-format', 'select>option', (e, s) => $(e.currentTarget)
      .text(`${s.name} | Vendor: ${s.vendor.name}`))
    .on('format', '.short-date', (e, d) => {
      $(e.currentTarget)
        .data('value', d)
        .text(d.replace('T', ' ').replace(/:\d{1,2}(\..+)?Z.*/, ''))
    })
    .on('reset-date', '.date', e => $(e.currentTarget).trigger('format', $(e.currentTarget).data(value)))


  $('.test-runner')
    .on('sending', (e, ...data) =>
      console.log('sending:', data.length))
    .on('attrs', '>option', (e, data = {}) =>
      $(e.currentTarget).text(`attrs: ${data.name}`))
    .on('sent', (e, ..._) =>
      console.log('sent:', $(e.currentTarget).children().length))
  // .trigger('refresh')
})

