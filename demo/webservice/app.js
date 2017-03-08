import config from 'config'
import Server from './drivers/server'
import Delux from '../../src/delux'

export default function App (env, callback) {
  var app = {
    root: __dirname,
    config: undefined,
    routes: {},
    modules: {}
  }

  // Setup config
  app.config = config.get('web')

  // Setup server instance
  app.server = new Server(app).create()

  // Setup app modules
  app.modules.delux = new Delux({
    brightness: 0.2,
    leds: {
      0x04: {
        brightness: 0.1
      },
      0x05: {
        brightness: 0.1
      },
      0x06: {
        brightness: 0.1
      },
      0x04: {
        brightness: 0.5
      },
      0x05: {
        brightness: 0.5
      },
      0x06: {
        brightness: 0.5
      },
      0x41: {
        brightness: 0.1
      },
      0x42: {
        brightness: 0.5
      }
    }
  })

  // Setup basic routes
  app.server.addRoutes({
    '/': (req, res) => {
      res.json({
        mode: 'ready',
        status: app.modules.delux.getStatus()
      })
    },

    /*
     * Turn off
     */
    '/off': (req, res) => {
      app.modules.delux.off()
      res.json({
        mode: 'off',
        status: app.modules.delux.getStatus()
      })
    },

    /*
     * Set to available
     */
    '/available': (req, res) => {
      app.modules.delux.setAvailable()
      res.json({
        mode: 'available',
        status: app.modules.delux.getStatus()
      })
    },

    /*
     * Set to busy
     */
    '/busy': (req, res) => {
      app.modules.delux.setBusy()
      res.json({
        mode: 'busy',
        status: app.modules.delux.getStatus()
      })
    },

    /*
     * Set to Do Not Disturb
     */
    '/dnd': (req, res) => {
      app.modules.delux.setDoNotDisturb()
      res.json({
        mode: 'busy',
        status: app.modules.delux.getStatus()
      })
    },

    /*
     * Set to flash
     */
    '/flash': (req, res) => {
      let {
        color,
        speed,
        repeat
      } = req.query
      app.modules.delux.flash(color, speed, repeat, true)
      res.json({
        mode: 'flash',
        status: app.modules.delux.getStatus(),
        color,
        speed,
        repeat
      })
    },

    /*
     * Set to wave
     */
    '/wave': (req, res) => {
      let {
        color,
        type,
        speed,
        repeat
      } = req.query
      app.modules.delux.wave(color, type, speed, repeat)
      res.json({
        mode: 'wave',
        status: app.modules.delux.getStatus(),
        color,
        type,
        speed,
        repeat
      })
    },

    /*
     * Set to color
     */
    '/color': (req, res) => {
      let {
        color,
        target,
        speed
      } = req.query
      app.modules.delux.fadeTo(color, target, speed)
      res.json({
        mode: 'color',
        status: app.modules.delux.getStatus(),
        color,
        target,
        speed
      })
    },

    /*
     * Set to random
     */
    '/random': (req, res) => {
      app.modules.delux.setRandom()
      res.json({
        mode: 'random',
        status: app.modules.delux.getStatus()
      })
    },

    /*
     * Set to disco mode!
     */
    '/disco': (req, res) => {
      app.modules.delux.setDisco()
      res.json({
        mode: 'disco',
        status: app.modules.delux.getStatus()
      })
    },

    /*
     * Set to France
     */
    '/france': (req, res) => {
      app.modules.delux.setFrance()
      res.json({
        mode: 'france',
        status: app.modules.delux.getStatus()
      })
    },

    /*
     * Set the meeting timer
     */
    '/meeting': (req, res) => {
      let {
        totalTime,
        alternateTime,
        warnTime,
        color,
        alternateColor,
        warnColor,
        endColor,
        animated
      } = req.query
      let options = {
        totalTime,
        alternateTime,
        warnTime,
        color,
        alternateColor,
        warnColor,
        endColor,
        animated
      }
      app.modules.delux.setMeeting(options)
      res.json({
        mode: 'meeting',
        status: app.modules.delux.getStatus(),
        options
      })
    },

    /*
     * Get the status of the Delux's Luxafor instance
     */
    '/status': (req, res) => {
      res.json({
        mode: 'status',
        status: app.modules.delux.getStatus()
      })
    }
  })

  // Fire the callback after app is initialised
  callback(app)
}
