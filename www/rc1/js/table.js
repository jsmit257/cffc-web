$(_ => {
  $(document.body)
    // initialize tables
    .on('fetch', '.table[x-fetch]', (e, id) => {
      e.stopPropagation()

      let url = e.currentTarget.attributes['x-fetch'].value

      fetch(url)
        .then(async resp => {
          let $target = $(e.currentTarget)
            .find(e.currentTarget.attributes['x-target'].value)

          $target.find('.row:not(.x-template)').remove()
          $target
            .trigger('send', await resp.json())
            .find(`#${id}`)
            .trigger('select')
        })
        .catch(ex => $('.notification').trigger('alert', [
          `fetching table data: '${url}'`,
          ex,
        ]))
    })
    .on('send', '.table .rows', (e, ...data) => {
      e.stopPropagation()

      let $tmpl = $(e.currentTarget).find('.row.x-template')

      data.forEach(record => $tmpl
        .clone(true, true)
        .toggleClass('x-template record')
        .data(record)
        .attr({
          id: record.id,
          dtime: record.dtime,
        })
        .insertBefore($tmpl)
        .trigger('render-record', record))
    })
    .on('render-record', '.table>.rows>.row.record, .singleton', (e, data) => {
      let $row = $(e.currentTarget)

      Object.keys(data).forEach(k => {
        let v = data[k]
        let $fld = $row.find(`>.field>[name="${k}"], >[name="${k}"]`)

        switch (($fld.get(0) || { nodeName: 'x-none' }).nodeName.toLowerCase()) {
          case 'select':
            $fld.trigger('send', [v])
            if (v.id) {
              v = v.id
            }
            break
          case 'button':
            break
          case 'div':
            $fld.trigger("format", [v])
            return
          case 'x-none':
            // console.log('x-none', k, 'value', v)
            break
          default:
          // console.log('default', nodeName, 'key', k, 'value', v)
        }

        $fld.val(v)
      })

      $row.find('input, select').trigger('change')
    })


    // initialize other lists
    .on('fetch', 'datalist[x-fetch], select[x-fetch]', e => {
      e.stopPropagation()

      fetch(e.currentTarget.attributes['x-fetch'].value)
        .then(async resp => {
          $(e.currentTarget).trigger('send', await resp.json())
        })
        .catch(ex => $('').trigger('alert'))
    })
    .on('send', 'datalist', (e, ...data) => {
      e.stopPropagation()

      $(e.currentTarget).empty()

      data.forEach(name => $('<option>')
        .val(name)
        .appendTo(e.currentTarget))
    })
    .on('send', 'select', e => // so static lists don't bubble up
      e.stopPropagation())
    .on('send', 'select[x-fetch], select[x-fetch-multi]', (e, ...data) => {
      e.stopPropagation()

      $(e.currentTarget).empty()

      data.forEach(record => $('<option>')
        .data(record)
        .val(record.id)
        .appendTo(e.currentTarget)
        .trigger('extend', record))
    })
    .on('send', 'input[type="radio"]', (e, opt) => $(e.currentTarget)
      .filter((i, v) => v.value === opt)
      .click())
    // custom select render options per-entity type
    .on('extend', 'select[render="x-basic"]>option', (e, data) => $(e.currentTarget)
      .text(data))
    .on('extend', 'select[render-attr]>option', (e, data) => $(e.currentTarget)
      .text(data[$(e.currentTarget).parent().attr('render-attr')]))
    .on('extend', 'select[render="strain"]>option', (e, data) => $(e.currentTarget)
      .text(`${data.name} | ${data.species} | ${data.vendor.name} | ${data.ctime
        .replace('T', ' ')
        .replace(/:\d{1,2}(\..+)?Z.*/, '')}`))
    .on('extend', 'select[render="substrate"]>option', (e, data) => $(e.currentTarget)
      .text(`${data.name} | Vendor: ${(data.vendor || { name: 'interim' }).name}`))
    .on('extend', 'select[render="lifecycle"]>option', (e, data) => $(e.currentTarget)
      .text(data.location))
    .on('extend', 'select[render="event"]>option', (e, data) => $(e.currentTarget)
      .text(data.id))


    // the select suite
    .on('select', '.row.record', e => {
      e.stopPropagation()

      $(e.currentTarget.parentNode).find('.selected').removeClass('selected')
      $(e.currentTarget).addClass('selected')

      // TODO: events from one of generations and lifecycles will clobber the other one's history
      console.log(new Error())
      localStorage[$(e.currentTarget).parents('[breadcrumb]').first().attr('breadcrumb')] = e.currentTarget.id
    })
    .on('click', '.row.record:not(.selected)', e => $(e.currentTarget)
      .trigger('select'))


    // update actions
    .on('new-row', '.table .rows', e => {
      $row.find('>.field>[x-fetch]').trigger('fetch')
    })
    .on('edit-row', '.table .rows>.row', e => {
      $row.find('>.field>[x-fetch]').trigger('fetch')
    })
    .on('remove-row', '.table .rows>.row', e => {
      // $row.find('>.field>[x-fetch]').trigger('fetch')
    })


    // UI actions
    .on('select', '.table .rows>.row', e => { })
    .on('sort', '.table', e => { })
})