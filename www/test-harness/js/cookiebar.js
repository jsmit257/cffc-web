$(_ => {
  $('.cookie-bar').on('change', 'input', e => {
    localStorage.setItem(e.currentTarget.id, e.currentTarget.checked)

    $('body>.main>.workspace')[e.currentTarget.checked
      ? 'addClass'
      : 'removeClass'
    ](e.currentTarget.id)
  })

  new Map(Object.entries({
    'hide-deleted': $('#hide-deleted'),
    'hide-uuid': $('#hide-uuid'),
    'hide-timestamps': $('#hide-timestamps'),
  })).forEach((v, k) => localStorage.getItem(k) === 'true' && $(v).click())
})
