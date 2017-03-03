import express from 'express'

export default function Server (app) {
  // Holds reference to app
  this._app = app

  // Holds reference to the express server
  this._server = null

  /**
   * Create a server instance
   *
   * @return {Server}
   */
  this.create = () => {
    // Don't overwrite the existing server instance...
    if (!this._server) {
      this._server = express()
      this.listen()
    }
    return this
  }

  /**
   * Set up the server instance to listen on a specific port
   *
   * @param {Number} port
   * @return {Server}
   */
  this.listen = (port) => {
    this._server.listen(port || app.config.port)
    console.log(`Server: instance now running on ${port || app.config.port}`)
    return this
  }

  /**
   * Add many routes to the server instance
   *
   * @param {Array|Object} routes
   * @return {Server}
   */
  this.addRoutes = (routes) => {
    if (!routes || typeof routes !== 'object') {
      throw new Error('Server: Invalid routes collection given. Must be array or object')
    }

    // Array given
    if (routes instanceof Array) {
      routes.forEach(route => this.addRoute(route))
    }

    // Otherwise object given
    for (let routeName in routes) {
      if (routes.hasOwnProperty(routeName)) {
        let route = routes[routeName]

        // If it is a function, ensure it is an object for further processing
        if (typeof route === 'function') {
          route = {
            url: routeName,
            action: route
          }
        }

        this.addRoute(route)
      }
    }

    return this
  }

  /**
   * Add a single route to the server instance
   *
   * @param {Function|Object} route
   * @return {Server}
   */
  this.addRoute = (route) => {
    // Route is function (default is `get` method)
    if (typeof route === 'function') {
      app.routes[route.url] = this._server.get(`/${route.name || ''}`, route)

      // Route is object
    } else if (typeof route === 'object' && route.hasOwnProperty('action') && typeof route.action === 'function') {
      route.method = route.method || 'get'

      // Custom route URL
      if (route.hasOwnProperty('url')) {
        app.routes[route.url] = route.action
        this._server[route.method](`${route.url}`, route.action)

      // Generate route URL to attach to server instance
      } else {
        app.routes[route.url] = route.action
        this._server[route.method](`/${route.name}${route.params ? `/:${route.params.join('/:')}` : ''}`, route.action)
      }
    }

    return this
  }
}
