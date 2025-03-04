$(_ => {
  $.valHooks.number = { get: (elem) => elem.value * 1 }
})
