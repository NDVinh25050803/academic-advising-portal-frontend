// Error shape used by both the real client and the mock.
// Backend errors arrive as { "error": { "code", "message", "details" } }.
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
