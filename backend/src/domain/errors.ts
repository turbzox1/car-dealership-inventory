/** Base class for expected, client-facing errors; carries an HTTP status. */
export class AppError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) { super(message, 400); }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') { super(message, 401); }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') { super(message, 403); }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') { super(message, 404); }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests, please try again later') { super(message, 429); }
}

export class ConflictError extends AppError {
  constructor(message: string) { super(message, 409); }
}
