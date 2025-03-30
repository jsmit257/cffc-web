(_ => {
  let ws = '.main>.workspace.album'
  let table = `${ws}>.table.album`
  let record = `${table}>.rows>.row.record`
  let img = `${record}>img`

  $(document.body)
    .on('activate', `>${ws}`, e => {
      e.stopPropagation()

      console.log('activating')
    })
    .on('fetch', `>${table}`, (e, resolve = _ => _) => {
      e.stopPropagation()

      // using nginx autoindex output for now, so no default fetch, but
      // table `send` is still useful, with a little finesse
      fetch('/album', { method: 'GET', }).then(async (resp) => {
        if (resp.status !== 200) throw {
          sc: resp.status,
          msg: 'other stuff',
        }
        return await resp.text()
      }).then(html => $(new DOMParser().parseFromString(html, 'text/html'))
        .find('pre>a:not([href="../"])')
        .map((_, v) => {
          return { id: v.getAttribute('href') }
        })
      ).then(data => $(e.currentTarget).find('>.rows')
        .trigger('clear')
        .trigger('send', data)
      ).catch(err => console.log('error', err))
    })
    .on('unmarshal', `>${record}`, (e, data) => {
      e.stopPropagation()

      $(e.currentTarget).find('>.thumbnail').attr('src', `album/${data.id}`)
    })
    .on('click', `>${img}`, e => {
      e.stopPropagation()

      console.log('what do we do with:', $(e.currentTarget).attr('src'))
    })
})()
