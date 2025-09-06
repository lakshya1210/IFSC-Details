import { HttpException, HttpStatus } from '@nestjs/common';

export class IFSCNotFoundException extends HttpException {
  constructor(ifscCode: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: `IFSC code '${ifscCode}' not found`,
        error: 'IFSC Not Found',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class InvalidIFSCFormatException extends HttpException {
  constructor(ifscCode: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Invalid IFSC code format: '${ifscCode}'. Expected format: ABCD0123456`,
        error: 'Invalid IFSC Format',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ExternalAPIException extends HttpException {
  constructor(message: string) {
    super(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: `External API error: ${message}`,
        error: 'External Service Unavailable',
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
