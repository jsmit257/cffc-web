$(_ => {
  Array.prototype.combinations = function (head = [], result = []) {
    if (!this.length) {
      result.push(head)
    } else {
      this.forEach((v, i, a) => a.toSpliced(i, 1).combinations(head.concat(v), result))
    }
    return result
  };

  Date.prototype.inputVal = function () {
    return this.toISOString().slice(0, -1)
  };

  DOMRect.prototype.timestampCSS = function (ts) {
    let result = {
      top: this.y - (ts.height - this.height) * 2 / 3,
      left: this.x + this.width - ts.width + 10,
    }
    if (result.top < 0) result.top = 0
    if (result.left < 0) result.left = 0

    return result
  }

  $.fn.extend({
    sortKey: function (el = this.get(0)) {
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
    withClass: function (clz, add) {
      let fn = 'removeClass'
      if (add) {
        fn = 'addClass'
      }
      this.each(function () { $(this)[fn](clz) })
      return $(this)
    },
    buttonbar: function (el = this.get(0)) {
      return $(el).parents('.table').first().find('.buttonbar')
    },
    click: function (el = this.get(0)) {
      return $(el).trigger('click')
    },
  })

  $.valHooks = {
    ...$.valHooks,
    number: { get: (elem) => elem.value * 1 },
  }

  $('.short-date, .long-date')
    .on('reset-date', '.date', e => $(e.currentTarget)
      .trigger('format', $(e.currentTarget).data(value)))

  // FIXME: do what with it?
  let dateedit = e => $('.template>.timestamp')
    .clone(true, true)
    .appendTo($(document.body)
      .addClass('date-editing'))
    .trigger('activate', [
      $(e.currentTarget).data('value'),
      $(e.currentTarget)
        .parents('.rows[ts], .generation .row[ts]')
        .first()
        .attr('ts'),
      $(e.currentTarget)
        .parents('.row[id]')
        .first()
        .attr('id'),
      $(e.currentTarget).
        get(0)
        .className
        .split(/\s+/)
        .filter(v => v.match(/^.time/))
        .join(' ')])

  $('.short-date')
    .on('format', (e, d = 'Now') => $(e.currentTarget)
      .data('value', d)
      .text(d.replace('T', ' ').replace(/:\d{1,2}(\..+)?Z.*/, '')))
    .on('click', e => {
      if (e.ctrlKey || $(e.currentTarget).parents('.row.selected.editing').length) {
        e.stopPropagation()

        $(document.body).find('>.timestamp').trigger('deactivate')

        dateedit(e).css(e.currentTarget
          .getBoundingClientRect()
          .timestampCSS($(document.body)
            .find('>.timestamp')
            .get(0)
            .getBoundingClientRect()))
      }
    })

  $('select[url]')
    .on('refresh', (e, params = {}) => {
      e.stopPropagation()

      let url = $(e.currentTarget).attr('url')

      $.ajax({
        url: url,
        method: 'GET',
        success: data => $(e.currentTarget).trigger('send', data),
        error: (xhr, status, err) => $('body>.notification').trigger('activate', [
          xhr.status === 403 ? 'debug' : 'error',
          `GET - ${url}`,
          `failed to get resource with statusCode: ${xhr.status}, ${err}`,
        ]),
        ...params,
      })
    })
    .on('send', (e, ...data) => {
      e.stopPropagation()

      let val = $(e.currentTarget).val()

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

      $list.val(val).trigger('sent', data)
    })

  // // EX: using select[url] hooks
  // $('.test-runner')
  //   .on('sending', (e, ...data) =>
  //     console.log('sending:', data.length))
  //   .on('attrs', '>option', (e, data = {}) =>
  //     $(e.currentTarget).text(`attrs: ${data.name}`))
  //   .on('sent', (e, ..._) =>
  //     console.log('sent:', $(e.currentTarget).children().length))
  //   .trigger('refresh')

  $('select.substrate')
    .on('attrs', '>option', (e, s) => $(e.currentTarget)
      .attr('type', s.type)
      .text(`${s.name} | Vendor: ${(s.vendor || { name: 'interim' }).name}`))

  $('select.strains')
    .on('attrs', '>option', (e, s) => $(e.currentTarget)
      .attr({
        gid: (s.generaton || {}).id,
        dtime: s.dtime,
      })
      .text(`${s.name} | ${s.species} | ${s.vendor.name} | ${s.ctime.replace('T', ' ').replace(/:\d{1,2}(\..+)?Z.*/, '')}`))

  $('select.vendor, select.ingredients, select.stages')
    .on('attrs', '>option', (e, v) => $(e.currentTarget).text(v.name))

  $(document)
    .on('mouseover', '[hover]>div', e => {
      let $t = $(e.currentTarget)
      $t
        .data('hover-text', $('<div>')
          .appendTo($t)
          .addClass('hover-text')
          .text($t.attr('hover') || $t.parent().attr('hover'))
          .css({
            // 'x': e.clientX,
            // 'y': e.clientY,
          }))
    })
    .on('mouseout', '[hover]>div', e => $(e.currentTarget)
      .data('hover-text')
      .remove())
    .on('keyup', 'body.alerting', e => {
      switch (e.which) {
        case 27: return $(document.body)
          .find('>.alert')
          .trigger('deactivate', 'cancel (kbd)')
        case 13: return $(document.body)
          .find('>.alert')
          .trigger('deactivate', 'ok (kbd)')
      }
    })
    .on('keyup', 'body.date-editing', e => {
      switch (e.which) {
        case 27: return $(document.body)
          .find('>.timestamp')
          .trigger('deactivate')
        case 13: return $(document.body)
          .find('>.timestamp>.buttons>.update')
          .trigger('click')
      }
    })
})
