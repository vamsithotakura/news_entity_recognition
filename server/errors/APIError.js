
class APIError {

  constructor(code, message, cause) {
    this.code = code
    this.message = message
    this.cause = cause
  }

  messageJSON() {
    const res = {'message': this.message}
    if (this.cause) {
      res['cause'] = this.cause
    }
    return res
  }

  static badInputRequest(message) {
    return new APIError(400, message)
  }
}

module.exports = APIError;
