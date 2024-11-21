$(_ => $('body>.login')
  .on('init', (e, username) => {
    if (!username) {
      username = 'stranger'
    }

    let $login = $(e.delegateTarget)

    $login
      .find('input#username')
      .val(username)
      // - sets login-menu>control text 
      // - re-sets localStorage
      // - if found, sets login ID attr
      .trigger('change')

    $.ajax({
      url: '/valid',
      method: 'GET',
      statusCode: {
        302: _ => $login.trigger('deactivate'),
        403: _ => $('body')
          .addClass('authing')
          .find('>.login>.form')
          .removeClass('mismatch adding editing cancelable')
          .find('input#password').val(''), // $login.trigger('activate'),
      },
      // error: _ => _,
    })
  })
  .on('activate', e => {
    let $login = $(e.delegateTarget)

    $login
      .find('>.form')
      .removeClass('mismatch adding editing cancelable')
      .find('input[type="password"]').val('')

    $('body')
      .addClass('authing')
      .find('input#username')
      .trigger('change')
  })
  .on('deactivate', e => {
    let evt = 'unforbidden'
    if ($(document).data('forbidden').length === 0) {
      evt = 'reload'
    }

    $(document)
      .trigger(evt)
      .find('body')
      .removeClass('authing')
      .find('>.login')
      .removeClass('cancelable')
      .find('input[type="password"]')
      .val('')
  })
  .on('click', '>.login-menu>.commands>.cancel', e => $(e.delegateTarget)
    .trigger('deactivate'))
  .on('click', '>.login-menu>.commands>.change-auth', e => $(e.delegateTarget)
    .trigger('activate')
    .addClass('cancelable')
    .find('>.form')
    .addClass('editing'))
  .on('click', '>.login-menu>.commands>.logout', e => $.ajax({
    url: '/logout',
    method: 'POST',
    statusCode: {
      204: _ => alert('logged out'),
      403: _ => alert('logout failed'),
    },
    error: console.log,
    complete: _ => $(e.delegateTarget).trigger('activate'),
  }))
  .on('change', '>.form>.username>input', e => {
    let $login = $(e.delegateTarget)

    let val = $(e.currentTarget).val()
    $login
      .find('>.login-menu>.control')
      .text(val)

    localStorage.setItem("username", val)

    $.ajax({
      url: `/auth/${$(e.currentTarget).val()}`,
      method: "GET",
      async: false,
      statusCode: {
        302: xhr => $login.attr('id', xhr.responseJSON.id),
      },
      error: _ => $login
        .removeAttr('id')
        .find('input#username')
        .trigger('keyup'),
      complete: _ => $login
        .find('>.form')
        .removeClass('editing')
        .find('>.password>input')
        .prop('readonly', !$login.attr('id'))
        .focus(),
    })
  })
  .on('click', '>.form>.username>.create.active', e => $.ajax({
    url: "/user",
    method: 'POST',
    data: JSON.stringify({ username: $(e.currentTarget).prev().val() }),
    statusCode: {
      201: xhr => $(e.delegateTarget)
        .attr('id', xhr.responseText)
        .find('>.form')
        .addClass('adding editing')
        .find('>.edit>input')
        .val('')
        .focus(),
      409: xhr => alert('username not valid')
    },
    error: _ => $(e.currentTarget).val('').focus(),
  }))
  .on('keyup', '>.form>.field>input[enter][minlength]', e => {
    let $in = $(e.currentTarget)
    let $btn = `>.${$in.attr('enter')}`
    let fn = ($in.val().length < $in.attr('minlength') ? 'remove' : 'add') + 'Class'

    $in.parent().find($btn)[fn]('active')
  })
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
  })
  .trigger('init', localStorage.getItem('username')))
