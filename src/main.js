class Application {
  constructor() {
    this.tuner = new Tuner()
    this.notes = new Notes('.notes', this.tuner)
    this.meter = new Meter('.meter')
    this.frequencyBars = new FrequencyBars('.frequency-bars')
    this.update({name: 'A', frequency: 440, octave: 4, value: 69, cents: 0})
  }

  start() {
    this.tuner.onNoteDetected = note => {
      if (this.notes.isAutoMode) {
        if (this.lastNote === note.name) {
          this.update(note)
        } else {
          this.lastNote = note.name
        }
      }
    }


    this.tuner.init()
    this.frequencyData = new Uint8Array(this.tuner.analyser.frequencyBinCount)

    if (!/Android/i.test(navigator.userAgent)) {
      this.updateFrequencyBars()
    }
  }

  updateFrequencyBars() {
    if (this.tuner.analyser) {
      this.tuner.analyser.getByteFrequencyData(this.frequencyData)
      this.frequencyBars.update(this.frequencyData)
    }
    requestAnimationFrame(this.updateFrequencyBars.bind(this))
  }

  update(note) {
    this.notes.update(note)
    this.meter.update((note.cents / 50) * 45)
  }

  toggleAutoMode() {
    this.notes.toggleAutoMode()
  }
}

const app = new Application()
app.start()
