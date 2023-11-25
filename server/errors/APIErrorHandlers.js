const APIError = require('./APIError')

function apiErrorHandler(error, req, res, next) {

  console.error(error)  // TODO: Explore async file-rolling-logger.

  if(error instanceof APIError) {
    res.status(error.code).json(error.messageJSON())
    return
  }

  res.status(500).json({'message': 'App-Internal-API-Error'})
}

module.exports = apiErrorHandler;

