(_ => {
  let ws = '.child-table.photo'
  let photo = `${ws}>.table.photo`
  let photorow = `${photo}>.rows>.row`
  let image = `${photorow}>.imgtile>.image`
  let rowbtn = `${photorow}>.rowbar>.button`
  let note = `${photo}>child-table.note>.table.note`

  $(document.body)
    .on('activate', ws, e => {
      e.stopPropagation()

      const $ws = $(e.currentTarget)
      if ($ws.parent().hasClass('main')) {
        $ws
          .find('>.table.photo')
          .attr('x-fetch', 'photoalbum')
          .trigger('fetch')
      }
    })
    .on('select', photorow, e => {
      e.stopPropagation()

      const breadbase = $(e.currentTarget).parents('[breadcrumb]').attr('breadcrumb'),
        id = e.currentTarget.id,
        breadcrumb = `${breadbase}/${id}/note`

      $(note).attr({
        breadcrumb,
        'x-fetch': `notes/${id}`,
      })
    })
    .on('click', photorow, e => {
      e.stopPropagation()

      $(e.currentTarget)
        .parents('.workspace')
        .first()
        .find('>.gallery')
        .toggleClass('detail gallery')
    })

    .on('click', `${rowbtn}.back`, e => {
      e.stopPropagation()

      $(e.currentTarget.parentNode)
        .find('>.cancel')
        .click()

      $(e.currentTarget.parentNode.parentNode)
        .parents('.detail')
        .first()
        .toggleClass('detail gallery')
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

      let $row = $(e.currentTarget.parentNode),
        $img = $row.find('>.imgtile>.image')

      $('body>.menubar').trigger('camera', {
        fetchurl: `${$row
          .parents('[x-fetch]')
          .first()
          .attr('x-fetch')}/${$row.attr('id')}`
          .replace(/\/undefined$/, ''),
        method: $row.hasClass('adding') ? "POST" : "PATCH",
        img: $img.attr('src') && $img.get(0),
        success: photos => $row
          .data(photos)
          .trigger('disable-record')
          .find('>.rowbar')
          .trigger('toggle'),
      })
    })
})()