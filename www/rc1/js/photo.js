(_ => {
  let ws = '.child-table.photos'
  let photo = `${ws}>.table.photos`
  let photorow = `${photo}>.rows>.row.record`
  let image = `${photorow}>.imgtile>.image`
  let rowbtn = `${photorow}>.rowbar>.button`
  let note = `${photo}>child-table.notes>.table.notes`

  $(document.body)
    .on('activate', ws, e => {
      e.stopPropagation()
      console.log('activating photos')
      $(`body>${strain}>[x-child]`).trigger('add-child')
    })
    .on('click', `${photorow}`, e => {
      e.stopPropagation()

      let $table = $(e.currentTarget.parentNode.parentNode)

      if ($table.hasClass('gallery')) {
        $table.toggleClass('detail gallery')
      }
    })

    .on('unmarshal', photorow, (e, data) => {
      e.stopPropagation()

      $(e.currentTarget)
        .find('>.imgtile>.image')
        .attr('src', `/album/${data.image}`)
    })

    .on('click', `${rowbtn}.back`, e => {
      e.stopPropagation()

      let $table = $(e.currentTarget)
        .parents('.detail')
        .first()
        .toggleClass('detail gallery')

      if ($table.hasClass('gallery')) {

      }
    })
    .on('click', `${rowbtn}.cancel`, e => {
      e.stopPropagation()

      if ($(e.currentTarget.parentNode.parentNode).hasClass('adding')) {
        // this selector isn't anchored to anything because the row is 
        // already removed and we can't get to its (ex-)parent any other 
        // way; unlikely to be a problem, but worth a note just in case
        $(photo).toggleClass('gallery detail')
      }
    })
    .on('click', `${rowbtn}.action`, e => {
      e.stopPropagation()

      let $btn = $(e.currentTarget)
      let $row = $(e.currentTarget.parentNode.parentNode)
      let method = $btn.hasClass('delete')
        ? 'DELETE'
        : $row.hasClass('adding')
          ? "POST"
          : "PATCH"
      let body

      if ($row.hasClass('editing')) {
        let file = $row.find('>.imaging>.photo').get(0).files[0]
        body = new FormData()
        body.append('file', file, file.name)
      }

      let url = `${$row.parents('[x-fetch]')
        .first()
        .attr('x-fetch')}/${$row.attr('id')}`.replace(/\/undefined$/, '')
      fetch(url, { method, body }).then(async resp => {
        if (resp.error) throw {
          status: resp.status,
          message: await resp.text()
        }
        return await resp.json()
      }).then(json => $row.data(json[0]).trigger('disable-record')
      ).then($row => $row.find('>.rowbar').trigger('toggle')
      ).catch(ex => $(e.currentTarget).notify('error',
        `${method} ${url} statusCode: ${ex.status ?? 'unsent'}`,
        ex,
      )).finally(_ => method === 'DELETE'
        && $(e.currentTarget)
          .parents('.detail')
          .toggleClass('gallery detail')
          .selected()
          .trigger('remove-record'))
    })
    .on('click', `${photo}>.buttonbar>.add`, e => {
      e.stopPropagation()

      $(e.currentTarget.parentNode.parentNode)
        .toggleClass('gallery detail')
        .find('>.rows')
        .first()
        .trigger('new-record')
        .find('>.selected>.rowbar')
        .trigger('toggle')
    })
    .on('click', `${photorow}>.camera`, e => {
      e.stopPropagation()

      console.log('heres where the fun starts')
    })
})()