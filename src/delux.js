/**
 * Delux
 * Extended API controller for Luxafor USB lights with some fancy presets.
 *
 * @author Matt Scheurich <matt@blacksmith.studio>
 */

"use strict"

/**
 * Dependencies
 */
const Luxafor = require('luxafor-api')
const merge = require('lodash').merge
const Color = require('color')

/**
 * Constants
 */
const TARGET_ALL = 0xFF
const TARGET_TOP = 0x41
const TARGET_BOTTOM = 0x42
const TARGET_1 = 0x01
const TARGET_2 = 0x02
const TARGET_3 = 0x03
const TARGET_4 = 0x04
const TARGET_5 = 0x05
const TARGET_6 = 0x06
const TARGET_EACH_ALL = [TARGET_1, TARGET_2, TARGET_3, TARGET_4, TARGET_5, TARGET_6]
const TARGET_EACH_TOP = [TARGET_1, TARGET_2, TARGET_3]
const TARGET_EACH_BOTTOM = [TARGET_4, TARGET_5, TARGET_6]

/**
 * Delux
 *
 * @param {Object} settings
 * @returns {Delux}
 * @constructor
 */
function Delux (settings) {
  /**
   * Settings for the Delux instance
   *
   * @type {Object}
   * @private
   */
  this._settings = merge({
    /**
     * Brightness value
     *
     * @type {Float} Value from 0 to 1 (e.g. 0.5)
     * @default 1
     */
    brightness: 1,

    /**
     * Color transition speed value
     *
     * @type {Number} from 0-255
     * @default 20
     */
    speed: 20,

    /**
     * Default sequence options
     */
    sequence: {
      /**
       * Loop the sequence
       *
       * @type {Boolean}
       */
      loop: false,

      /**
       * The specific information for the sequence's steps
       * Each entry in the steps should be a single {Array} which corresponds to `Delux.fadeTo` function
       * Alternatively, the step can be a function which returns an {Array} to apply to the `Delux.fadeTo` function
       *
       * @type {Array|Function}
       */
      steps: [],

      /**
       * The cycle speed for the sequence's steps
       *
       * @type {Number} in milliseconds
       */
      cycleSpeed: 200
    },

    /**
     * Default meeting options
     */
    meeting: {
      /**
       * The time of the total meeting.
       *
       * @type {Number} in minutes
       * @default 45
       */
      totalTime: 45,

      /**
       * The time of alternations, to signal when people should change what they talk about or to move on from the current discussion.
       *
       * @type {Number} in minutes
       * @default 0
       */
      alternateTime: 0,

      /**
       * The time before the end of the meeting in which people should be warned it will end soon.
       *
       * @type {Number} in minutes
       * @default 5
       */
      warnTime: 5,

      /**
       * The color to signify the meeting is in session.
       *
       * @type {Hex|String}
       * @default #00FF00
       */
      color: '#00FF00',

      /**
       * The color to signify an alternation within meeting. This will swap between the regular color at each alternate intervals.
       *
       * @type {Hex|String}
       * @default #00F
       */
      alternateColor: '#0000FF',

      /**
       * The color to signify an alternation within meeting. This will swap between the regular color at each alternate intervals.
       *
       * @type {Hex|String}
       * @default #00F
       */
      warnColor: '#FFFF00',

      /**
       * The color to signify an alternation within meeting. This will swap between the regular color at each alternate intervals.
       *
       * @type {Hex|String}
       * @default #00F
       */
      endColor: '#FF0000',

      /**
       * Whether to animate each stage, or not.
       *
       * @type {Boolean}
       * @default true
       */
      animated: true
    },

    /**
     * LED target settings
     * Each target has its own individual settings for brightness and speed.
     * If a target is specifically used, then the target settings will be used to affect the color brightness and transition speed.
     *
     * @type {Object}
     */
    targets: {
      TARGET_1: {
        brightness: undefined,
        speed: undefined
      },
      TARGET_2: {
        brightness: undefined,
        speed: undefined
      },
      TARGET_3: {
        brightness: undefined,
        speed: undefined
      },
      TARGET_4: {
        brightness: undefined,
        speed: undefined
      },
      TARGET_5: {
        brightness: undefined,
        speed: undefined
      },
      TARGET_6: {
        brightness: undefined,
        speed: undefined
      },
      TARGET_TOP: {
        brightness: undefined,
        speed: undefined
      },
      TARGET_BOTTOM: {
        brightness: undefined,
        speed: undefined
      },
      TARGET_ALL: {
        brightness: undefined,
        speed: undefined
      }
    },

    /**
     * Presets with settings
     */
    presets: {
      available: {
        target: TARGET_TOP,
        color: '#0F0'
      },
      busy: {
        target: TARGET_TOP,
        color: '#F00'
      }
    },

    /**
     * Luxafor instance defaults
     */
    defaults: {
      setColor: {
        target: TARGET_ALL
      },
      fadeTo: {
        target: TARGET_TOP,
        speed: 20
      },
      flash: {
        target: TARGET_TOP,
        speed: 180,
        repeat: 5
      },
      wave: {
        type: 2,
        speed: 90,
        repeat: 5
      }
    }
  }, settings)

  /**
   * The Luxafor instance
   *
   * @type {Luxafor}
   * @private
   */
  this._luxafor = new Luxafor({
    defaults: this._settings.defaults
  })

  /**
   * The current sequence timer running
   *
   * @type {Timeout}
   */
  this._currentSequence = undefined

  /**
   * Any error that occurred in the Luxafor instance will be collected here
   *
   * @type {Error}
   */
  this._error = undefined

  return this
}

/**
 * The prototype object to assign to new Delux instances
 *
 * @type {Object}
 */
Delux.prototype = {
  /**
   * Get a color with any necessary modifications already made (e.g. brightness, etc.)
   *
   * @param {Hex/String/Array} color in RGB, e.g. `0xFFCC99`, `'#FFCC99'`, `[127, 255, 0]`
   * @param {Hex/Number} target
   * @return {Color}
   */
  getColor (color, target) {
    // Ensure color string has hash at start
    if (typeof color === 'string' && !/^#/.test(color)) {
      // Test if preset keyword
      if (Object.keys(this._settings.presets).includes(color)) {
        return this.getColor(this._settings.presets[color].color || '#fff')

        // Else make color compatible with #RRGGBB notation
      } else {
        color = `#${color}`
      }
    }

    let getColor = new Color(color).hsl().round().object()
    let brightness = (target && this._settings.targets.hasOwnProperty(target) && typeof this._settings.targets[target].brightness !== 'undefined' ? this._settings.targets[target].brightness : this._settings.brightness)
    return Color.hsl([
      getColor.h,
      getColor.s,
      getColor.l * brightness
    ]).rgb().round().hex()
  },

  /**
   * Get the transition speed (in milliseconds)
   *   - If you specify the target, you get the target's transition speed as set at `settings.leds[target].speed`
   *   - If you specify the method, you get the method's transition speed, as set at `settings.defaults[method].speed`
   *   - If you specify the preset, you get the preset's transition speed, as set at `settings.presets[preset].speed`
   *
   * @param {Hex/Number} target
   * @param {String} method
   * @param {String} preset
   * @return {Number}
   */
  getSpeed (target, method, preset) {
    let targetSpeed = (target && this._settings.targets.hasOwnProperty(target) && typeof this._settings.targets[target].speed !== 'undefined' ? this._settings.targets[target].speed : this._settings.speed)
    let methodSpeed = (method && this._settings.defaults.hasOwnProperty(method) && this._settings.defaults[method].hasOwnProperty('speed') && typeof this._settings.defaults[method].speed !== 'undefined' ? this._settings.defaults[method].speed : this._settings.speed)
    let presetSpeed = (preset && this._settings.presets.hasOwnProperty(preset) && this._settings.presets[preset].hasOwnProperty('speed') && typeof this._settings.presets[preset].speed !== 'undefined' ? this._settings.presets[method].speed : this._settings.speed)
    return (preset ? presetSpeed : (method ? methodSpeed : targetSpeed))
  },

  /**
   * Get target
   *
   * @param {String} preset
   * @return {Hex}
   */
  getTarget(method, preset) {
    let methodTarget = (method && this._settings.defaults.hasOwnProperty(method) && this._settings.defaults[method].hasOwnProperty('target') && typeof this._settings.defaults[method].target !== 'undefined' ? this._settings.defaults[method].target : TARGET_ALL)
    let presetTarget = (preset && this._settings.presets.hasOwnProperty(preset) && this._settings.presets[preset].hasOwnProperty('target') && typeof this._settings.presets[preset].target !== 'undefined' ? this._settings.presets[method].target : TARGET_ALL)
    return (preset ? presetTarget : (method ? methodTarget : TARGET_ALL))
  },

  /**
   * Check to see if Luxafor API call produced an error and deal with it on the Delux instance.
   *
   * @param {Mixed} status
   */
  didError (status) {
    if (status instanceof Error) {
      this._error = status
      console.warn('didError', this._error)
    } else {
      this.resetError()
    }
    return this._error
  },

  /**
   * Reset and clear any previous errors
   */
  resetError () {
    this._error = undefined
  },

  /**
   * Get the status of the Luxafor instance.
   *
   * If {Boolean} true, then everything's good :)
   *
   * @return {Error|Boolean}
   */
  getStatus () {
    return (this._error instanceof Error ? this._error : true)
  },

  /**
   * Turn all LEDs off and stops any sequences
   * Mimics `Luxafor.off`
   *
   * @return {Delux}
   */
  off () {
    this.stopSequence()
    this.didError(this._luxafor.off())
    return this
  },

  /**
   * Set target LED to off
   *
   * @param {Hex} target LEDs are from 0x01 to 0x06, Top row is 0x41, Bottom row is 0x42 and all is 0xFF (default)
   * @return {Delux}
   */
  setToOff (target) {
    this.didError(this._luxafor.setColor('#000000', target))
    return this
  },

  /**
   * Fade target LED to off
   *
   * @param {Hex} target LEDs are from 0x01 to 0x06, Top row is 0x41, Bottom row is 0x42 and all is 0xFF (default)
   * @param {Number} speed
   * @return {Delux}
   */
  fadeToOff (target, speed) {
    let useSpeed = speed || this.getSpeed(target)
    this.didError(this._luxafor.fadeTo('#000000', target, useSpeed))
    return this
  },

  /**
   * Set target LED to color
   * Mimics `Luxafor.setColor`
   *
   * @param {Hex/String} color
   * @param {Hex} target
   * @return {Delux}
   */
  setColor (color, target) {
    // console.log('Delux.setColor', ...arguments)
    let useColor = this.getColor(color, target)
    this.didError(this._luxafor.setColor(useColor, target))
    return this
  },

  /**
   * Fade target LED to color
   * Mimics `Luxafor.setColor`
   *
   * @param {Hex/String} color
   * @param {Hex} target
   * @param {Number} speed
   * @return {Delux}
   */
  fadeTo (color, target, speed) {
    // console.log('Delux.fadeTo', ...arguments)
    let useColor = this.getColor(color, target)
    let useSpeed = speed || this.getSpeed(target, 'fadeTo')
    this.didError(this._luxafor.fadeTo(useColor, target, useSpeed))
    return this
  },

  /**
   * Flash the LEDs with a color
   * Mimics `Luxafor.flash`
   *
   * @param {Hex/String} color
   * @param {Number} speed Speed of wave (from 0-255)
   * @param {Number} repeat Times to repeat wave
   */
  flash (color, speed, repeat) {
    // console.log('Delux.flash', ...arguments)
    let useColor = this.getColor(color)
    let useSpeed = speed || this._settings.flashSpeed
    let useRepeat = repeat || this._settings.flashRepeat
    this.didError(this._luxafor.flash(useColor, useSpeed, useRepeat))
    return this
  },

  /**
   * Wave through the LEDs with a color
   * Mimics `Luxafor.wave`
   *
   * Supported Luxafor wave types:
   *   - `1`: short wave
   *   - `2`: long wave
   *   - `3`: overlapping short wave
   *   - `4`: overlapping long wave
   *
   * @param {Hex/String} color
   * @param {Number} type Type of wave (from 1-4)
   * @param {Number} speed Speed of wave (from 0-255)
   * @param {Number} repeat Times to repeat wave
   */
  wave (color, type, speed, repeat) {
    // console.log('Delux.wave', ...arguments)
    let useColor = this.getColor(color)
    let useType = type || this._settings.waveType
    let useSpeed = speed || this._settings.waveSpeed
    let useRepeat = repeat || this._settings.waveRepeat
    this.didError(this._luxafor.wave(useColor, useType, useSpeed, useRepeat))

    return this
  },

  /**
   * Set a sequence to play through
   *
   * @param {Object} options
   * @returns {Delux}
   */
  setSequence (options) {
    // console.log('Delux.setSequence', ...arguments)

    // Default options
    let _options = merge({}, this._settings.sequence, options)

    // Error
    if (!_options.steps) {
      throw new Error('Delux.setSequence: no steps were defined')
    }

    // Tracking
    let timer = 0                 // The setInterval timer which is animating the sequence
    let currentStepIndex = -1     // The index of the current step
    let currentStep = undefined   // The current step data
    let nextStepIndex = 0         // The index of the next step
    let nextStep = undefined      // The next step data
    let loops = 0                 // The number of loops the sequence has made

    // Get the next step
    let getNextStep = () => {
      // Steps is array
      if (_options.steps instanceof Array) {
        // Get next step
        if (nextStepIndex >= 0 && nextStepIndex < _options.steps.length) {
          currentStepIndex = nextStepIndex
          nextStepIndex++

          // Loop sequence
          if (_options.loop && nextStepIndex >= _options.steps.length) {
            nextStepIndex = 0
            loops++
          }

          // Return the step's details
          return _options.steps[currentStepIndex]
        }

        // Steps is function which will manage its own loop
      } else if (typeof _options.steps === 'function') {
        return _options.steps({
          _options,
          timer,
          currentStepIndex,
          nextStepIndex,
          loops
        })
      }
    }

    // Set the next step
    let setNextStep  = (step) => {
      nextStep = getNextStep()

      // Handle the next step details
      if (nextStep && nextStep instanceof Array) {
        currentStep = nextStep

        // Do next step only if no errors
        if (!this._error) {
          // Fade to the nextStep details
          this.fadeTo(...nextStep)

          // Stop the sequence on errors
        } else {
          // console.log('Delux.setSequence: Error during sequence', this._error)
          this.off()
        }
      }

      // Custom step functions should return a truthy value
      // If they return a falsey value, the sequence will be stopped in the timer

      return nextStep
    }

    // Program the looped sequence
    // @TODO each step could set it's own cycleSpeed too. This would require nested setTimeout
    timer = setInterval(() => {
      nextStep = setNextStep()

      // Stop the sequence if step is falsey
      if (!nextStep) {
        this.stopSequence()
        clearInterval(timer)
      }
    }, _options.cycleSpeed)

    // Set the current sequence
    this.stopSequence()
    this._currentSequence = timer

    return this
  },

  /**
   * Stop sequence
   *
   * @return {Delux}
   */
  stopSequence () {
    if (this._currentSequence) {
      // console.log('Delux.stopSequence')
      clearInterval(this._currentSequence)
    }
    return this
  },

  /**
   * Set to available
   *
   * @return {Delux}
   */
  setAvailable () {
    return this.off().setColor('available')
  },

  /**
   * Set to busy
   *
   * @return {Delux}
   */
  setBusy () {
    return this.off().setColor('busy')
  },

  /**
   * Set to random
   *
   * @param {Hex} target
   * @param {Hex} target From 0x01 to 0x06
   * @param {Number} speed
   * @return {Delux}
   */
  setRandom (target, speed) {
    let {
      useColor,
      useSpeed
    } = {
      useColor: this.getColor([
        Math.random() * 255,
        Math.random() * 255,
        Math.random() * 255
      ], target),
      useSpeed: speed || this.getSpeed(target)
    }
    return this.stopSequence().fadeTo(useColor, target, useSpeed)
  },

  /**
   * Set to disco mode
   *
   * @param {Number} cycleSpeed
   * @return {Delux}
   */
  setDisco (cycleSpeed) {
    // Set the sequence for the bottom row
    return this.off().setSequence({
      loop: true,
      steps: () => {
        let target = TARGET_EACH_ALL[Math.floor(Math.random() * TARGET_EACH_ALL.length)]

        // Get color relative to target
        let color = this.getColor([
          Math.random() * 255,
          Math.random() * 255,
          Math.random() * 255
        ], target)

        return [color, target]
      },
      cycleSpeed
    })
  },

  /**
   * Set to France mode
   *
   * @return {Delux}
   */
  setFrance () {
    return this.off()
      .fadeTo('#00F', TARGET_1)
      .fadeTo('#FFF', TARGET_2)
      .fadeTo('#F00', TARGET_3)
      .fadeTo('#00F', TARGET_4)
      .fadeTo('#FFF', TARGET_5)
      .fadeTo('#F00', TARGET_6)
  },

  /**
   * Set to meeting mode
   *
   * @return {Delux}
   */
  setMeeting (options) {
    // console.log('Delux.setMeeting', ...arguments)

    let _options = merge({}, this._settings.meeting, options)

    // console.log('Delux.setMeeting._options', JSON.stringify(_options))

    // Track
    let currentColor = _options.color
    let currentColorOdd = new Color(currentColor).darken(0.5).hex()
    // -- Current time (in seconds)
    let currentTime = 0
    // -- Convert time to seconds
    let alternateTime = _options.alternateTime * 60
    let endTime = _options.totalTime * 60
    let warnTime = endTime - (_options.warnTime * 60)

    // Start!
    return this.off().flash(currentColor, 90, 5).setSequence({
      loop: true,
      steps: () => {
        currentTime++
        // console.log(`Meeting: ${Math.ceil((currentTime / endTime) * 100)}%`)

        // Meeting is still going
        if (currentTime < warnTime) {
          // Alternate
          if (alternateTime && currentTime % alternateTime === 0) {
            // console.log(`Alternate!`)

            if (currentColor === _options.alternateColor) {
              currentColor = _options.color
              currentColorOdd = new Color(currentColor).darken(0.5).hex()
            } else {
              currentColor = _options.alternateColor
              currentColorOdd = new Color(currentColor).darken(0.5).hex()
            }
          }

          if (_options.animated) {
            if (currentTime % 2) {
              this.fadeTo(currentColorOdd, TARGET_TOP, 90)
            } else {
              this.fadeTo(currentColor, TARGET_TOP, 90)
            }
          } else {
            this.setTo(currentColor)
          }

          // Warn meeting is about to end
        } else if (currentTime >= warnTime && currentTime < endTime) {
          // console.log(`Warning: meeting will end in ${_options.warnTime} minutes`)

          if (currentColor !== _options.warnColor) {
            currentColor = _options.warnColor
            currentColorOdd = new Color(_options.warnColor).darken(0.5).hex()

            if (_options.animated) {
              if (currentTime % 2) {
                this.fadeTo(currentColorOdd, TARGET_TOP, 90)
              } else {
                this.fadeTo(currentColor, TARGET_TOP, 90)
              }
            } else {
              this.setTo(currentColor)
            }
          }

          // Meeting has ended!
        } else if (currentTime >= endTime) {
          // console.log('Meeting has ended!')

          if (currentColor !== _options.warnColor) {
            currentColor = _options.endColor
            currentColorOdd = _options.endColor

            if (_options.animated) {
              this.fadeTo(currentColor, TARGET_TOP, 90)
            } else {
              this.setColor(currentColor, TARGET_TOP)
            }
          }

          return false
        }

        // console.log('Delux.setMeeting.step', JSON.stringify({
        //   currentTime,
        //   warnTime,
        //   endTime,
        //   currentColor
        // }))

        // Step should return true value to continue
        return true
      },

      // Check every second
      cycleSpeed: 1000
    })
  }
}

module.exports = Delux
