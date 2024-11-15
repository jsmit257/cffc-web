$(_ => $('body>.login')
  .on('activate', e => {
    let $login = $(e.delegateTarget)
    let username = $login
      .find('>.login-menu>.control')
      .text()

    $login
      .find('>.form')
      .removeClass('mismatch adding editing cancelable')
      .find('input[type="password"]').val('')

    $('body')
      .addClass('authing')
      .find('input#username')
      .val(username)
      .focus()
  })
  .on('deactivate', e => {
    let $login = $(e.currentTarget).removeClass('cancelable')

    $login.find('input[type="password"]').val('')
    $login
      .find('>.login-menu>.control')
      .text($login
        .find('>.form>.username>input')
        .val())

    $(document).trigger('reload')

    $('body').removeClass('authing')
  })
  .on('click', '>.login-menu>.commands>.cancel', e => $(e.delegateTarget)
    .trigger('deactivate'))
  .on('click', '>.login-menu>.commands>.change-auth', e => {
    e.stopPropagation()

    let $login = $(e.delegateTarget)
      .trigger('activate')
      .addClass('cancelable')

    $login.find('>.form')[$login.attr('id')
      ? 'addClass'
      : 'removeClass']
      ('editing')
  })
  .on('click', '>.login-menu>.commands>.logout', e => $.ajax({
    url: '/logout',
    method: 'POST',
    statusCode: {
      202: _ => alert('logged out'),
      403: _ => alert('logout failed'),
    },
    error: console.log,
    complete: _ => $(e.delegateTarget).trigger('activate'),
  }))
  .on('change', '>.form>.username>input', e => {
    let $dt = $(e.delegateTarget)

    $.ajax({
      url: `/auth/${$(e.currentTarget).val()}`,
      method: "GET",
      statusCode: {
        302: xhr => $dt.attr('id', xhr.responseJSON.id),
        400: _ => $dt.removeAttr('id'),
        500: _ => $dt.removeAttr('id'),
      },
      complete: _ => $dt
        .find('>.form')
        .removeClass('editing')
        .find('>.password>input')
        .prop('readonly', !$dt.attr('id')),
    })
  })
  .on('keyup', '>.form>.username>input', e => $(e.currentTarget)
    .next()[$(e.currentTarget).val()
      ? 'addClass'
      : 'removeClass']
    ('active'))
  .on('click', '>.form>.username>.create.active', e => $.ajax({
    url: "/user",
    method: 'POST',
    data: JSON.stringify({ username: $(e.currentTarget).prev().val() }),
    statusCode: {
      301: xhr => $(e.delegateTarget)
        .find('>.form')
        .addClass('adding editing')
        .find('>.edit>input')
        .val('')
        .focus(),
      409: xhr => alert('username not valid')
    },
    error: _ => $(e.currentTarget).val('').focus(),
  }))
  .on('keyup', '>.form>.password>input', e => $(e.currentTarget)
    .parent()
    .find('>.ok')[$(e.currentTarget).val()
      ? 'addClass'
      : 'removeClass']
    ('active'))
  .on('click', '>.form:not(.editing)>.password>.login.active', e => {
    e.stopPropagation()

    let $login = $(e.delegateTarget)

    $.ajax({
      url: "/auth",
      method: 'POST',
      data: JSON.stringify({
        id: $login.attr('id'),
        password: $login.find('>.form>.password>input').val(),
      }),
      success: _ => $login.trigger('deactivate'),
      error: _ => $login.find('>.form>.password>input').val('').focus(),
    })
  })
  .on('click', '>.form>.password>.reset.active', e => {
    e.stopPropagation()

    let $login = $(e.delegateTarget)

    $.ajax({
      url: `/auth/${$login.attr('id')}`,
      method: 'DELETE',
      success: _ => $(e.delegateTarget)
        .find('>.form')
        .addClass('adding editing')
        .find('>.edit>input')
        .val('')
        .focus(),
      error: _ => $login.find('>.form>.password>input').val('').focus(),
    })
  })
  .on('click', '>.form>.toggle-change', e => $(e.delegateTarget)
    .find('>.form')
    .toggleClass('editing'))
  .on('keyup', '>.form>.matchable>input', e => {
    e.stopPropagation()

    let $dt = $(e.delegateTarget)
    let p1 = $dt.find('>.form>.newpassword>input').val()
    let p2 = $dt.find('>.form>.newpassword2>input').val()

    $(e.currentTarget)
      .parent()
      .parent()[p1 == p2 ? 'removeClass' : 'addClass']('mismatch')
      .find('>.newpassword2>.chgpwd')[p1 != p2
        ? 'removeClass'
        : 'addClass']
      ('active')
  })
  .on('keydown', '>.form>.field>[enter]', e => {
    if (e.keyCode === 13) {
      e.preventDefault()

      $(e.currentTarget)
        .parent()
        .find(`>.${$(e.currentTarget).attr('enter')}`)
        .click()
    }
  })
  .on('click', '>.form.editing>.newpassword2>.chgpwd.active', e => {
    e.stopPropagation()

    let $login = $(e.delegateTarget)
    if ($login.find('>.form').hasClass('mismatch')) {
      return
    }

    $.ajax({
      url: `/auth/${$login.attr('id')}`,
      method: 'PATCH',
      data: JSON.stringify({
        old: {
          id: $login.attr('id'),
          password: $login.find('>.form>.password>input').val(),
        },
        new: {
          id: $login.attr('id'),
          password: $login.find('>.form>.newpassword2>input').val(),
        },
      }),
      success: _ => ($login.trigger('deactivate'), alert('password changed')),
      error: console.log,
    })
  }))
