require('babel-register')
require('./demo/webservice/run')['default']('start', function (app) {
  console.log('Delux: demo service now running')
})
