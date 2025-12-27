(_ => {
  let ws = '.main>.workspace.album'
  let table = `${ws}>.table.album`
  let record = `${table}>.rows>.row.record`
  let img = `${record}.full>img`
  let link = `${record}>.owner>[name="link"]`

  $(document.body)
    .on('activate', `>${ws}`, e => e.stopPropagation())
    .on('unmarshal', `>${record}`, (e, data) => {
      e.stopPropagation()

      const $row = $(e.currentTarget),
        $owner = $row.find('>.owner')

      $row.find('>.thumbnail').attr('src', `album/${data.image}`)

      $owner.find('>[name="parenttype"]').text(data.owner.parent_type)
      $owner.find('>[name="link"]').text(data.owner.label)
    })
    .on('click', `>${record}`, e => {
      e.stopPropagation()

      $(e.currentTarget).toggleClass('full background-image selected')
    })
    .on('click', `>${img}`, e => {
      e.stopPropagation()

      console.log('fullscreen image')
    })
    .on('click', `>${link}`, e => {
      e.stopPropagation()

      const {
        parent_type,
        parent_id,
        owner_id,
      } = $(e.currentTarget.parentNode.parentNode).data().owner

      let selector = `body>.main>.workspace.${parent_type}>.table.${parent_type}`

      sessionStorage.menu = 'main'
      sessionStorage.main = parent_type
      sessionStorage[parent_type] = parent_id ?? owner_id
      if (owner_id) {
        sessionStorage[`${parent_type}/${parent_id}/event`] = owner_id
        selector += `>.workspace.event>.table.event`
      }

      $('body>.menubar').trigger('init')

      setTimeout(_ => $(`${selector}>.buttonbar>.button.photos`).click(), 100)
    })
    .on('click', `>${table}>.full`, e => {
      e.stopPropagation()

      $(e.currentTarget).remove()
    })
})()
