(_ => {
  const ws = '.main>.workspace.camera'
  const imgbox = `${ws}>.imgbox`
  const devs = `${imgbox}>.viddevs>.rows`
  const device = `${devs}>.row.record`
  const vidcap = `${imgbox}>.vidcap`
  const editor = `${imgbox}>.imgedit`
  const viewport = `${editor}>.viewport`
  const canvas = `${viewport}>canvas`
  const stats = `${editor}>.imgstats`
  const statrow = `${stats}>.row.record`
  const control = `${editor}>.controls>div`
  const editbtn = `${control}>.button`
  const archive = `${editor}>.archive`
  const greys = `${imgbox}>.greymap`
  const ctlbtn = `${imgbox}>.buttonbar>.button`
  const props = `${imgbox}>.buttonbar>.props`

  $(window).on('resize', e => {
    if (!$('.workspace.camera.active')) {
      return
    }

    $(`body>${statrow}.selected`).removeClass('selected').trigger('click')
  })

  $(document.body)
    .on('activate', `>${ws}`, e => {
      e.stopPropagation()

      const $devs = $(document.body)
        .find(`>${devs}, >${viewport}, >${stats}, >${archive}, >${greys}`)
        .trigger('clear')
        .first() // array ordinal is determined by page layout, *not their order in find(...)

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
    .on('init', `>${ws}`, (e, { fetchurl, method, img, success = _ => _ }) => {
      e.stopPropagation()

      $(e.currentTarget).data({ fetchurl, method, success })

      if (img) {
        $(`body>${canvas}`).trigger('blit', [img, img.naturalWidth, img.naturalHeight])
      }
    })
    .on('deactivate', `>${ws}`, (e, photos) => {
      e.stopPropagation()

      if (photos) {
        $(`body>${ws}`).data('success')(photos)
      }

      $('body>.menubar').trigger('un-camera')
    })

    // device controls
    .on('click', `>${device}#retry`, e => $(`body>${devs}`).trigger('init'))
    .on('click', `>${device}.selected`, e => $(`body>${imgbox}`)
      .hasClass('capturing')
      ? $(`body>${vidcap}`).trigger('stop')
      : $(e.currentTarget).removeClass('selected').trigger('click'))
    .on('click', `>${device}:not(.selected):not(#retry)`, async e => {
      $(`>${device}.selected`).removeClass('selected')

      $(e.currentTarget).addClass('selected')

      let cam = $(`body>${vidcap}`).trigger('stop').get(0)

      navigator.mediaDevices.getUserMedia({
        video: { deviceId: e.currentTarget.id },
      })
        .then(stream => cam.srcObject = stream)
        .then(stream => new ImageCapture(stream.getVideoTracks()[0])
          .getPhotoCapabilities()
          // make this `$(...).notify()` instead of `console...`, or both, and/or save
          // max imageWidth/Height to a var for use in takePhoto
          .then(console.table))
        .then(_ => $(`body>${imgbox}`).toggleClass('waiting capturing'))
        // .then(_ => cam.requestFullscreen())
        .catch(ex => $(navigator.mediaDevices).notify('error', 'get camera', ex))
    })
    .on('stop', `>${vidcap}`, e => {
      const src = e.currentTarget.srcObject
      if (src != null) try {
        $(`body>${imgbox}`).toggleClass('waiting capturing')
        src.getTracks().forEach(track => track.stop())
      } catch (ex) {
        $(e.currentTarget).notify('error', 'closing camera', ex)
      }

      e.currentTarget.srcObject = null
    })

    // capturing
    .on('click', `>${vidcap}`, e => {
      e.stopPropagation()

      $(`body>${stats}, body>${archive}, body>${greys}`).trigger('clear')

      new ImageCapture(e.currentTarget.srcObject.getVideoTracks()[0]).takePhoto()
        .then(blob => createImageBitmap(blob))
        .then(bmp => $(`body>${canvas}`).trigger('blit', [bmp, bmp.width, bmp.height]))
        .then(_ => $(`body>${device}.selected`).trigger('click'))
        .catch(ex => $(e.currentTarget).notify('error', 'takePhoto', ex))

      document.fullscreenElement && document.exitFullscreen()
    })

    // editor actions
    .on('blit', `>${canvas}`, (e, img, w, h, loaded = (imgid, img) => undefined) => {
      const cnv = e.currentTarget

      cnv.width = w
      cnv.height = h
      cnv.getContext('2d', {
        alpha: false,
        willReadFrequently: true
      }).drawImage(img, 0, 0)

      cnv.toBlob(blob => {
        const [imgid, url] = [
          crypto.randomUUID(),
          URL.createObjectURL(blob)
        ]

        $(cnv.parentNode).attr({ imgid }).css({ backgroundImage: `url(${url})` })

        $(`body>${archive}`).trigger('send', { id: imgid, url, loaded })
      }, 'image/png', 1)

      $(`body>${control}`).trigger('reset-controls')
    })
    .on('clear', `>${viewport}`, e => $(e.currentTarget).css('background', ''))
    .on('scale', `>${viewport}`, (e, { imgid, x1 = 0, y1 = 0, x2, y2 }) => {
      [x1, y1, x2, y2] = [
        Math.round(x1),
        Math.round(y1),
        Math.round(x2),
        Math.round(y2),
      ]

      const vpt = $(e.currentTarget).trigger('snap', imgid).get(0),
        cnv = vpt.querySelector(':scope>canvas'),
        clip = {
          id: `${imgid}-${x1}x${y1}-${x2}x${y2}`,
          width: Math.round(x2 - x1),
          height: Math.round(y2 - y1),
        },
        cnv2vpt = vpt.offsetWidth / cnv.width,      // viewport relative to canvas
        vpt2virt = cnv.width / clip.width * cnv2vpt // background-image relative to viewport

      if ($(`body>${statrow}#${clip.id}`).length === 0) {
        $(`body>${stats}`).trigger('send', {
          ...clip,
          virt2cnv: (x, y) => new Object({ // convert virtual (clipped by viewport) to canvas
            x: Math.round(x / vpt2virt + x1),
            y: Math.round(y / vpt2virt + y1),
          }),
          scaleargs: { imgid, x1, y1, x2, y2 },
        })
      }

      $(vpt).css({
        height: `${clip.height * vpt2virt}px`,
        backgroundPosition: `-${x1 * vpt2virt}px -${y1 * vpt2virt}px`,
        backgroundSize: `${cnv.width * vpt2virt}px ${cnv.height * vpt2virt}px`,
      })
    })
    .on('snap', `>${viewport}`, (e, imgid) => {
      if (e.currentTarget.attributes.imgid?.value === imgid) {
        return
      }

      const cnv = e.currentTarget.querySelector(':scope>canvas'),
        img = $(`body>${archive}>#${imgid}>.snapshot`).get(0)

      cnv.width = img.naturalWidth
      cnv.height = img.naturalHeight
      cnv.getContext('2d', {
        alpha: false,
        willReadFrequently: true
      }).drawImage(img, 0, 0)

      $(e.currentTarget).attr({ imgid }).css({ backgroundImage: `url(${img.src})` })
    })
    .on('resample', `>${canvas}`, (e, scale) => {
      const cnv = e.currentTarget,
        scaleargs = $(`body>${statrow}.selected`).data().scaleargs

      createImageBitmap(cnv, {
        resizeWidth: Math.round(cnv.width * scale),
        resizeHeight: Math.round(cnv.height * scale),
      }).then(bmp => $(cnv).trigger('blit', [
        bmp,
        bmp.width,
        bmp.height,
        imgid => $(cnv.parentNode).trigger('scale', {
          imgid,
          x1: scaleargs.x1 * scale,
          y1: scaleargs.y1 * scale,
          x2: scaleargs.x2 * scale,
          y2: scaleargs.y2 * scale,
        }),
      ])).catch(ex => $(e.currentTarget).notify('error', 'failed scaling image', ex))
    })
    .on('rotate', `>${canvas}`, (e, theta) => { // only works for multiples of PI/2
      const pic = e.currentTarget,
        [w, h] = [pic.width, pic.height],
        mtrx = ((c, s) => (x, y) => [x * c - y * s, x * s + y * c])
          (Math.cos(theta), Math.sin(theta)),
        buff = new OffscreenCanvas(...mtrx(w, h).map(v => Math.round(Math.abs(v)))),
        ctx = buff.getContext('2d', { alpha: false }),
        scaleargs = $(`body>${statrow}.selected`).data().scaleargs,
        [x1, y1] = mtrx(scaleargs.x1 - w / 2, scaleargs.y1 - h / 2),
        [x2, y2] = mtrx(scaleargs.x2 - w / 2, scaleargs.y2 - h / 2)

      ctx.save()
      ctx.translate(Math.floor(buff.width / 2), Math.floor(buff.height / 2))
      ctx.rotate(theta)
      ctx.drawImage(pic, -w / 2, -h / 2)
      ctx.restore()

      $(pic).trigger('blit', [
        buff,
        buff.width,
        buff.height,
        imgid => $(pic.parentNode).trigger('scale', {
          imgid,
          ...((x1, x2) => x1 < x2 ? { x1, x2 } : { x1: x2, x2: x1 })
            (x1 + buff.width / 2, x2 + buff.width / 2),
          ...((y1, y2) => y1 < y2 ? { y1, y2 } : { y1: y2, y2: y1 })
            (y1 + buff.height / 2, y2 + buff.height / 2),
        }),
      ])
    })
    .on('crop', `>${viewport}`, e => {
      const cnv = e.currentTarget.querySelector(':scope>canvas'),
        [p1, p2] = ((vpt, xlate) => [
          xlate(0, 0),
          xlate(vpt.offsetWidth, vpt.offsetHeight),
        ])(e.currentTarget, $(`body>${statrow}.selected`).data().virt2cnv,)

      createImageBitmap(cnv, p1.x, p1.y, p2.x, p2.y)
        .then(bmp => $(cnv).trigger('blit', [bmp, p2.x - p1.x, p2.y - p1.y]))
        .catch(ex => $(e.currentTarget).notify('error', 'failed clipping image to viewport', ex))
    })
    .on('click', `>${statrow}:not(.selected)`, e => $(`body>${viewport}`)
      .trigger('scale', $(e.currentTarget).data().scaleargs))
    .on('unmarshal', `>${statrow}`, e => $(e.currentTarget)
      .addClass('selected')
      .siblings('.selected')
      .removeClass('selected'))
    .on('unmarshal', `>${archive}>.row.record`, (e, data) => {
      const img = e.currentTarget.querySelector(':scope>img')

      img.src = data.url
      img.onload = _ => {
        $(`body>${viewport}`).trigger('scale', {
          imgid: data.id,
          x2: img.naturalWidth,
          y2: img.naturalHeight,
        })
        data.loaded(data.id, img)
      }
    })

    // editor controls
    .on('change', `>${control}.resize>label>input`, e => {
      const pic = $(`body > ${canvas}`).get(0),
        pct = e.currentTarget.value / 100

      $(`body > ${editbtn}.resize`)
        .text(`${Math.round(pic.width * pct)}x${Math.round(pic.height * pct)}`)
    })
    .on('reset-controls', `>${control}`, e => $(e.currentTarget)
      .find('>label>input')
      .val(100))
    .on('click', `>${editbtn}.resize`, e => $(`body>${canvas}`)
      .trigger('resample', $(`body>${control}.resize>label>input`).val() / 100.0))
    .on('change', `>${control}.rotate>label>select`, e => {
      if (e.currentTarget.value === 0) {
        console.log('is change to "---" ever called')
      }

      $(`body > ${canvas}`).trigger('rotate', Math.PI / 2 * e.currentTarget.value)

      e.currentTarget.value = '0'
    })
    .on('click', `>${editbtn}.crop`, e => $(`body>${viewport}`).trigger('crop'))

    // audit stuff
    .on('clear', `>${greys}`, e => $(e.currentTarget).empty())

    // workspace actions
    .on('click', `>${ctlbtn}.cancel`, e => $(`body>${ws}`).trigger('deactivate'))
    .on('click', `>${ctlbtn}.reset`, e => {
      const $original = $(`body>${statrow}:first()`).removeClass('record')

      $(`body>${stats}`).trigger('clear')
      $(`body>${archive}>.row.record:not(:first)`).remove()

      $original.addClass('record').trigger('click')
    })
    .on('click', `>${ctlbtn}.savemore`, _ => $(`body>${canvas}`)
      .trigger('save', photo => $(window).notify('success', 'image saved', photo)))
    .on('click', `>${ctlbtn}.save`, _ => $(`body>${canvas}`)
      .trigger('save', photo => $(`body>${ws}`).trigger('deactivate', photo)))
    .on('save', `>${canvas}`, (e, success) => {
      const req = $(`body>${ws}`).data(),  // not an actual Request
        [p1, p2] = ((vpt, xlate) => [
          xlate(0, 0),
          xlate(vpt.offsetWidth, vpt.offsetHeight),
        ])($(`body>${viewport}`).get(0), $(`body>${statrow}.selected`).data().virt2cnv),
        [w, h] = [p2.x - p1.x, p2.y - p1.y],
        buff = new OffscreenCanvas(w, h)

      buff.getContext('2d', {
        alpha: false
      }).drawImage(e.currentTarget, p1.x, p1.y, w, h, 0, 0, w, h)

      buff.convertToBlob({
        type: $(`body>${props}>.format>select`).val(),
        quality: $(`body>${props}>.quality>input`).val(),
      })
        .then(blob => fetch(req.fetchurl, {
          method: req.method,
          body: (part => (part.append('file', blob), part))(new FormData()),
        })
          .then(async resp => {
            if ([200, 201].indexOf(resp.status) === -1) throw {
              status: resp.status,
              message: await resp.text()
            }
            return await resp.json()
          })
          .then(result => success(result[0])) // result is a list of all photos, newest first
          .catch(ex => $(e.currentTarget).notify('error',
            `${req.method} ${req.fetchurl} statusCode: ${ex.status ?? 'unsent'}`,
            `failed to save image: ${ex}`,
          )))
    })

  // passive events can't `preventDefault()`, so these handlers are attached 
  // directly to the viewport (FIXME: does propagation matter?)
  setTimeout(_ => $(`body>${viewport}`)
    .on('touchstart', e => {
      console.log('touchstart')
    })
    .on('touchmove', e => {
      e.preventDefault()

      e = e.originalEvent
      console.log('touchmove')
      // this doesn't work the same way as wheel
    })
    .on('touchend', (e, data = {}) => {
      delete data.touchend

      const $vpt = $(e.currentTarget),
        $grid = $vpt.find('>.grid-overlay'),
        statdata = $(`body>${statrow}.selected`).data(),
        [p1, p2] = ((xlate, grid) => [
          xlate(grid.marginLeft, grid.marginTop),
          xlate(grid.marginLeft + grid.width, grid.marginTop + grid.height),
        ])(statdata.virt2cnv, (o => {
          for (const k in o) {
            o[k] = o[k].replace(/px$/, '') * 1
          }
          return o
        })($grid.css(['marginLeft', 'marginTop', 'width', 'height'])))

      $vpt.trigger('scale', {
        imgid: statdata.scaleargs.imgid,
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
      })

      $grid.css({ width: '', height: '', margin: '' })
    })
    .on('pointerdown', e => $(e.currentTarget).data({
      mins: (([w, h]) => Object({
        x: e.currentTarget.offsetWidth - w,
        y: e.currentTarget.offsetHeight - h,
      }))($(e.currentTarget).css('backgroundSize').px2int())
    }))
    .on('pointermove', e => {
      const mins = $(e.currentTarget).data().mins
      if (!mins) {
        return
      }

      let [x, y] = $(e.currentTarget).css('backgroundPosition').px2int()

      e = e.originalEvent

      if ((x += e.movementX) > 0) {
        x = 0
      } else if (x < mins.x) {
        x = mins.x
      }
      if ((y += e.movementY) > 0) {
        y = 0
      } else if (y < mins.y) {
        y = mins.y
      }

      $(e.currentTarget).css('background-position', `${x}px ${y}px`)
    })
    .on('pointerup', e => {
      delete $(e.currentTarget).data().mins

      const $vpt = $(e.currentTarget),
        src = (cnv => Object({ w: cnv.width, h: cnv.height }))($(`body>${canvas}`).get(0)),
        ratio = (([sizew, sizeh]) => Object({ x: src.w / sizew, y: src.h / sizeh }))
          ($vpt.css('backgroundSize').px2int()),
        [x1, y1] = (([posx, posy]) => [-posx * ratio.x, -posy * ratio.y])
          ($vpt.css('backgroundPosition').px2int()),
        [x2, y2] = (vpt => [x1 + vpt.offsetWidth * ratio.x, y1 + vpt.offsetHeight * ratio.y])
          ($vpt.get(0))

      $vpt.trigger('scale', {
        imgid: $(`body>${statrow}.selected`).data('scaleargs').imgid,
        x1,
        y1,
        x2,
        y2,
      })
    })
    .on('wheelend', (e, data) => $(e.currentTarget).trigger('touchend', data))
    .on('wheel', e => {
      // e.preventDefault()

      let data = $(e.currentTarget).data()
      let now = new Date().getTime()

      if (now - (data.wheeltime ?? 0) < 50) {
        return
      } else if (data.touchend) {
        clearTimeout(data.touchend)
      }

      data.wheeltime = now
      data.touchend = setTimeout(() => $(e.currentTarget).trigger('wheelend', data), 200)

      $(e.currentTarget).trigger('slide', {
        // offsets are sometimes constant across multiple events related by
        // a continuous movement
        x: e.offsetX,
        y: e.offsetY,
        // delta values are positive moving towards the origin which is top-left
        // in html-parlance; inverting deltaX is the first of several adjustments
        // we make to translate the origin to the center of the viewport so 
        // negative values mean left, and positive values mean right
        dx: -e.originalEvent.deltaX,
        // deltaY is OK with positive values meaning up, and negative meaning down
        dy: e.originalEvent.deltaY,
      })
    })
    .on('slide', (e, { x, y, dx, dy }) => {
      const $grid = $(e.currentTarget.querySelector(':scope>.grid-overlay')),
        css = (o => {
          for (const k in o) {
            o[k] = o[k].replace(/px$/, '') * 1
          }
          return o
        })($grid.css([
          'width',
          'height',
          'margin-left',
          'margin-top',
          'margin-right',
          'margin-bottom',
        ])),
        [w, h] = [e.currentTarget.offsetWidth, e.currentTarget.offsetHeight]

      let hmarg = 'margin-right',
        vmarg = 'margin-top'

      if (x - w / 2 < 0) {
        hmarg = 'margin-left'
        dx *= -1
      }
      if (y - h / 2 > 0) {
        vmarg = 'margin-bottom'
        dy *= -1
      }

      // bounds checking
      if (css[hmarg] - dx < 0) {
        dx = -css[hmarg]
      } else if (css.width + dx < 100) {
        dx = 100 - css.width
      }
      if (css[vmarg] - dy < 0) {
        dy = -css[vmarg]
      } else if (css.height + dy < 100) {
        dy = 100 - css.height
      }

      css[hmarg] = `${Math.round(w - css.width - dx)}px`
      css[vmarg] = `${Math.round(h - css.height - dy)}px`
      css.width = `${Math.round(css.width + dx)}px`
      css.height = `${Math.round(css.height + dy)}px`

      $grid.css(css)
    }), 150)

  class pixelMap {
    /*
    FIXME: leverage indexedDB to help with this
     */
    static #msb = 0xfc
    static #foo = 0xff /** max bright */ * 3 /** channels */
    static #fns = {
      toHash: function () { return this.toInt().toString(16) },
      toInt: function () { return (this.r << 16) + (this.g << 8) + this.b },
      toRgb: function () { return `rgb(${this.r}, ${this.g}, ${this.b})` },
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
      .css('width', `${Math.trunc(v / norm * 100)} % `)
      .attr('tenth', n)
      .text(`${((v / this.#count) * 100).toFixed(2)}`)
      .appendTo($('.greymap'))

    draw(cm) {
      $(`body > ${greys}`).empty()

      let norm = this.#greys.reduce((acc, curr) => acc < curr ? curr : acc, 0)
      this.#greys.forEach((v, n) => this.#greybar(v, n, norm))

      this.#greybar(this.#greys.sum * this.#count, 'sum', this.#count)

      for (let rgb of this.#pxs.sort(pixelMap.#sort)) {
        let hash = rgb.toHash()
        $('<div>')
          .css('background-color', `#${hash}`)
          .html('&nbsp;')
          .attr('title', `#${hash}(${this.#distinct[hash]})`)
          .appendTo(cm)
      }
    }
  }
})()
