(_ => {
  let srctable = '.workspace.sources>.table.sources'
  let srcrows = `${srctable}>.rows>.row.record`

  $(document.body)
    .on('change', `${srctable}>.rows>.origin-filter>label>[name="type"]`, e => {
      e.stopPropagation()

      $(e.currentTarget)
        .parents('.rows')
        .first()
        .attr('source-type', e.currentTarget.value.toLowerCase())
    })
    .on('change', `${srctable}>.rows>.row.record>label>[radio-group="origin"]`, e => {
      e.stopPropagation()

      if (e.currentTarget.checked) $(e.currentTarget)
        .parents('.row.record')
        .first()
        .attr('origin', e.currentTarget.value)
    })
    .on('change', `${srcrows}>.field>[name="lifecycle"]`, e => {
      e.stopPropagation()

      let $sel = $(e.currentTarget).find('>option:selected')
      if ($sel.length === 0) {
        // $(e.currentTarget).notify('debug', 'changing lifecycle', `no lifecycle selected`)
        return
      }
      let data = $sel.data()

      let $row = $(e.currentTarget.parentNode.parentNode)
      $row.find('>.field>[name="event"]').trigger('send', data.events)
      // console.log('data', data, e.target, $row)
      $row.find('>.field>[name="strain"]').val(data.strain.id)
    })
    .on('send', `${srctable}>.rows`, (e, ...data) => {
      e.stopPropagation()

      // console.log(`.withClass(${data.length === 0}, 'empty')`)
      $(e.currentTarget).withClass(data.length === 0, 'empty')
    })
    .on('unmarshal', `${srcrows}`, (e, data) => {
      e.stopPropagation()

      $(e.currentTarget.parentNode)
        .find('>.row.origin-filter>.field>[name="type"]')
        .val(data.type)

      $(e.currentTarget)
        .find('[radio-group="origin"]')
        .attr('name', data.id)

      if ($(e.currentTarget)
        .find(`[radio-group="origin"][value="${data.lifecycle ? 'event' : 'strain'}"]`)
        .prop('checked', true)
        .trigger('change')
        .val() === 'event') {

        $(e.currentTarget)
          .find('>label>select[name="event"]')
          .trigger('send', data.lifecycle.events)
          .val(data.lifecycle.events[0].id)
      }
    })
    .on('post-data', `${srcrows}.selected`, (e, cfg) => {
      e.stopPropagation()

      let endpoint = $(e.currentTarget)
        .find(`input[name="${e.currentTarget.id}"]:checked`)
        .val()

      let genid = $(e.currentTarget)
        .parents('.workspace')
        .first()
        .prev('.singleton')
        .attr('id')

      cfg._url = `generatation/${genid}/sources/${endpoint}`
      cfg.data = {
        type: $(e.currentTarget.parentNode)
          .find('>.origin-filter>label>[name="type"]').val(),
      }

      $(e.currentTarget).trigger('marshal', cfg.data)
      delete cfg.data.lifecycle
      delete cfg.data[e.currentTarget.id]

      if (endpoint === 'event') {
        delete cfg.data.strain
      } else {
        delete cfg.data.event
      }
    })

    // rowbar buttons
    .on('click', `${srcrows}>.rowbar>.control`, e => { // edit or cancel
      e.stopPropagation()

      let $row = $(e.currentTarget)
        .toggleClass('edit cancel')
        .parents('.row.record')
        .first()
        .toggleClass('editing')
        .trigger('select')

      if ($row
        .parents('.table.sources')
        .toggleClass('editing')
        .hasClass('editing')
      ) {
        $row.find('[x-fetch]').trigger('fetch')
        $row.find('[name="lifecycle"]').trigger('change')
      } else {
        $row
          .parents('.table.sources')
          .removeClass('adding')
      }
    })
    .on('click', `${srcrows}:not(.adding)>.rowbar>.cancel`, e => { // implies editing
      e.stopPropagation()

      let $row = $(e.currentTarget.parentNode.parentNode)

      $row.trigger('unmarshal', $row.data())
    })
    .on('click', `${srcrows}.adding>.rowbar>.cancel`, e => {
      e.stopPropagation()

      e.currentTarget
        .parentNode
        .parentNode
        .remove()
    })
    .on('click', `${srcrows}:not(.editing)>.rowbar>.action`, e => { // remove
      e.stopPropagation()

      let genid = $(e.currentTarget)
        .parents('.table.generation')
        .first()
        .selected()
        .attr('id')

      let $row = $(e.currentTarget
        .parentNode
        .parentNode)
        .addClass('selected')
      let url = `generation/${genid}/sources/${$row.attr('id')}`

      $row.trigger('default-remove', url)
    })
    .on('click', `${srcrows}.editing:not(.adding)>.rowbar>.action`, e => {
      e.stopPropagation()

      let genid = $(e.currentTarget)
        .parents('.table.generation')
        .first()
        .selected()
        .attr('id')
      let body = {}
      let $row = $(e.currentTarget.parentNode.parentNode)
        .trigger('marshal', body)
      let origin = $row.find('[radio-group="origin"]:checked').val()
      let url = `generation/${genid}/sources/${origin}/${$row.attr('id')}`
        .replace(/\/undefined$/, '')
      let params = {
        method: body.id ? 'PATCH' : 'POST',
        body: {
          type: $(e.currentTarget.parentNode.parentNode.parentNode)
            .find('>.origin-filter>.field>[name="type"]')
            .val(),
          ...body,
        },
      }

      // console.log('default-update', url, params)
      $row
        .trigger('default-update', [url, params])
        .find('>.rowbar>.control')
        .toggleClass('cancel edit')
    })
    .on('click', `${srcrows}.adding>.rowbar>.action`, e => {
      e.stopPropagation()

      let $row = $(e.currentTarget.parentNode.parentNode)
        .removeClass('adding')

      $row.parents('.adding')
        .first()
        .removeClass('adding')

      $(e.currentTarget).trigger('click')
    })

    // add a source
    .on('click', `${srctable}>.rows>.buttonbar>.add`, e => {
      e.stopPropagation()

      let $rows = $(e.currentTarget.parentNode.parentNode)
      let $row = $rows
        .trigger('new-record')
        .find('>.selected')
        .addClass('editing') // this should've been set by 'enable-record'
        .insertAfter($rows.find('>.origin-filter'))
      $row.find('input[value="event"]').click()
      $row.find('>.rowbar>.control').toggleClass('edit cancel')

      // FIXME: for testing, for the moment
      $row.find('select[name="event"]').trigger('send', {
        id: '1',
        mtime: new Date().toISOString(),
        event_type: {
          id: 'clone',
          name: 'clone',
        }
      })
      // console.log('adding', $row, $rows)
    })
})()
