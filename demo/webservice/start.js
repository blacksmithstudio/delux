require('babel-register')
require('./run')['default']('start', function (app) {
  console.log('Delux: demo service now running')
})
