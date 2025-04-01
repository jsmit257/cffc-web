(_ => {
  let ws = '.main>.workspace.album'
  let table = `${ws}>.table.album`
  let record = `${table}>.rows>.row.record`
  let img = `${record}>img`

  $(document.body)
    .on('activate', `>${ws}`, e => {
      e.stopPropagation()

      // console.log('activating album/gallery')
    })
    .on('fetch', `>${table}`, (e, resolve) => {
      e.stopPropagation()

      // using nginx autoindex output for now, so no default fetch, but
      // table `send` is still useful, with a little finesse
      fetch('album').then(async (resp) => {
        if (resp.status !== 200) throw {
          sc: resp.status,
          messsage: resp.text(),
        }
        return await resp.text()
      }).then(html => $(new DOMParser().parseFromString(html, 'text/html'))
        .find('pre>a:not([href="../"])')
        .map((_, v) => { return { id: v.getAttribute('href') } })
      ).then(data => $(e.currentTarget).find('>.rows')
        .trigger('clear')
        .trigger('send', data)
      ).catch(ex => $(e.currentTarget).notify('error',
        `GET album statusCode: ${ex.status ?? 'unsent'}`,
        ex,
      ))
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
