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

      try {
        data.forEach(record => $tmpl
          .clone(true, true)
          .toggleClass('x-template record')
          .data(record)
          .attr('id', record.id)
          .insertBefore($tmpl)
          .trigger('render-row'))
      } catch (ex) {
        $('.notification').trigger('app-error', [
          `fetching table data: '${url}'`,
          ex,
        ])
      }
    })
    .on('render-row', '.table>.rows>.row.record', e => {
      let $row = $(e.currentTarget)
      let data = $row.data()

      Object.keys(data).forEach(k => {
        let v = data[k]
        let $fld = $row.find(`>.field>[name="${k}"], >[name="${k}"]`)
        let nodeName

        switch (nodeName = ($fld.get(0) || { nodeName: 'x-none' }).nodeName.toLowerCase()) {
          case 'select':
            try {
              $fld.trigger('send', v)
              if (v.id) {
                v = v.id
              }
            } catch (ex) {
              console.log(ex)
            }
            break
          case 'button':
            break
          case 'div':
            $fld.text(v)
            return
          case 'x-none':
            console.log('x-none', k, 'value', v)
            break
          default:
            console.log('default', nodeName, 'key', k, 'value', v)
        }

        $fld.val(v)
      })
    })
    // type-specific row modifications


    // initialize other lists
    .on('fetch', 'datalist[x-fetch], select[x-fetch]', e => {
      e.stopPropagation()

      fetch(e.currentTarget.attributes['x-fetch'].value)
        .then(async resp => {
          $(e.currentTarget)
            .empty()
            .trigger('send', await resp.json())
        })
        .catch(ex => $('').trigger('alert'))
    })
    .on('send', 'datalist', (e, ...data) => {
      e.stopPropagation()

      data.forEach(name => $('<option>')
        .val(name)
        .appendTo(e.currentTarget))
    })
    .on('send', 'select:not([x-fetch])', e => // so static lists don't bubble up
      e.stopPropagation())
    .on('send', 'select[x-fetch]', (e, ...data) => {
      e.stopPropagation()

      data.forEach(record => $('<option>')
        .data(record)
        .val(record.id)
        .appendTo(e.currentTarget)
        .trigger('extend', record))
    })
    // custom select render options per-entity type
    .on('extend', 'select[render="x-basic"]>option', (e, data) => $(e.currentTarget)
      .text(data))
    .on('extend', 'select[render="stage"]>option', (e, data) => $(e.currentTarget)
      .text(data.name))
    .on('extend', 'select[render="vendor"]>option', (e, data) => $(e.currentTarget)
      .text(data.name))
    .on('extend', 'select[render="eventtype"]>option', (e, data) => $(e.currentTarget)
      .text(data.name))


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