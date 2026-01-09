(_ => {
  const ws = '.main>.workspace.album'
  const table = `${ws}>.table.album`
  const record = `${table}>.rows>.row.record`
  const img = `${record}.full>.imgtile>.image`
  const link = `${record}>.owner>[name="link"]`

  $(document.body)
    .on('activate', `>${ws}`, e => e.stopPropagation())
    .on('unmarshal', `>${record}`, (e, data) => {
      e.stopPropagation()

      const $owner = $(e.currentTarget).find('>.owner')

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

      if (parent_id) {
        sessionStorage[`${parent_type}/${parent_id}/event`] = owner_id
        selector += `>.workspace.event>.table.event`
      }

      $('body>.menubar').trigger('restore', [
        'main',
        parent_type,
        parent_id ?? owner_id,
      ])

      setTimeout(_ => $(`${selector}>.buttonbar>.button.photos`).click(), 100)
    })
})()
