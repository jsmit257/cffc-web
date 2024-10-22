$(_ => {
  $('body>.main>.workspace>.album')
    .on('activate', e => $.ajax({
      url: '/album',
      method: 'GET',
      async: true,
      success: (html, status, xhr) => {
        let $a = $(e.currentTarget)
          .empty()

        $(new DOMParser().parseFromString(html, 'text/html'))
          .find('pre>a:not([href="../"])')
          .each((_, v) => $('<div>')
            .appendTo($a)
            .append($('<img>')
              .addClass('thumbnail')
              .attr('src', `/album/${v.getAttribute('href')}`)))
      },
      error: console.log,
    }))
    .on('click', '.thumbnail', e => $('body>div.imageview')
      .trigger('activate', $(e.currentTarget).attr('src')))
})