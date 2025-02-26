$(_ => $('.main>.workspace>.imgbox')

  // ingress/egress
  .on('activate', (e, ok, cancel) => $(e.currentTarget) // do we care if it's already active?
    .data({
      callback: ok || (s => console.log('url length:', s)),
      cancel: cancel || (s => console.log('cancelled:', s)),
      client: $('.main>.workspace')
        .find('>.active')
        .removeClass('active')
    })
    .addClass('active'))
  .on('ok', (e, src) => $(e.currentTarget)
    .trigger('cleanup')
    .data('callback')
    (src))
  .on('cancel', (e, err) => $(e.currentTarget)
    .trigger('cleanup')
    .data('cancel')
    (err))
  .on('deactivate', (e) => $(e.currentTarget)
    // we shouldn't be called from a menu button and we should be more exception-y
    .trigger('cancel', 'camera deactivated unexpectedly')
    .data('client')
    .removeClass('active'))
  .on('cleanup', (e) => {
    let $box = $(e.currentTarget)

    $box.removeClass('active').find('>.audit').empty()
    $box.data('client').addClass('active')
  })

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
      // TODO: consider cleanup and actual error messaging
      console.log('getUserMedia', ex)
    }
  })

  // capture events
  .on('click', '.vidcap', e => {
    let $imgbox = $(e.delegateTarget)
    let w = e.currentTarget.videoWidth, h = e.currentTarget.videoHeight

    $imgbox.find('>.imgedit>.imgstats>.row:not(.template)').remove()
    $imgbox.find('>.audit').empty()
    $imgbox.find('>.imgedit').trigger('snap', [0, 0, w, h, e.currentTarget])
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
  .on('snap', '>.imgedit', (e, x, y, w, h, cam) => {
    let $edit = $(e.currentTarget)
    let $props = $(e.delegateTarget).find('>.props')
    let url = $edit
      .trigger('capture', [x, y, w, h, cam])
      .find('>.viewport>canvas')
      .get(0)
      .toDataURL($props.find('>.format>select').val(),
        $props.find('>.quality>select').val() / 100.0)

    $edit
      .trigger('scale', [w, h, url])
      .trigger('collect', [w, h, url])
      .trigger('reset-range')
      .parent()
      .find('>.audit')
      .trigger('create', url)
  })
  .on('capture', '>.imgedit', (e, x, y, w, h, img) => {
    let pic = $(e.currentTarget).find('>.viewport>canvas').get(0)

    pic.width = w
    pic.height = h
    pic.getContext('2d', { alpha: false }).drawImage(img, x, y)
  })
  .on('scale', '>.imgedit', (e, w, h, url) => {
    let view = $(e.currentTarget).find('>.viewport').get(0)
    let norm = w >= h
      ? view.attributes.hmax.value / w
      : view.attributes.vmax.value / h

    $(view).css({
      width: `${w * norm}px`,
      height: `${h * norm}px`,
      backgroundImage: `url(${url})`,
    })
  })
  .on('collect', '>.imgedit', (e, w, h, url) => {
    let $tmpl = $(e.currentTarget).find('>.imgstats>.row.template')
    let $stat = $tmpl
      .clone(true, true)
      .removeClass('template')
      .insertAfter($tmpl)

    $stat.find('>.width').text(w)
    $stat.find('>.height').text(h)
    $stat.find('>.filesize').text((url.length / 1024).toFixed(2))
  })
  .on('reset-range', '>.imgedit', e => $(e.currentTarget)
    .find('>.ranges')
    .find('#zoom, #resize')
    .val(100)
    .trigger('change'))
  .on('crop', '>.imgedit', e => {
    let view = e.currentTarget.querySelector('.viewport')
    let scale = 100.0 / $(e.currentTarget).find('#zoom').val()
    // // seems like this goes width/height-out-of-bounds
    // console.log('snap', [
    //   -Math.round(view.scrollLeft * scale, 0),
    //   -Math.round(view.scrollTop * scale, 0),
    //   Math.round(view.offsetWidth * scale - 2, 0),// -2 is border-ish?
    //   Math.round(view.offsetHeight * scale - 2, 0),
    //   $(e.delegateTarget).find('>.audit>div:first-child>img').get(0),
    // ])
    $(e.currentTarget).trigger('snap', [
      -Math.round(view.scrollLeft * scale, 0),
      -Math.round(view.scrollTop * scale, 0),
      Math.round(view.offsetWidth * scale - 2, 0),// -2 is border-ish?
      Math.round(view.offsetHeight * scale - 2, 0),
      $(e.delegateTarget).find('>.audit>div:first-child>img').get(0),
    ])
  })
  .on('resize', '>.imgedit', e => {
    let scale = $(e.currentTarget).find('#resize').val() / 100.0
    let canvas = e.currentTarget.querySelector('.viewport>canvas'),
      oc = document.createElement('canvas'),
      octx = oc.getContext('2d');

    canvas.width = width; // destination canvas size
    canvas.height = canvas.width * img.height / img.width;

    let cur = {
      w: Math.floor(img.width * scale),
      h: Math.floor(img.height * scale)
    }

    oc.width = cur.w
    oc.height = cur.h

    octx.drawImage(img, 0, 0, cur.w, cur.h);

    while (cur.w * scale > width) {
      cur = {
        w: Math.floor(cur.w * scale),
        h: Math.floor(cur.h * scale)
      }
      octx.drawImage(oc, 0, 0, cur.w * 2, cur.h * 2, 0, 0, cur.w, cur.h)
    }

    canvas
      .getContext("2d")
      .drawImage(oc, 0, 0, cur.w, cur.h, 0, 0, canvas.width, canvas.height)
  })
  .on('zoom', '>.imgedit', (e, pct) => {
    let scale = pct / 100.0
    let pic = $(e.currentTarget)
      .find('>.viewport>canvas')
      .get(0)

    pic.style.height = `${pic.height * scale}px`
    pic.style.width = `${pic.width * scale}px`
  })
  .on('change', '>.imgedit #zoom', e => $(e.currentTarget.parentNode)
    .trigger('zoom', e.currentTarget.value))

  // editor buttons
  .on('click', '>.imgedit .button.crop.active', e => $(e.delegateTarget)
    .find('>.imgedit')
    .trigger('crop'))
  .on('click', '>.imgedit .button.resize.active', e => $(e.delegateTarget)
    .find('>.imgedit')
    .trigger('resize'))

  // hover effects
  .on('mouseover', '.imgedit .button.crop.active', e => $(e.delegateTarget)
    .find('>.imgedit')
    .addClass('cropping'))
  .on('mouseout', '>.imgedit .button.crop.active', e => $(e.delegateTarget)
    .find('>.imgedit')
    .removeClass('cropping'))
  .on('mouseover', '.imgedit .button.resize.active', e => $(e.delegateTarget)
    .find('>.imgedit')
    .addClass('resizing'))
  .on('mouseout', '>.imgedit .button.resize.active', e => $(e.delegateTarget)
    .find('>.imgedit')
    .removeClass('resizing'))

  // window actions
  .on('click', '>.buttonbox>.ok.active', e => $(e.delegateTarget)
    .trigger('ok', $(e.currentTarget)
      .parent()
      .find('>.viewport>canvas')
      .get(0)
      .toDataURL($(e.delegateTarget).find('>.props>.format>select').val(),
        $(e.delegateTarget).find('>.props>.quality>select').val() / 100.0)))
  .on('click', '>.buttonbox>.cancel.active', e => $(e.delegateTarget)
    .trigger('cancel', 'user requested cancel event'))
  .on('click', '>.buttonbox>.reset.active', e => {
    let $imgbox = $(e.delegateTarget),
      first = $imgbox
        .find('>.audit>div')
        .remove()
        .last()
        .find('img')
        .get(0),
      w = first.naturalWidth,
      h = first.naturalHeight

    $imgbox.find('>.imgedit>.imgstats>.row:not(.template)').remove()
    $imgbox.find('>.imgedit').trigger('snap', [0, 0, w, h, first])
  })

  // audit stuff
  .on('create', '>.audit', (e, url) => $('<div>')
    .append($('<img>')
      .attr('src', url))
    .prependTo($(e.currentTarget)))

  // deprecated
  .on('click', '.viewport>canvas', e => {
    let pic = e.currentTarget
    let ctx = pic.getContext('2d')
    let pm = new pixelMap(ctx.getImageData(0, 0, pic.width, pic.height).data)
    pm.draw($('.colormap').empty().get(0))
  })
  .on('click', '>.audit>.img', e => { /** what goes here? */ })

  // get started
  .find('>.viddevs')
  .trigger('init'))

function camera() {
  $('.main>.workspace>.imgbox')
    .trigger('activate',
      src => console.log('image length', src.length)) // real callback would do something with the data
}

function uncamera() {
  $('.main>.workspace>.imgbox').trigger('ok', 'hello world!')
}

function dims() {
  let vp = $('div.viewport').get(0)
  let cnv = vp.querySelector('canvas')
  console.log(
    'viewport', {
    offsetLeft: vp.offsetLeft,
    clientLeft: vp.clientLeft,
    scrollLeft: vp.scrollLeft,
  },
    'canvas', {
    offsetLeft: cnv.offsetLeft,
    clientLeft: cnv.clientLeft,
    scrollLeft: cnv.scrollLeft,
  })
}

function blobbery() {
  let $cnv = $('canvas')
  let cnv = $cnv.get(0)

}

class pixelMap {

  static #msb = 0xfc
  static #foo = 0xff /** max bright */ * 3 /** channels */
  static #fns = {
    toHash: function () { return this.toInt().toString(16) },
    toInt: function () { return (this.r << 16) + (this.g << 8) + this.b },
    toRgb: function () { return `rgb(${this.r},${this.g},${this.b})` },
  }

  static #sort = (l, r) => l.toHash().localeCompare(r.toHash())

  #distinct = {}
  #pxs = []
  #greys = new Array(10).fill(0, 0, 10)
  #count = 0

  constructor(fb) {
    this.#count = fb.length / 4

    let acc = 0
    for (let i = 0; i < fb.length; i += 4) {
      // if (fb[i + 3] !== 0xff) {
      //   throw new Error(fb[i + 3].toString(16))
      // }
      let [r, g, b] = fb.slice(i, i + 3)
      let grey = r + g + b
      let rgb = {
        r: r & pixelMap.#msb,
        g: g & pixelMap.#msb,
        b: b & pixelMap.#msb,
        ...pixelMap.#fns,
      }
      let hash = rgb.toHash()

      if (this.#distinct[hash] === undefined) {
        this.#distinct[hash] = 0
        this.#pxs.push(rgb)
      }

      this.#distinct[hash]++
      this.#greys[Math.trunc(grey / pixelMap.#foo * 10)]++
      acc += grey
    }

    this.#greys.sum = (acc / (this.#count * pixelMap.#foo).toFixed(2))
  }

  #greybar = (v, n, norm = 1) => $('<div>')
    .css('width', `${Math.trunc(v / norm * 100)}%`)
    .attr('tenth', n)
    .text(`${((v / this.#count) * 100).toFixed(2)}`)
    .appendTo($('.greymap'))

  draw(cm) {
    $('.greymap').empty()
    let norm = 0
    this.#greys
      .filter(v => norm = norm < v ? v : norm)
      .forEach((v, n) => this.#greybar(v, n, norm))

    this.#greybar(this.#greys.sum * this.#count, 'sum', this.#count)

    for (let rgb of this.#pxs.sort(pixelMap.#sort)) {
      let hash = rgb.toHash()
      $('<div>')
        .css('background-color', `#${hash}`)
        .html('&nbsp;')
        .attr('title', `#${hash} (${this.#distinct[hash]})`)
        .appendTo(cm)
    }
  }
}