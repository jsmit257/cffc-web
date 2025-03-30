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
