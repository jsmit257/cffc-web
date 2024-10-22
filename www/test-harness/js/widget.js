$(_ => {
  $.fn.extend({
    sortKey: function (el = this.get(0)) {
      // you could check this.length and return short when 0, but then you'd wonder
      // why the code isn't working and isn't throwing errors, either; better to let
      // it bomb when el is null, since it probably means a bad selector
      switch (el.nodeName) {
        case 'SELECT': el = el.options[el.selectedIndex] // it's supposed to fall through
        case 'DIV': return el.innerText
        case 'INPUT': return el.value
      }
    },
    send: function (...data) { // XXX: dangerous! probably not enough stopPropagation
      this.each(function () { $(this).trigger('send', ...data) })
      return $(this)
    },
    buttonbar: function (el = this.get(0)) {
      return $(el).parents('.table').find('.buttonbar')
    },
    click: function (el = this.get(0)) {
      return $(el).trigger('click')
    },
  })

  $('.short-date, .long-date')
    .on('reset-date', '.date', e => $(e.currentTarget).trigger('format', $(e.currentTarget).data(value)))

  $('.short-date')
    .on('format', (e, d) => $(e.currentTarget)
      .data('value', d)
      .text(d.replace('T', ' ').replace(/:\d{1,2}(\..+)?Z.*/, '')))

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
        .data('record', v)
        .appendTo($list)
        .trigger('attrs', v)) // attrs is anything: props, text, metadata, etc, per option

      $list.trigger('sent', data)
    })

  $('select.substrate')
    .on('attrs', '>option', (e, s) => $(e.currentTarget)
      .attr('type', s.type)
      .text(`${s.name} | Vendor: ${s.vendor.name}`))

  $('select.strains')
    .on('attrs', '>option', (e, s) => $(e.currentTarget)
      .attr({
        gid: (s.generaton || {}).id,
        dtime: s.dtime,
      })
      .text(`${s.name} | ${s.species} | ${s.vendor.name} | ${s.ctime.replace('T', ' ').replace(/:\d{1,2}(\..+)?Z.*/, '')}`))

  $('select.vendor, select.ingredients, select.stages')
    .on('attrs', '>option', (e, v) => $(e.currentTarget).text(v.name))

  $('.test-runner')
    .on('sending', (e, ...data) =>
      console.log('sending:', data.length))
    .on('attrs', '>option', (e, data = {}) =>
      $(e.currentTarget).text(`attrs: ${data.name}`))
    .on('sent', (e, ..._) =>
      console.log('sent:', $(e.currentTarget).children().length))
    .trigger('refresh')
})
