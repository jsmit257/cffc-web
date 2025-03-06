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
    .on('text', 'div', (e, t) => {
      e.stopPropagation()

      $(e.currentTarget).text(t)
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
      $fld.trigger($fld.attr('x-formatter') || 'text', v)
    })
})
