(_ => {
  let ws = '.main>.workspace.camera'
  let imgbox = `${ws}>.imgbox`
  let devs = `${imgbox}>.viddevs>.rows`
  let device = `${devs}>.row.record`
  let capture = `${imgbox}>.vidcap`
  let editor = `${imgbox}>.imgedit`
  let canvas = `${editor}>.viewport>canvas`
  let stats = `${editor}>.imgstats`
  let range = `${editor}>.ranges>.row>label>[type="range"]`
  let editbtn = `${editor}>.ranges>.row>.button`
  let greys = `${imgbox}>.greymap`
  let audit = `${imgbox}>.audit`
  let ctlbtn = `${imgbox}>.buttonbar>.button`

  $(document.body)
    .on('activate', `>${ws}`, e => {
      e.stopPropagation()

      $(e.currentTarget).data({
        photoStub: sessionStorage['photo-stub'],
        photoOwner: sessionStorage['photo-owner'] ?? sessionStorage['photo-stub'],
      })

      $(`body>${imgbox}`).attr('owner-id', sessionStorage['photo-owner'])

      // FIXME: clear the canvas and audit too

      // clean up any previous owners; it only matters if 
      // sessionStorage.removeItem('photo-owner')

      // remove this if `init` can be converted to fetch and delegate to
      // workspace.activate() call to `fetch`
      $(`body>${devs}`).trigger('init')
    })
    .on('deactivate', `>${ws}`, (e, photos) => {
      // back from whence we came
      // if success resend client photos
    })

    // capture controls
    .on('init', `>${devs}`, e => {
      // XXX: if this is enough for a fetch, then the .viddevs .table 
      // wrapper can be removed and the rows can be decorated as .viddevs
      e.stopPropagation()

      let $devs = $(e.currentTarget).trigger('clear')

      if (!navigator.mediaDevices?.enumerateDevices()
        .then(devices => devices
          .filter(dev => dev.kind === "videoinput")
          .map(dev => Object({
            id: dev.deviceId,
            label: dev.label || `Camera ${dev.deviceId}`, // null (??) or empty (||)
          })))
        .then(devs => $devs.trigger('send', devs))
        .catch(ex => $(navigator.mediaDevices)
          .notify('error', 'getting camera devices', ex))
        .finally(_ => {
          $(`body>${device}`).length || $devs
            .trigger('send', {
              id: 'retry',
              label: 'try again'
            })

          $(`body>${device}:first-child`).addClass('selected')
        })
      ) {
        $(navigator).notify('error',
          'querying media devices',
          'no (permissions for) media devices'
        )
      }
    })
    .on('click', `>${device}#retry`, e => $(`body>${devs}`).trigger('init'))
    .on('click', `>${device}.selected`, e => $(`body>${imgbox}`)
      .hasClass('capturing')
      ? $(`body>${capture}`).trigger('stop')
      : $(e.currentTarget).removeClass('selected').trigger('click'))
    .on('click', `>${device}:not(.selected):not(#retry)`, async e => {
      $(`>${device}.selected`).removeClass('selected')

      $(e.currentTarget).addClass('selected')

      let cam = $(`body>${capture}`).trigger('stop').get(0)

      navigator.mediaDevices.getUserMedia({
        video: { deviceId: e.currentTarget.id },
      }).then(stream => {
        cam.srcObject = stream
        $(`body>${imgbox}`).toggleClass('waiting capturing')
        // cam.requestFullscreen()
      }).catch(ex => $(navigator.mediaDevices).notify('error', 'get camera', ex))
    })

    // capture events
    .on('click', `>${capture}`, e => {
      e.stopPropagation()

      let width = e.currentTarget.videoWidth,
        height = e.currentTarget.videoHeight

      $(`body>${stats}, body>${audit}, body>${greys}`).trigger('clear')
      $(`body>${editor}`).trigger('snap', [0, 0, width, height, e.currentTarget])
      $(`body>${device}.selected`).trigger('click')

      document.fullscreenElement && document.exitFullscreen()
    })
    .on('stop', `>${capture}`, e => {
      e.stopPropagation()

      let src = e.currentTarget.srcObject
      if (src != null) try {
        $(`body>${imgbox}`).toggleClass('waiting capturing')
        src.getTracks().forEach(track => track.stop())
      } catch (ex) {
        $(e.currentTarget).notify('error', 'closing camera', ex)
      }

      e.currentTarget.srcObject = null
    })

    // editor actions
    .on('snap', `>${editor}`, (e, x, y, w, h, cam) => {
      let $edit = $(e.currentTarget)
      let $props = $edit.parent().find('>.props')
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
    .on('capture', `>${editor}`, (e, x, y, w, h, img) => {
      let pic = $(e.currentTarget).find('>.viewport>canvas').get(0)

      pic.width = w
      pic.height = h
      pic.getContext('2d', { alpha: false }).drawImage(img, x, y)
    })
    .on('scale', `>${editor}`, (e, w, h, url) => {
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
    .on('collect', `>${editor}`, (e, width, height, url) => {
      $(`body>${stats}`).trigger('send', {
        width,
        height,
        size: (url.length / 1024).toFixed(2),
      })
    })
    .on('reset-range', `>${editor}`, e => $(e.currentTarget)
      .find('>.ranges')
      .find('#scale, #resize')
      .val(100)
      .trigger('change'))
    .on('resample', `>${editor}`, e => {
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
    .on('commit', `>${editor}`, e => {
      // save the resampled image
    })
    .on('resize', `>${editor}`, (e, pct) => {
      let scale = pct / 100.0
      let pic = $(`body>${canvas}`).get(0)

      pic.style.height = `${pic.height * scale}px`
      pic.style.width = `${pic.width * scale}px`
    })
    .on('crop', `>${editor}`, e => {
      let view = e.currentTarget.querySelector('.viewport')
      let scale = 100.0 / $(e.currentTarget).find('#scale').val()
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
        $(`body>${audit}>:first-child>img`).get(0),
      ])
    })
    .on('change', `>${range}#scale`, e => $(`body>${editor}`)
      .trigger('resize', e.currentTarget.value))
    .on('change', `>${range}#aspect`, e => $(`body>${editor}`)
      .trigger('resample', e.currentTarget.value))

    // editor buttons
    .on('click', `>${editbtn}.crop`, e => $(`body>${editor}`)
      .trigger('crop'))
    .on('click', `>${editbtn}.resize`, e => $(`body>${editor}`)
      .trigger('resize'))

    // hover effects
    .on('mouseover', `>${editbtn}.crop`, e => $(`body>${editor}`)
      .addClass('cropping'))
    .on('mouseout', `>${editbtn}.crop`, e => $(`body>${editor}`)
      .removeClass('cropping'))
    .on('mouseover', `>${editbtn}.resize`, e => $(`body>${editor}`)
      .addClass('resizing'))
    .on('mouseout', `>${editbtn}.resize`, e => $(`body>${editor}`)
      .removeClass('resizing'))

    // audit stuff
    .on('create', `>${audit}`, (e, url) => $('<div>')
      .addClass('row')
      .append($('<img>').attr('src', url))
      .prependTo($(e.currentTarget)))
    .on('clear', `>${audit}`, e => $(e.currentTarget)
      .find('>.row:not(.x-template)')
      .remove())
    .on('clear', `>${greys}`, e => $(e.currentTarget).empty())

    // deprecated, there's a better way
    .on('click', `${editor}>.viewport`, e => {
      let pic = e.currentTarget.querySelector('canvas')
      let ctx = pic.getContext('2d')
      let pm = new pixelMap(ctx.getImageData(0, 0, pic.width, pic.height).data)
      pm.draw($('.colormap').empty().get(0))
    })
    .on('click', '>.audit>.img', e => { /** what goes here? */ })

    // window actions
    .on('click', `>${ctlbtn}.save`, e => {
      e.stopPropagation()

      let $imgbox = $(`body>${imgbox}`)
      let url = `/photos/${$imgbox.attr('owner-id')}/${$imgbox.attr('id')}`
        .replace(/\/undefined$/, '')
      let params = { method: $imgbox.attr('id') ? 'PATCH' : 'POST' }
      let $props = $('.props')

      // weird that the XA is driven by the canvas and not `fetch`
      $(`body>${canvas}`).get(0).toBlob(
        blob => {
          // blob.stream().getReader().read().then(something..., something..., ...)
          params.body = ((part) => (part.append('file', blob), part))(new FormData())

          fetch(url, params).then(async resp => {
            if ([200, 201].indexOf(resp.status) === -1) throw {
              status: resp.status,
              message: await resp.text()
            }
            return await resp.json()
          }).then(result => $(`body>${ws}`).trigger('deactivate', result)
          ).catch(ex => $(e.currentTarget).notify('error',
            `${params.method} ${url} statusCode: ${ex.status ?? 'unsent'}`,
            ex,
          ))
        },
        $props.find('.format>select').val(),
        $props.find('.quality>input').val(),
      )
    })
    .on('click', `>${ctlbtn}.cancel`, e => $(e.delegateTarget)
      .trigger('cancel', 'user requested cancel event'))
    .on('click', `>${ctlbtn}.reset`, e => {
      let $imgbox = $(e.delegateTarget),
        first = $imgbox
          .find('>.audit>div')
          .remove()
          .last()
          .find('img')
          .get(0),
        w = first.naturalWidth,
        h = first.naturalHeight

      $(`>${editor}>.imgstats`).trigger('clear')
      $(`>${editor}`).trigger('snap', [0, 0, w, h, first])
    })

  class pixelMap {
    /*
    FIXME: leverage indexedDB to help with this
     */
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

    #greybar = (v, n, norm) => $('<div>')
      .css('width', `${Math.trunc(v / norm * 100)}%`)
      .attr('tenth', n)
      .text(`${((v / this.#count) * 100).toFixed(2)}`)
      .appendTo($('.greymap'))

    draw(cm) {
      $(`body>${greys}`).empty()

      let norm = this.#greys.reduce((acc, curr) => acc < curr ? curr : acc, 0)
      this.#greys.forEach((v, n) => this.#greybar(v, n, norm))

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
})()

