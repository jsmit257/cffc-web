"".constructor.prototype.px2int = function () {
  const result = this
    .replace(/px/g, '')
    .split(/\s+/g)
    .map(v => v * 1)
  return result.length == 1 ? result[0] : result
}

Date.prototype.localVal = function () {
  return this.toISOString().slice(0, -1)
};

DOMRect.prototype.timestampCSS = function (ts) {
  let result = {
    top: this.y - (ts.height - this.height) * 2 / 3,
    left: this.x + this.width - ts.width + 10,
  }
  if (result.top < 0) result.top = 0
  if (result.left < 0) result.left = 0

  return result
}

if (!HTMLElement.prototype.requestFullscreen) {
  HTMLElement.prototype.requestFullscreen =
    HTMLElement.prototype.mozRequestFullScreen ||
    HTMLElement.prototype.webkitRequestFullscreen ||
    HTMLElement.prototype.msRequestFullscreen ||
    function () {
      $(this).notify('warning', 'requesting fullscreen', 'no method exists for requesting fullscreen')
    }
}
