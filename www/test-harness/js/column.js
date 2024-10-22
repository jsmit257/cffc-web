$(function () {

  $('.table>.columns').on('clear-sort', e => {
    $(e.currentTarget).find('[sort-order]').removeAttr('sort-order')
  })

  $('.table>.columns>.column[sort-key]')
    .append($('<div>')
      .addClass('sort-icon')
      .html('&nbsp'))
    .on('click', e => $(e.currentTarget)
      .attr('sort-order', ($(e.currentTarget).attr('sort-order') || 1) * -1)
      .parents('.table')
      .first()
      .find('.rows')
      .trigger('sort', [
        $(e.currentTarget).attr('sort-key'),
        $(e.currentTarget).attr('sort-order'),
      ]))
})
