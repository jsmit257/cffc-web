$(_ => $('.main>.workspace>.imgbox')

  // ingress/egress
  .on('activate', (e, ok, cancel) => $(e.currentTarget)
    .data({
      callback: ok || (s => console.log('url length:', s)),
      cancel: cancel || (s => console.log('cancelled:', s)),
      client: $('.main>.workspace')
        .find('>.active')
        .removeClass('active')
        .first()
    })
    .addClass('active')
    .find('>.gallery')
    .empty())
  .on('ok', (e, src) => $(e.currentTarget)
    .trigger('deactivate')
    .data('callback')
    (src))
  .on('cancel', (e, err) => $(e.currentTarget)
    .trigger('deactivate')
    .data('cancel')
    (err))
  .on('deactivate', (e) => $(e.currentTarget)
    .removeClass('active')
    .data('client')
    .addClass('active'))

  // capture controls
  .on('init', '>.viddevs', e => {
    let $devs = $(e.currentTarget).empty()
    navigator.mediaDevices.enumerateDevices()
      .then(devices => devices
        .filter(dev => dev.kind === "videoinput")
        .forEach(dev => $('<div>')
          .addClass('viddev')
          .attr('id', dev.deviceId)
          .text(dev.label || `Camera ${$devs.children().length}`)
          .appendTo($devs)))
      .catch(alert)
      .finally(_ => $devs.children().length || $('<div>')
        .addClass('viddev retry')
        .attr('id', 'retry')
        .text('try again')
        .appendTo($devs))
  })
  .on('click', '>.viddevs>.viddev.retry', e =>
    $(e.currentTarget).parent().trigger('init'))
  .on('click', '>.viddevs>.viddev.selected', e => $(e.delegateTarget)
    .hasClass('capturing')
    ? $(e.delegateTarget).find('>.vidcap').trigger('stop')
    : $(e.currentTarget).removeClass('selected').trigger('click'))
  .on('click', '>.viddevs>.viddev:not(.selected)', async e => {
    $(e.currentTarget)
      .parent()
      .find('>.selected')
      .removeClass('selected')

    $(e.currentTarget).addClass('selected')

    let cam = $(e.delegateTarget)
      .find('>.vidcap')
      .trigger('stop') // removes 'capturing' and adds 'waiting'
      .get(0)

    try {
      cam.srcObject = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: e.currentTarget.id
        },
      })
      $(e.delegateTarget).removeClass('waiting').addClass('capturing')
      cam.requestFullscreen()
    } catch (ex) {
      console.log('getUserMedia', ex)
    }
  })

  // capture events
  .on('click', '.vidcap', e => {
    let $imgbox = $(e.delegateTarget)
    $imgbox.find('.imgedit').trigger('send', e.currentTarget)
    $imgbox.find('>.viddevs>.selected').trigger('click')

    document.fullscreenElement && document.exitFullscreen()
  })
  .on('stop', '>.vidcap', e => {
    $(e.delegateTarget).addClass('waiting').removeClass('capturing')

    let src = e.currentTarget.srcObject
    if (src == null) {
      return
    } else try {
      src.getTracks().forEach(track => track.stop())
    } catch (ex) {
      console.log('error closing camera tracks', ex)
    }

    e.currentTarget.srcObject = null
  })

  // editor actions
  .on('send', '>.imgedit', (e, src) => {
    let $view = $(e.currentTarget).find('.viewport')
    let pic = $view.find('>canvas').get(0)
    pic.width = src.videoWidth
    pic.height = src.videoHeight
    pic.getContext('2d').drawImage(src, 0, 0)

    $view.css('background-image', `url(${pic.toDataURL('image/png', 1)})`)

    $(e.currentTarget)
      .find('#zoom, #resize')
      .val(100)
      .trigger('change')
  })
  .on('crop', '>.imgedit', e => {
    let view = e.currentTarget.querySelector('.viewport')
    let pic = view.querySelector('canvas')
    let scale = pic.clientWidth / pic.width
    let css = view.style
    let crop = {
      x: -css.backgroundPositionX * scale, // something about clientWidth and scrollLeft
      y: -css.backgroundPositionY * scale,
      w: pic.width * scale,
      h: pic.height * scale,
    }

    console.log(crop)
    // pic.drawImage(pic, crop.x, crop.y, crop.x + crop.w, crop.y + crop.h, 0, 0, crop.w, crop.h)
    // pic.width = crop.w
    // pic.height = crop.h
    // // adjust css width/height?
  })
  .on('resize', '>.imgedit', e => { })
  .on('zoom', '>.imgedit', (e, pct) => {
    let scale = pct / 100.0
    let pic = $(e.currentTarget)
      .find('>.viewport>canvas')
      .get(0)

    pic.style.height = `${pic.height * scale}px`
    pic.style.width = `${pic.width * scale}px`
  })
  .on('change', '>.imgedit>#zoom', e => $(e.currentTarget.parentNode)
    .trigger('zoom', e.currentTarget.value))
  .on('mouseover', '>.imgedit>.crop', e => $(e.currentTarget)
    .parent()
    .addClass('cropping'))
  .on('mouseout', '>.imgedit>.crop', e => $(e.currentTarget)
    .parent()
    .removeClass('cropping'))
  .on('click', '>.imgedit>.crop.active', e => $(e.currentTarget)
    .parent()
    .trigger('crop'))
  .on('click', '>.imgedit>.ok.active', e => $(e.delegateTarget)
    .trigger('ok', $(e.currentTarget)
      .parent()
      .find('>.viewport>canvas')
      .get(0)
      .toDataURL('image/png', 1)))
  .on('click', '>.imgedit>.cancel.active', e => $(e.delegateTarget)
    .trigger('cancel', 'user requested cancel event'))
  .on('click', '.imgedit>.viewport>canvas', e => $(e.delegateTarget)
    .find('>.gallery')
    .trigger('create', e.currentTarget))

  // gallery stuff
  .on('create', '>.gallery', (e, src) => $('<div>')
    .append($('<img>')
      .attr('src', src.toDataURL('image/png', 1)))
    .prependTo($(e.currentTarget)))
  .on('click', '>.gallery>.img', e => { })

  // get started
  .find('>.viddevs')
  .trigger('init'))

function camera() {
  $('.main>.workspace>.imgbox')
    .trigger('activate',
      src => console.log('image length', src.length)) // real callback would do something with the data
}

function uncamera() {
  $('.main>.workspace>.imgbox').trigger('deactivate', 'hello world!')
}
