/** Operational error with an HTTP status code (safe to show to the client). */
class AppError extends Error {
  constructor(message, statusCode = 400, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}
module.exports = AppError;
