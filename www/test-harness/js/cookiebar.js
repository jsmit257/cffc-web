$(_ => {
  let hidden = {
    'hide-deleted': $('#hide-deleted'),
    'hide-uuid': $('#hide-uuid'),
    'hide-timestamps': $('#hide-timestamps'),
  }

  $('.cookie-bar').on('change', 'input', e => {
    document.cookie = `${e.currentTarget.id}=${e.currentTarget.checked}`
    $('body>.main>.workspace')[e.currentTarget.checked
      ? 'addClass'
      : 'removeClass'
    ](e.currentTarget.id)
  })

  document.cookie.split(/; /).forEach(c => {
    let [name, value] = c.split(/=/, 2)
    let $el = hidden[name]
    if ($el && value === 'true') {
      $el.click()
    }
  })
})
