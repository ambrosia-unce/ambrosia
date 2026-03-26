/**
 * Built-in HTTP exceptions with standard status codes
 */

import { HttpStatus } from "../types/common.ts";
import { HttpException } from "./http-exception.ts";

/**
 * BadRequestException (400)
 *
 * Thrown when the client sends invalid data
 */
export class BadRequestException extends HttpException {
  constructor(message: string = "Bad Request", error: string = "Bad Request") {
    super(message, HttpStatus.BAD_REQUEST, error);
    this.name = "BadRequestException";
  }
}

/**
 * UnauthorizedException (401)
 *
 * Thrown when authentication is required but not provided or invalid
 */
export class UnauthorizedException extends HttpException {
  constructor(message: string = "Unauthorized", error: string = "Unauthorized") {
    super(message, HttpStatus.UNAUTHORIZED, error);
    this.name = "UnauthorizedException";
  }
}

/**
 * ForbiddenException (403)
 *
 * Thrown when the user is authenticated but doesn't have permission
 */
export class ForbiddenException extends HttpException {
  constructor(message: string = "Forbidden", error: string = "Forbidden") {
    super(message, HttpStatus.FORBIDDEN, error);
    this.name = "ForbiddenException";
  }
}

/**
 * NotFoundException (404)
 *
 * Thrown when the requested resource is not found
 */
export class NotFoundException extends HttpException {
  constructor(message: string = "Not Found", error: string = "Not Found") {
    super(message, HttpStatus.NOT_FOUND, error);
    this.name = "NotFoundException";
  }
}

/**
 * MethodNotAllowedException (405)
 *
 * Thrown when the HTTP method is not allowed for the route
 */
export class MethodNotAllowedException extends HttpException {
  constructor(message: string = "Method Not Allowed", error: string = "Method Not Allowed") {
    super(message, HttpStatus.METHOD_NOT_ALLOWED, error);
    this.name = "MethodNotAllowedException";
  }
}

/**
 * ConflictException (409)
 *
 * Thrown when there's a conflict with the current state (e.g., duplicate resource)
 */
export class ConflictException extends HttpException {
  constructor(message: string = "Conflict", error: string = "Conflict") {
    super(message, HttpStatus.CONFLICT, error);
    this.name = "ConflictException";
  }
}

/**
 * UnprocessableEntityException (422)
 *
 * Thrown when the request is syntactically correct but semantically invalid
 */
export class UnprocessableEntityException extends HttpException {
  constructor(message: string = "Unprocessable Entity", error: string = "Unprocessable Entity") {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, error);
    this.name = "UnprocessableEntityException";
  }
}

/**
 * RequestTimeoutException (408)
 *
 * Thrown when a request handler exceeds the configured timeout
 */
export class RequestTimeoutException extends HttpException {
  constructor(message: string = "Request Timeout", error: string = "Request Timeout") {
    super(message, HttpStatus.REQUEST_TIMEOUT, error);
    this.name = "RequestTimeoutException";
  }
}

/**
 * InternalServerErrorException (500)
 *
 * Thrown when an unexpected server error occurs
 */
export class InternalServerErrorException extends HttpException {
  constructor(message: string = "Internal Server Error", error: string = "Internal Server Error") {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, error);
    this.name = "InternalServerErrorException";
  }
}
