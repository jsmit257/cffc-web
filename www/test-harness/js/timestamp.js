$(_ => $('.timestamp')
  // ingress and egress
  .on('activate', (e, init, table, id, fld) => {
    e.stopPropagation()

    let data = {
      urlParams: `${table}/${id}`,
      srcDate: new Date(init),
    }
    let $edit = $(e.currentTarget).data(data)

    $edit
      .find('>.title')
      .append($('<span>').text(` - ${table}`))
      .find('>label>.relative')
      .prop('checked', true)
      .trigger('change')

    $edit
      .find('>.includes>label>.include')
      .prop('checked', false)
      .filter(`.${fld}`)
      .prop('checked', true)

    $edit.find('>.form').trigger('reset')

    $edit.find('>.absolute>input').val(data.srcDate.inputVal())
  })
  .on('deactivate', e => ($(document.body).removeClass('date-editing'),
    e.currentTarget.remove()))

  //
  .on('change', '>.title>label>.relative', e => $(e.delegateTarget)
    .toggleClass('relative absolute'))

  // relative factor management
  .on('reset', '>.form', e => {
    let $form = $(e.currentTarget)
    $form.find('>.relative:not(.template)').remove()
    $form.find('>.template.relative').trigger('add-row')
    $form
      .parent()
      .find('>.absolute>input')
      .val($(e.delegateTarget).data('srcDate').inputVal())
  })
  .on('add-row', '>.form>.template.relative', e => $(e.currentTarget)
    .clone(true, true)
    .removeClass('template')
    .insertBefore(e.currentTarget))
  .on('click', '.ctrl.add', e => $(e.currentTarget.parentNode)
    .find('>.form>.template.relative')
    .trigger('add-row'))
  .on('click', '>.form>.add', e => $(e.currentTarget.parentNode)
    .find('>.template.relative')
    .trigger('add-row'))
  .on('click', '>.form>.relative:not(.template)>.delete', e => $(e.currentTarget.parentNode)
    .remove())

  // menu commands
  .on('click', '>.buttons>.cancel.active', e => $(e.delegateTarget)
    .trigger('deactivate'))
  .on('click', '>.buttons>.update.active', e => {
    let $edit = $(e.delegateTarget)
    let url = `/ts/${$edit.data('urlParams')}`
    $.ajax({
      url: url,
      method: 'PATCH',
      data: JSON.stringify({
        fields: ((sel, result = []) => {
          $edit
            .find(sel)
            .each((i, v) => result.push(v.name))
          return result
        })('>.includes>label>input.include:checked'),
        factors: ((sel, result = []) => {
          $edit
            .find(sel)
            .filter((_, v) => ~~$(v).find('input').val())
            .each((i, v) => result.push({
              delta: parseInt($(v).find('input').val()),
              interval: $(v).find('select').val(),
            }))
          return result
        })('>.form>.relative:not(.template)'),
        utc: new Date($edit
          .find('>.absolute>input')
          .val())
          .toISOString(),
      }),
      success: (data, staus, xhr) => {
        $edit.trigger('deactivate')
        $('.notification').trigger('activate', [
          'debug',
          `PATCH - ${url}`,
          `status ${xhr.status}`,
        ])
      },
      error: (xhr, status, err) => $('.notification').trigger('activate', [
        'error',
        `PATCH - ${url}`,
        `status ${xhr.status} with err '${err}`,
      ]),
      // complete: (xhr, status) => $('.notification').trigger('activate', [
      //   xhr.status === 204 ? 'debug' : 'error',
      //   `PATCH - ${url}`,
      //   `status ${xhr.status} with err '${err}`,
      // ]),
    })
  })
  .on('click', '>.buttons>.reset.active', e => $(e.delegateTarget)
    .find('>.form')
    .trigger('reset'))

  // this doesn't belong here
  .on('click', '>.buttons>.undel.active', e => {
    let url = `/undel/${$(e.delegateTarget).data('urlParams')}`
    $.ajax({
      url: url,
      method: 'DELETE',
      success: (data, staus, xhr) => {
        $edit.trigger('deactivate')
        $('.notification').trigger('activate', [
          'debug',
          `PATCH - ${url}`,
          `status ${xhr.status}`,
        ])
      },
      error: (xhr, status, err) => $('.notification').trigger('activate', [
        'error',
        `PATCH - ${url}`,
        `status ${xhr.status} with err '${err}`,
      ]),
    })
  }))
