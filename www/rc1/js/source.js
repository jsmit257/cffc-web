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

      console.log('this one too?')
    })
    .on('change', `${srctable}>.rows>.row.record>label>[radio-group="origin"]`, e => {
      e.stopPropagation()

      if (e.currentTarget.checked) $(e.currentTarget)
        .parents('.row.record')
        .first()
        .attr('origin', e.currentTarget.value)

      console.log('will i ever get it in one?', e.currentTarget.checked, e.currentTarget.value)
    })
    .on('render-record', `${srcrows}`, (e, data) => {
      e.stopPropagation()

      $(e.currentTarget.parentNode)
        .find('>.row.origin-filter>.field>[name="type"]')
        .val(data.type)
        .prop('disabled', true) // TODO: only gets cleared when all records are deleted

      $(e.currentTarget)
        .find('[radio-group="origin"]')
        .attr('name', data.id)

      if ($(e.currentTarget)
        .find(`[radio-group="origin"][value="${data.lifecycle ? 'event' : 'strain'}"]`)
        .prop('checked', true)
        .val() === 'event') {

        // disable strain
        $(e.currentTarget)
          .find('>label>select[name="event"]')
          .trigger('send', data.lifecycle.events)
          .val(data.lifecycle.events[0].id)
      } // else enable strain

      // $(e.currentTarget)
      //   .find('>label>input, >label>select')
      //   .trigger('change')
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
})()
