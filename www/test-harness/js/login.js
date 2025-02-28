$(_ => $('body>.login')

  // setup/teardown
  .on('init', (e, username = 'stranger') => $(e.currentTarget)
    .find('input#username')
    .val(username)
    // - sets login-menu>control text 
    // - re-sets localStorage
    // - if found, sets login ID attr
    .trigger('keyup'))
  .on('check-valid', e => $.ajax({
    url: '/valid',
    method: 'GET',
    statusCode: {
      302: _ => $(e.currentTarget).trigger('deactivate'),
      403: _ => $(e.delegateTarget).trigger('activate'),
    },
    // error: _ => _,
  }))
  .on('activate', e => {
    if ($('body').hasClass('authing')) {
      return
    }

    $(e.delegateTarget)
      .removeClass('cancelable')
      .find('>.form')
      .removeClass('mismatch adding pwding')
      .find('input[type="password"]').val('')

    $(document.body)
      .addClass('authing')
      .find('input#username')
      .trigger('test')
  })
  .on('deactivate', e => $(document)
    .trigger($(document)
      .data('forbidden').length === 0
      ? 'reload'
      : 'unforbidden')
    .find('body')
    .removeClass('authing')
    .find('>.login')
    .removeClass('cancelable')
    .find('>.form')
    .trigger('clear')
    .find('input[type="password"]')
    .val(''))
  .on('clear', '>.form', e => $(e.currentTarget)
    .removeClass('adding pwding editing forgetting email-cell-required'))

  // menu commands
  .on('click', '>.login-menu>.commands>.cancel', e => $(e.delegateTarget)
    .trigger('deactivate'))
  .on('click', '>.login-menu>.commands>.change-auth', e => $(e.delegateTarget)
    .trigger('activate')
    .addClass('cancelable')
    .find('>.form')
    .addClass('pwding'))
  .on('click', '>.login-menu>.commands>.edit-user', e => $(e.delegateTarget)
    .trigger('activate')
    .addClass('cancelable')
    .find('>.form')
    .addClass('editing'))
  .on('click', '>.login-menu>.commands>.logout', e => $.ajax({
    url: './logout',
    method: 'POST',
    statusCode: {
      204: _ => $(document.body).find('>.notification').trigger('activate', [
        'info',
        'POST - /logout',
        'logout succeeded',
        { timeout: 10 },
      ]),
      403: _ => $(document.body).find('>.notification').trigger('activate', [
        'error',
        'POST - /logout',
        'logout failed',
        { timeout: 10 },
      ]),
    },
    error: console.log,
    complete: _ => $(e.delegateTarget).trigger('activate'),
  }))

  // manage username
  .on('focus', '>.form>.username>input', e => $(e.currentTarget).trigger('test'))
  .on('blur', '>.form>.username>input', e => $(e.currentTarget).trigger('test'))
  .on('keyup', '>.form>.username>input', e => {
    // FIXME: blacklist buttons like tab, meta-only sequences, etc
    let $uname = $(e.currentTarget)

    clearTimeout($uname.data('timeout') || -1)

    $(e.delegateTarget)
      .find('>.login-menu>.control')
      .text($uname.val())

    $uname.data('timeout', setTimeout(_ => { $uname.trigger('test') }, 100))
  })
  .on('test', '>.form>.username>input', e => {
    let $login = $(e.delegateTarget)
    let val = $(e.currentTarget)
      .removeData('timeout')
      .val()

    // focus/keyup/blur events tend to come in pairs, but only one 
    // is needed, 50ms seems like a really long time, but probably 
    // not noticable
    let now = new Date().getTime()
    let last = $(e.currentTarget).data('last')
    if (now - ~~last < 50) {
      console.log('duplicate')
      return
    }
    $(e.currentTarget).data('last', now) // here, or in success only?

    $.ajax({
      url: `/auth/${val}`,
      method: "GET",
      success: auth => {
        $login.attr('id', auth.id)
        localStorage.setItem("username", val)
      },
      error: _ => $login
        .removeAttr('id')
        .trigger('activate'),
      complete: _ => $login
        .find('>.form')
        .removeClass('pwding')
        .find('>.password>input')
        .prop('readonly', !$login.attr('id')),
    })
  })

  // buttons
  .on('click', '>.form>.username>.create.active', e => {
    $(e.delegateTarget)
      .find('>.form')
      .addClass('adding pwding email-cell-required')
      .find('>.edit>input, >.user>input')
      .val('')

    $(e.delegateTarget).find('>.form>.user>#firstname').focus()
  })
  .on('click', '>.form:not(.pwding)>.password>.login.active', e => {
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
  .on('click', '>.form>.password>.reset.active', e => $(e.delegateTarget)
    .find('>.form')
    .addClass('forgetting'))
  .on('click', '>.form.pwding>.newpassword2>.chgpwd.active', e => {
    e.stopPropagation()

    let $login = $(e.delegateTarget)
    let $form = $login.find('>.form')
    if ($form.hasClass('mismatch')) {
      return
    }

    if ($form.hasClass('adding')) {
      $.ajax({
        url: "/user",
        method: 'POST',
        data: JSON.stringify({
          username: $("#username").val(),
          email: $('#email').val() || null,
          cell: $('#cell').val() || null,
        }),
        statusCode: {
          201: xhr => $login
            .attr('id', xhr.responseText)
            .trigger('update-auth'),
          409: xhr => alert('username not valid')
        },
        error: err => console.log('.chgpwd::click', err),
      })
    } else {
      $login.trigger('update-auth')
    }
  })
  .on('update-auth', (e, data) => {
    let $login = $(e.delegateTarget)
    let url = `/auth/${$login.attr('id')}`
    $.ajax({
      url: url,
      method: 'PATCH',
      data: JSON.stringify({
        old: $login.find('>.form>.password>input').val(),
        new: $login.find('>.form>.newpassword2>input').val(),
      }),
      success: _ => ($login.trigger('deactivate'),
        $('body>.notification').trigger('activate', [
          'info',
          `PATCH - ${url}`,
          'password changed',
        ])),
      error: err => $('body>.notification').trigger('activate', [
        'info',
        `PATCH - ${url}`,
        'password changed',
      ]),
    })
  })

  // input helpers
  .on('keyup', '>.form>.field>input[enter][minlength]', e => {
    let $in = $(e.currentTarget)
    let $btn = `>.${$in.attr('enter')}`
    let fn = ($in.val().length < $in.attr('minlength') ? 'remove' : 'add') + 'Class'

    $in.parent().find($btn)[fn]('active')
  })
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

  // MFA controls
  .on('keyup', '>.form>.mfa>input#email', e => {
    let $eml = $(e.currentTarget)
    $eml
      .parent()
      .withClass('invalid', !/^[^@]+@[^.]+\.[A-z]{2,3}$/.test($eml.val()))
  })
  .on('keyup', '>.form>.mfa>input#cell', e => {
    let $cell = $(e.currentTarget)
    $cell
      .parent()
      .withClass('invalid', !$('#cell').val().replace(/[^0-9]/g, '').length === 10)
  })
  .on('keyup', '>.form>.mfa>input', e => {
    let $form = $(e.delegateTarget).find('>.form')
    $form
      .withClass('email-cell-required', $form.find('.mfa.invalid').length > 0)
  })

  // text buttons
  .on('click', '>.form>.save-user', e => {
    console.log('save user', $('.user, .contact'))
  })
  .on('click', '>.form>.delete-auth', e => {
    let $login = $(e.delegateTarget)

    $.ajax({
      url: `/auth/${$login.attr('id')}`,
      method: 'DELETE',
      data: JSON.stringify({
        id: $login.attr('id'),
        email: $('#email').val() || null,
        cell: $('#cell').val().replace(/[^0-9]/, '') || null,
      }),
      success: _ => $(e.delegateTarget)
        .find('>.form')
        .addClass('adding pwding')
        .find('>.edit>input')
        .val('')
        .focus(),
      error: _ => $login.find('#email').val('').focus(),
    })
  })
  .on('click', '>.form>.toggle-change', e => {
    let $form = $(e.delegateTarget).find('>.form')
    if ($form.get(0).className.trim() === 'form') {
      $form.addClass('pwding')
    }
  })
  .on('click', '>.form.adding>.toggle-change', e => $(e.delegateTarget)
    .find('>.form')
    .removeClass('adding'))
  .on('click', '>.form.editing>.toggle-change', e => $(e.delegateTarget)
    .find('>.form')
    .removeClass('editing'))
  .on('click', '>.form.pwding>.toggle-change', e => $(e.delegateTarget)
    .find('>.form')
    .removeClass('pwding'))
  .on('click', '>.form.forgetting>.toggle-change', e => $(e.delegateTarget)
    .find('>.form')
    .removeClass('forgetting'))

  .trigger('init', localStorage.username))
