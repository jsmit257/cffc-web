(_ => {
  $('body>.main>.workspace>.album')
    .on('activate', e => fetch('/album', {
      method: 'GET',
    }).then(async (resp) => {
      if (resp.status !== 200) {
        throw {
          sc: resp.status,
          msg: 'other stuff',
        }
      }
      return await resp.text()
    }).then(html => {
      let $a = $(e.currentTarget)
        .empty()

      $(new DOMParser().parseFromString(html, 'text/html'))
        .find('pre>a:not([href="../"])')
        .each((_, v) => $('<div>')
          .appendTo($a)
          .append($('<img>')
            .addClass('thumbnail')
            .attr('src', `/album/${v.getAttribute('href')}`)))
    }).catch(err => console.log('error', err)))
    .on('click', '.thumbnail', e => $('body>div.imageview')
      .trigger('activate', $(e.currentTarget).attr('src')))
})()