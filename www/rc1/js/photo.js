(_ => {
  const ws = '.child-table.photo'
  const table = `${ws}>.table.photo`
  const editable = `${table}.detail, ${table}.detail>.rows>.row.selected`
  const photorow = `${table}>.rows>.row.record`
  const tile = `${photorow}>.imgtile`
  const rowbtn = `${photorow}>.rowbar>.button`
  const note = `${table}>.child-table.note>.table.note`

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

      // // https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/observe#monitoring_attribute_values
      // new MutationObserver((mutationList, observer) => {
      //   for (const mutation of mutationList) {
      //     // if (mutation.removedNodes.length) {
      //     //   console.log(new Error('debug').stack)
      //     //   debugger
      //     // }
      //     if (mutation.type === 'attributes') {
      //       // source was changed
      //     }
      //   }
      // }).observe($(`${photo}>.rows`).get(0), {
      //   // childList: true,
      //   attributeFilter: ['src'],
      // })
    })
    .on('select', photorow, e => {
      e.stopPropagation()

      const breadbase = $(e.currentTarget).parents('[breadcrumb]').attr('breadcrumb'),
        id = e.currentTarget.id

      $(note).attr({
        breadcrumb: `${breadbase}/${id}/note`,
        'x-fetch': `notes/${id}`,
      })
    })
    .on('click', photorow, e => {
      e.stopPropagation()

      $(e.currentTarget)
        .parents('.gallery')
        .first()
        .toggleClass('detail gallery')

      $(e.currentTarget)
        .find('>.rowbar>.cancel')
        .toggleClass('cancel edit')
        .attr('title', 'edit')
    })
    .on('click', `${table}.detail>.rows>.selected>.imgtile`, e => {
      e.stopPropagation()
      $(e.currentTarget).trigger('imgtile-zoom')
    })

    .on('click', `${rowbtn}.back`, e => {
      e.stopPropagation()

      const $table = $(e.currentTarget)
        .parents(editable)
        .removeClass('editing')
        .last() // list is indexed in the order they're encountered
        .toggleClass('detail gallery')

      if ($table.hasClass('adding')) {
        $table.removeClass('adding')
        e.currentTarget.parentNode.parentNode.remove()
      }
    })
    .on('click', `${rowbtn}.state`, e => {
      e.stopPropagation()

      $(e.currentTarget)
        .toggleClass('edit cancel')
        .parents(editable)
        .toggleClass('editing')
    })
    .on('click', `${rowbtn}.edit`, e => {
      e.stopPropagation()

      $(e.currentTarget).attr('title', 'cancel')
    })
    .on('click', `${rowbtn}.cancel`, e => {
      e.stopPropagation()

      const $table = $(e.currentTarget)
        .attr('title', 'edit')
        .parents('.detail')
        .first()

      if ($table.hasClass('adding')) {
        $table.toggleClass('detail gallery editing adding')
        $(e.currentTarget.parentNode.parentNode).remove()
      }
    })
    .on('click', `${rowbtn}.delete`, e => {
      e.stopPropagation()

      const $row = $(e.currentTarget.parentNode.parentNode),
        $table = $row.parents('.detail').first()

      if ($table.hasClass('adding')) {
        $(e.currentTarget).siblings('.cancel').click()
        return
      }

      const url = `${$table.attr('x-fetch')}/${$row.attr('id')}`
      fetch(url, { method: 'DELETE' })
        .then(async resp => {
          if (resp.status !== 200) throw {
            status: resp.status,
            message: await resp.text()
          }
          return await resp.json()
        })
        .then(_ => $table.toggleClass('detail gallery'))
        .then(_ => $row.remove())
        .catch(ex => $(e.currentTarget).notify('error', `DELETE ${url}`, ex))
    })
    .on('click', `${table}>.buttonbar>.add`, e => {
      e.stopPropagation()

      $(e.currentTarget.parentNode.parentNode)
        .toggleClass('gallery detail')
        .find('>.rows')
        .trigger('new-record', $row => $row
          // this is a hack b/c new-record sets editing on and state::click 
          // toggles it off, so unset it and let state::click toggle it back on
          .removeClass('editing')
          .find('>.rowbar>.state')
          .click())

      // more hacking, all because of stete::click
      $(e.currentTarget.parentNode.parentNode).addClass('editing')
    })
    .on('fetch', photorow, (e, { url, method, file }) => {
      e.stopPropagation()

      const $row = $(e.currentTarget),
        format = $row.find('>.format>select').val().replace(/original/, file.type)

      $(document.body).trigger('blob-convert', {
        blob: file,
        format: format,
        scale: $row.find('>.scale>input').val() / 100.0,
        cb: blob => fetch(url, {
          method: method,
          body: (form => (form.append('file', new File([blob], `image.${format}`, {
            type: blob.type,
            lastModified: file.lastModified,
          })), form))(new FormData()),
        }).then(async resp => {
          switch (resp.status) {
            case 200:
            case 201: return await resp.json()
            default: throw {
              status: resp.status,
              message: await resp.text(),
            }
          }
        }).then(json => $row.data(json[0])
          .trigger('unmarshal')
          .removeClass('editing adding')
          .find('>.rowbar>.cancel')
          .toggleClass('cancel edit')
          .attr('title', 'edit')
        ).catch(ex => $(e.currentTarget).notify('error', `${method} ${url}`, ex))
      })
    })
    .on('change', `${photorow}>.imaging>.photo`, e => {
      e.stopPropagation()

      if (!e.currentTarget.files.length) {
        return
      }

      const id = e.currentTarget.parentNode.parentNode.id,
        files = Array.from(e.currentTarget.files),
        $table = $(e.currentTarget).parents('[x-fetch]').first()

      e.currentTarget.value = null

      let method = 'POST',
        url = $table.attr('x-fetch')

      const updates = files.slice(1).map(file =>
        (args => _ => $table.find('>.rows').trigger(
          'new-record',
          $newrow => $newrow.trigger('fetch', args),
        ))({ url, method, file })
      )

      const $row = $(e.currentTarget).parents('.row.record')

      if (id) {
        url = `${url}/${id}`
        method = 'PATCH'
      }

      updates.unshift(_ => $row.trigger('fetch', {
        url,
        method,
        file: files[0],
      }))

      updates.forEach(update => update())

      $table.removeClass('editing adding')
    })
    .on('click', `${photorow}>.imaging.camera`, e => {
      e.stopPropagation()

      const $row = $(e.currentTarget.parentNode),
        $img = $row.find('>.imgtile>.image')

      $('body>.menubar').trigger('camera', {
        fetchurl: `${$row
          .parents('[x-fetch]')
          .first()
          .attr('x-fetch')}/${$row.attr('id')}`
          .replace(/\/undefined$/, ''),
        method: $row.hasClass('adding') ? "POST" : "PATCH",
        img: $img.attr('src') && $img.get(0),
        success: (...photos) => $row
          .data(photos[0])
          .trigger('disable-record') // this is bubbling up to the table
          .find('>.rowbar>.cancel')
          .toggleClass('cancel edit')
          .attr('title', 'edit'),
      })
    })
})()