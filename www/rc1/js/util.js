$(_ => {
  $.valHooks.number = { get: elem => elem.value * 1 }
  // $.valHooks.option = {
  //   get: elem =>
  //     $(`[radio-group="${$(elem).attr('radio-group')}"]:checked`).val()
  // }

  $.fn.extend({
    sortVal: function (el = this.get(0)) {
      // you could check this.length and return short when 0, but then you'd wonder
      // why the code isn't working and isn't throwing errors, either; better to let
      // it bomb when el is null, since it probably means a bad selector
      switch (el.nodeName.toLowerCase()) {
        case 'select': el = el.options[el.selectedIndex] // it's supposed to fall through
        case 'div': return el.innerText
        case 'input': return el.value
      }
    },
    send: function (...data) {
      this.each(function () { $(this).trigger('send', ...data) })
      return $(this)
    },
    withClass: function (add, clz) {
      this.each(function () { $(this)[add ? 'addClass' : 'removeClass'](clz) })
      return $(this)
    },
    buttonbar: function (el = this.get(0)) {
      return $(el)
        .parents('.table')
        .first()
        .find('>.buttonbar')
    },
    notify: function (lvl, action, msg, state) {
      this.each(function () {
        $('body>.notification').trigger('notify', [
          lvl,
          action,
          msg.message ?? msg,
          this,
          state,
        ])
      })
      return this
    },
    selected: function (...ids) {
      let $root, $result
      if (!($root = $(this.find(this.attr('x-target')))).length) {
        const $table = this.parents('[x-target]').first()
        if (!$($root = $table.find($table.attr('x-target')).first()).length) {
          return $('nothing')
        }
      }

      ids.filter(v => v).forEach(id => $root.find(`>#${id}`).trigger('select'))

      return ($result = $root.find('>.selected')).length
        ? $result
        : $root.find('>.row.record').first().trigger('select')
    },
    breadcrumb: function (id = 'unset') {
      if (typeof this.parents('.table').attr('no-breadcrumb') !== 'undefined') {
        return id === 'unset' ? undefined : this
      }

      const key = this.attr('breadcrumb') ?? this
        .parents('[breadcrumb]')
        .first()
        .attr('breadcrumb')

      if (!key) {
        throw new Error(`breadcrumb key for '${this.parents('.table').attr('class')}' is null`)
      } else if (id === 'unset') {
        return sessionStorage[key]
      } else if (!id) {
        throw new Error(`breadcrumb value for '${this.parents('.table').attr('class')}' is null`)
      }

      sessionStorage[key] = id

      return this
    },
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

      $(e.currentTarget)
        .data('src-date', new Date(d))
        .text(d.slice(0, 19).replace(/T/, ' '))
    })
    .on('long-date', 'div', (e, d) => {
      e.stopPropagation()

      d = new Date(d)
      $(e.currentTarget)
        .data('src-date', d)
        .text(d.toDateString() + ' ' + d.toLocaleTimeString())
    })
    .on('format', 'div', (e, v) => {
      e.stopPropagation()

      let $fld = $(e.currentTarget).data('original', v)
      $fld.trigger($fld.attr('x-formatter') ?? 'text', v)
    })

    // custom select/render options per-entity type
    .on('extend', 'select[render-attr]>option', (e, data) => $(e.currentTarget)
      .text(data[$(e.currentTarget).parent().attr('render-attr')]))
    .on('extend', 'select[render="event"]>option', (e, data) => $(e.currentTarget)
      .html(`${data.event_type.name} &bull; ${data.mtime.slice(0, 19).replace(/T/, ' ')}`))
    .on('extend', 'select[render="eventtype"]>option', (e, data) => $(e.currentTarget)
      .attr({
        severity: data.severity,
        stage: data.stage.name,
      })
      .text(data.name))
    .on('extend', 'select[render="lifecycle"]>option', (e, data) => $(e.currentTarget)
      .text(`${data.location} -> ${data.strain.name}`))
    .on('extend', 'select[render="strain"]>option', (e, data) => $(e.currentTarget)
      .attr('dtime', data.dtime)
      .text(`${data.name} | ${data.species} | ${data.vendor.name} | ${data.ctime.slice(0, 16)}`))
    .on('extend', 'select[render="substrate"]>option', (e, data) => $(e.currentTarget)
      .attr({
        type: data.type,
        dtime: data.dtime,
      })
      .text(`${data.name} | Vendor: ${(data.vendor || { name: 'interim' }).name}`))
    .on('extend', 'select[render="x-basic"]>option', (e, data) => $(e.currentTarget)
      .text(data))
})
