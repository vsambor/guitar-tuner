class Tuner {
  constructor() {
    this.middleA = 440
    this.semitone = 69
    this.bufferSize = 4096
    this.noteStrings = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']

    this.initGetUserMedia()
  }

  init() {
    this.audioContext = new window.AudioContext()
    this.analyser = this.audioContext.createAnalyser()
    this.scriptProcessor = this.audioContext.createScriptProcessor(this.bufferSize, 1, 1)

    Aubio().then(aubio => {
      this.pitchDetector = new aubio.Pitch('default', this.bufferSize, 1, this.audioContext.sampleRate)
      this.startRecord()
    })
  }

  initGetUserMedia() {
    window.AudioContext = window.AudioContext || window.webkitAudioContext
    if (!window.AudioContext) {
      return alert('AudioContext is not supported!')
    }

    // Older browsers might not implement mediaDevices at all, so we set an empty object first
    if (navigator.mediaDevices === undefined) {
      navigator.mediaDevices = {}
    }

    // Some browsers partially implement mediaDevices. We can't just assign an object
    // with getUserMedia as it would overwrite existing properties.
    // Here, we will just add the getUserMedia property if it's missing.
    if (navigator.mediaDevices.getUserMedia === undefined) {
      navigator.mediaDevices.getUserMedia = constraints => {
        // First get ahold of the legacy getUserMedia, if present
        const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia

        // Some browsers just don't implement it - return a rejected promise with an error
        // to keep a consistent interface
        if (!getUserMedia) {
          alert('getUserMedia is not implemented in this browser!')
        }

        // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
        return new Promise((resolve, reject) =>
          getUserMedia.call(navigator, constraints, resolve, reject))
      }
    }
  }

  startRecord() {
    navigator.mediaDevices
      .getUserMedia({audio: true})
      .then(stream => {
        this.audioContext.createMediaStreamSource(stream).connect(this.analyser)
        this.analyser.connect(this.scriptProcessor)
        this.scriptProcessor.connect(this.audioContext.destination)
        this.scriptProcessor.addEventListener('audioprocess', event => {
          const frequency = this.pitchDetector.do(event.inputBuffer.getChannelData(0))
          if (frequency && this.onNoteDetected) {
            const note = this.getNote(frequency)
            this.onNoteDetected({
              name: this.noteStrings[note % 12],
              value: note,
              cents: this.getCents(frequency, note),
              octave: parseInt(note / 12) - 1,
              frequency: frequency
            })
          }
        })
      })
      .catch((error) => {
        alert(error.name + ': ' + error.message)
      })
  }

  /**
   * Gets musical note from frequency.
   *
   * @param {number} frequency
   * @returns {number}
   */
  getNote(frequency) {
    const note = 12 * (Math.log(frequency / this.middleA) / Math.log(2))
    return Math.round(note) + this.semitone
  }

  /**
   * Gets the musical note's standard frequency.
   *
   * @param note
   * @returns {number}
   */
  getStandardFrequency(note) {
    return this.middleA * Math.pow(2, (note - this.semitone) / 12)
  }

  /**
   * Gets cents difference between given frequency and musical note's standard frequency.
   *
   * @param {number} frequency
   * @param {number} note
   * @returns {number}
   */
  getCents(frequency, note) {
    return Math.floor((1200 * Math.log(frequency / this.getStandardFrequency(note))) / Math.log(2))
  }

  /**
   * Plays the musical note.
   *
   * @param {number} frequency
   */
  play(frequency) {
    if (!this.oscillator) {
      this.oscillator = this.audioContext.createOscillator()
      this.oscillator.connect(this.audioContext.destination)
      this.oscillator.start()
    }
    this.oscillator.frequency.value = frequency
  }

  stop() {
    this.oscillator.stop()
    this.oscillator = null
  }
}
