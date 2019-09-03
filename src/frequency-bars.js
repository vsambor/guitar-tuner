/**
 * Represents the frequency histogram.
 */
class FrequencyBars {
  constructor(selector) {
    this.$canvas = document.querySelector(selector)
    this.$canvas.width = document.body.clientWidth
    this.$canvas.height = document.body.clientHeight / 2
    this.canvasContext = this.$canvas.getContext('2d')
  }

  update(data) {
    const length = 64
    const width = this.$canvas.width / length - 0.5
    this.canvasContext.clearRect(0, 0, this.$canvas.width, this.$canvas.height)

    for (var i = 0; i < length; ++i) {
      this.canvasContext.fillStyle = '#ecf0f1'
      this.canvasContext.fillRect(i * (width + 0.5), this.$canvas.height - data[i], width, data[i])
    }
  }
}
