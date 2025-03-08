$(_ => {
  $.valHooks.number = { get: (elem) => elem.value * 1 }

  $.fn.extend({
    //   sortKey: function (el = this.get(0)) {
    //     // you could check this.length and return short when 0, but then you'd wonder
    //     // why the code isn't working and isn't throwing errors, either; better to let
    //     // it bomb when el is null, since it probably means a bad selector
    //     switch (el.nodeName.toLowerCase()) {
    //       case 'select': el = el.options[el.selectedIndex] // it's supposed to fall through
    //       case 'div': return el.innerText
    //       case 'input': return el.value
    //     }
    //   },
    send: function (...data) {
      this.each(function () { $(this).trigger('send', ...data) })
      return $(this)
    },
    withClass: function (clz, add) {
      let fn = add ? 'addClass' : 'removeClass'
      this.each(function () { $(this)[fn](clz) })
      return $(this)
    },
    //   buttonbar: function (el = this.get(0)) {
    //     return $(el).parents('.table').first().find('.buttonbar')
    //   },
    //   click: function (el = this.get(0)) {
    //     return $(el).trigger('click')
    //   },
    alert: function (lvl, action, msg, state) { },
  })

  $(document.body)
    // different ways to format text in a div
    .on('text', 'div', (e, t) => {
      e.stopPropagation()

      $(e.currentTarget).text(t)
    })
    .on('html', 'div', (e, t) => { // html injection??
      e.stopPropagation()

      $(e.currentTarget).html(t)
    })
    .on('fixed', 'div', (e, v, r = 2) => {
      e.stopPropagation()

      $(e.currentTarget).text(v.toFixed ? v.toFixed(r) : v)
    })
    .on('short-date', 'div', (e, d) => {
      e.stopPropagation()

      $(e.currentTarget).text(d.slice(0, 19).replace(/T/, ' '))
    })
    .on('long-date', 'div', (e, d) => {
      e.stopPropagation()

      $(e.currentTarget).text(new Date(d).toDateString())
    })
    .on('format', 'div', (e, v) => {
      e.stopPropagation()

      let $fld = $(e.currentTarget).data('original', v)
      $fld.trigger($fld.attr('x-formatter') ?? 'text', v)
    })

    // custom select/render options per-entity type
    .on('extend', 'select[render="x-basic"]>option', (e, data) => $(e.currentTarget)
      .text(data))
    .on('extend', 'select[render-attr]>option', (e, data) => $(e.currentTarget)
      .text(data[$(e.currentTarget).parent().attr('render-attr')]))
    .on('extend', 'select[render="strain"]>option', (e, data) => $(e.currentTarget)
      .text(`${data.name} | ${data.species} | ${data.vendor.name} | ${data.ctime
        .replace('T', ' ')
        .slice(0, 16)}`))
    .on('extend', 'select[render="substrate"]>option', (e, data) => $(e.currentTarget)
      .text(`${data.name} | Vendor: ${(data.vendor || { name: 'interim' }).name}`))
    .on('extend', 'select[render="lifecycle"]>option', (e, data) => $(e.currentTarget)
      .text(data.location))
    .on('extend', 'select[render="event"]>option', (e, data) => $(e.currentTarget)
      .html(`${data.event_type.name} &bull; ${data.mtime.slice(0, 19).replace(/T/, ' ')}`))
    .on('extend', 'select[render="eventtype"]>option', (e, data) => $(e.currentTarget)
      .attr({
        severity: data.severity,
        stage: data.stage.name,
      })
      .text(data.name))

})
