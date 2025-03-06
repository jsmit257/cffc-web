(_ => {
  let datarows = '.table.events>.rows>.row.record'

  $(document.body)
    .on('render-record', `${datarows}`, e => {
      // let $row = $(e.currentTarget)
      // let data = $row.data()

      // Object.keys(data).forEach(k => {
      //   let v = data[k]
      //   let $fld = $row.find(`>.field>[name="${k}"], >[name="${k}"]`)
      //   let nodeName

      //   switch (nodeName = ($fld.get(0) || { nodeName: 'x-none' }).nodeName.toLowerCase()) {
      //     case 'select':
      //       try {
      //         $fld.trigger('send', v)
      //         if (v.id) {
      //           v = v.id
      //         }
      //       } catch (ex) {
      //         console.log(ex)
      //       }
      //       break
      //     case 'button':
      //       break
      //     case 'div':
      //       $fld.text(v)
      //       return
      //     case 'x-none':
      //       console.log('x-none', k, 'value', v)
      //       break
      //     default:
      //       console.log('default', nodeName, 'key', k, 'value', v)
      //   }

      //   $fld.val(v)
      // })
    })
})()