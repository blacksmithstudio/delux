/**
 * Basic Electron app
 */

const {app, BrowserWindow, ipcMain, Tray, Menu} = require('electron')
const path = require('path')
const url = require('url')
const Config = require('electron-config')
const config = new Config({
  name: 'delux',
  defaults: {
    brightness: 1,
    speed: 20,
    meeting: {
      totalTime: 45,
      alternateTime: 5,
      warnTime: 5,
      animated: true
    }
  }
})
const configState = new Config({
  name: 'deluxState',
  defaults: {
    mode: 'off'
  }
})
const Delux = require('../../src/delux')

if (process.mas) app.setName('Delux Electron App Demo')

// Please don't garbage collect me...
let mainWindow = null
let trayIcon = null
let trayMenuTemplate = null
let appDelux = null

let cmds = {
  available () {
    if (appDelux) {
      configState.set('mode', 'available')
      appDelux.setAvailable()
    }
  },
  busy () {
    if (appDelux) {
      configState.set('mode', 'busy')
      appDelux.setBusy()
    }
  },
  dnd () {
    if (appDelux) {
      configState.set('mode', 'dnd')
      appDelux.setDoNotDisturb()
    }
  },
  random () {
    if (appDelux) {
      configState.set('mode', 'random')
      appDelux.setRandom()
    }
  },
  disco () {
    if (appDelux) {
      configState.set('mode', 'disco')
      appDelux.setDisco()
    }
  },
  france () {
    if (appDelux) {
      configState.set('mode', 'france')
      appDelux.setFrance()
    }
  },
  meeting () {
    if (appDelux) {
      configState.set('mode', 'meeting')
      appDelux.setMeeting(config.get('meeting'))
    }
  },
  off () {
    if (appDelux) {
      configState.set('mode', 'off')
      appDelux.off()
    }
  }
}

app.on('ready', function () {
  // Initialise with the config data
  appDelux = new Delux(config.store)

  openMainWindow()

  // Tray menu
  if (process.platform === 'darwin') {
    trayIcon = new Tray(path.join(__dirname, 'img/tray-icon.png'))
  } else {
    trayIcon = new Tray(path.join(__dirname, 'img/tray-icon.png'))
  }
  trayMenuTemplate = [
    {
      label: 'Available',
      click () {
        cmds.available()
      }
    },{
      label: 'Busy',
      click () {
        cmds.busy()
      }
    },{
      label: 'Do Not Disturb',
      click () {
        cmds.dnd()
      }
    },{
      label: 'Random',
      click () {
        cmds.random()
      }
    },{
      label: 'Disco',
      click () {
        cmds.disco()
      }
    },{
      label: 'France',
      click () {
        cmds.france()
      }
    },{
      label: 'Meeting',
      click () {
        cmds.meeting()
      }
    },{
      label: 'Settings',
      click () {
        if (mainWindow.isDestroyed()) {
          openMainWindow()
        } else {
          mainWindow.focus()
        }
      }
    },{
      label: 'Quit',
      click () {
        cmds.off()
        app.quit()
      }
    }
  ]
  let trayMenu = Menu.buildFromTemplate(trayMenuTemplate)
  trayIcon.setContextMenu(trayMenu)
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    cmds.off()
    app.quit()
  }
})

// IPC events which can be triggered by the renderer processes
ipcMain.on('set-available', function () {
  cmds.available()
})
ipcMain.on('set-busy', function () {
  cmds.busy()
})
ipcMain.on('set-dnd', function () {
  cmds.dnd()
})
ipcMain.on('set-random', function () {
  cmds.random()
})
ipcMain.on('set-disco', function () {
  cmds.disco()
})
ipcMain.on('set-france', function () {
  cmds.france()
})
ipcMain.on('set-meeting', function () {
  cmds.meeting()
})
ipcMain.on('set-off', function () {
  cmds.off()
})
ipcMain.on('app-quit', function () {
  cmds.off()
  app.quit()
})
ipcMain.on('open-settings', function () {
  if (!mainWindow) {
    openMainWindow()
  } else {
    mainWindow.focus()
  }
})
ipcMain.on('save-settings', function (event, settings) {
  if (settings) {
    // console.log('saving settings in main', settings)
    config.set(settings)

    for (let i in settings) {
      if (settings.hasOwnProperty(i) && appDelux._settings.hasOwnProperty(i)) {
        appDelux._settings[i] = settings[i]
      }
    }

    let currentMode = configState.get('mode')
    if (cmds.hasOwnProperty(currentMode)) {
      cmds[currentMode]()
    }
  }
})

function openMainWindow () {
  // Initialise the browser window
  mainWindow = new BrowserWindow({
    // show: false,
    // frame: false,
    height: 400,
    resizable: true,
    width: 400
  })

  mainWindow.on('ready-to-show', function () {
    // Process all the inputs
    let configInputs = document.querySelectorAll('.form-settings [data-config]')
    Array.prototype.forEach.call(configInputs, function (input) {
      let settingName = input.getAttribute('data-config')
      let settingValue = config.get(settingName)
      input.value = settingValue
    })
  })

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))
}
