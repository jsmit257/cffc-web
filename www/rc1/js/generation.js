(_ => {
  let ws = '.main>.workspace.generation'
  let table = `${ws}>.table.generation`
  let ndx = `${table}>.rows.ndx`
  let ndxrows = `${ndx}>.row`
  let gen = `${table}>.singleton.generation`
  let gensrc = `${gen}>.table.sources`
  let gensrcrows = `${gensrc}>.rows>.row.record`
  let events = `${table}>.child-table>.events>.rows`
  let eventrows = `${events}>.row.record`

  $(document.body)
    .on('activate', `>${ws}`, e => {
      e.stopPropagation()

      $(e.currentTarget) // create events
        .find('>.table.generation>.events')
        .trigger('add-child')
    })
    .on('click', `>${ndxrows}:not(.selected)`, e => {
      e.stopPropagation()

      let url = `generation/${$(e.currentTarget).data('id')}`
      fetch(url)
        .then(async resp => await resp.json())
        .then(json => $(`body>${gen}`)
          .data(json)
          .trigger('render-record', json)
          .data('events') || [])
        .then(evts => {
          $(`body>${eventrows}`).remove()
          $(`body>${events}`).trigger('send', evts)
        })
        .catch(ex => $('.notification').trigger('app-error', [
          `fetching index rows '${url}`,
          ex,
        ]))
    })

    .on('render-record', `>${gensrcrows}`, (e, data) => {
      e.stopPropagation()

      if ($('[name="post-param"]')
        .val(data.lifecycle ? 'event' : 'strain')
        .val() === 'event') $(e.currentTarget)
          .find('>label>select[name="event"]')
          .trigger('send', data.lifecycle.events)
          .val(data.lifecycle.events[0].id)

      // $(e.currentTarget)
      //   .find('>label>input, >label>select')
      //   .trigger('change')
    })

    // called from tablejs's render-record: div.trigger(format, v) when render=sources
    .on('sources', `>${ndxrows}>.sources`, (e, ...sources) => {
      e.stopPropagation()

      $(e.currentTarget).text($(sources)
        .map((_, v) => v.strain.name)
        .get()
        .join(' + ') || 'None')
    })
    .on('sources', `>${gen}>.sources`, (e, ...sources) => {
      e.stopPropagation()

      $(`body>${gensrcrows}`).remove()

      $(e.currentTarget)
        .find('>.rows')
        .send(sources)
        .find('.row:not(.x-template) input, .row:not(.x-template) select')
        .trigger('change')
    })
})()