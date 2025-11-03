(_ => {
  let ws = '.child-table.photos'
  let photo = `${ws}>.table.photos`
  let photorow = `${photo}>.rows>.row`
  let image = `${photorow}>.imgtile>.image`
  let rowbtn = `${photorow}>.rowbar>.button`
  let note = `${photo}>child-table.notes>.table.notes`

  $(document.body)
    .on('activate', ws, e => {
      e.stopPropagation()

      $(e.currentTarget).find('[x-child]').trigger('add-child', $ws => {
        let photoid = sessionStorage[`photos/${sessionStorage.strain}`]
        let breadcrumb = `notes/${photoid}`
        $ws.find('>.table.notes').attr({
          breadcrumb,
          'x-fetch': breadcrumb,
        })
      })
    })
    .on('select', photorow, e => {
      e.stopPropagation()

      let breadcrumb = `notes/${$(e.currentTarget).attr('id')}`
      $(note).attr({
        breadcrumb,
        'x-fetch': breadcrumb,
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

    .on('unmarshal', photorow, (e, data) => {
      e.stopPropagation()

      $(e.currentTarget)
        .find('>.imgtile>.image')
        .attr('src', `/album/${data.image}`)
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

      let $row = $(e.currentTarget.parentNode)

      // console.log('well, that didnt last long', [
      //   `${$row
      //     .parents('[x-fetch]')
      //     .first()
      //     .attr('x-fetch')}/${$row.attr('id')}`
      //     .replace(/\/undefined$/, ''),
      //   $row.hasClass('adding') ? "POST" : "PATCH",
      //   photos => $row.data(photos).trigger('disable-record'),
      // ], $('body>.menubar'))
      $('body>.menubar').trigger('camera', [
        `${$row
          .parents('[x-fetch]')
          .first()
          .attr('x-fetch')}/${$row.attr('id')}`
          .replace(/\/undefined$/, ''),
        $row.hasClass('adding') ? "POST" : "PATCH",
        photos => $row
          .data(photos)
          .trigger('disable-record')
          .find('>.rowbar')
          .trigger('toggle'),
      ])
    })
})()