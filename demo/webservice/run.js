import App from './app'

export default function Run (env, callback) {
  new App(env, function (app) {

    // Finished
    console.log('Delux: app is now running')
  })
}
