import { HttpError } from '@map-colonies/error-express-handler';
import { StatusCodes } from 'http-status-codes';

abstract class BaseHttpError extends Error implements HttpError {
  public constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class EmeptyResponse extends BaseHttpError {
  public constructor(message: string) {
    super(message, StatusCodes.OK);
  }
}

export class ProductNotFound extends BaseHttpError {
  public constructor(message: string) {
    super(message, StatusCodes.NOT_FOUND);
  }
}
