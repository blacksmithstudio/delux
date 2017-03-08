/**
 * The only page rendered...
 */
const ipcRenderer = require('electron').ipcRenderer

// Hook up the buttons to Delux functions
let buttons = {
  available: document.querySelector('.btn-available'),
  busy: document.querySelector('.btn-busy'),
  dnd: document.querySelector('.btn-dnd'),
  random: document.querySelector('.btn-random'),
  disco: document.querySelector('.btn-disco'),
  france: document.querySelector('.btn-france'),
  meeting: document.querySelector('.btn-meeting'),
  off: document.querySelector('.btn-off'),
  save: document.querySelector('.btn-save')
}

Object.keys(buttons).forEach((btnName) => {
  let btnElem = buttons[btnName]
  if (btnElem) {
    btnElem.addEventListener('click', function () {
      ipcRenderer.send(`set-${btnName}`)
    })
  }
})

function coerceValue (input, type) {
  switch (type) {
    default:
    case 'number':
    case 'float':
      return parseFloat(input)
      break

    case 'int':
      return parseInt(input, 10)
      break

    case 'string':
      return input+''
      break
  }
}

// Save settings
buttons.save.addEventListener('click', function () {
  let settings = undefined

  // Process all the inputs
  let configInputs = document.querySelectorAll('.form-settings [data-config]')
  Array.prototype.forEach.call(configInputs, function (input) {
    let settingName = input.getAttribute('data-config')
    let settingType = input.getAttribute('data-config-type')
    let settingValue = coerceValue(input.value, settingType)

    if (!settings) {
      settings = {}
    }

    // Save local config
    settings[settingName] = settingValue
  })

  // Save settings
  if (settings) {
    // console.log('save settings from renderer', settings)
    ipcRenderer.send('save-settings', settings)
  }
})
