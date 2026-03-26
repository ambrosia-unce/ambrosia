/**
 * Default global exception filter
 *
 * Catches all unhandled exceptions and formats them as JSON
 */

import { Injectable } from "@ambrosia-unce/core";
import { HttpException } from "../exceptions/http-exception.ts";
import { HttpStatus } from "../types/common.ts";
import type { ExceptionFilter, ExceptionFilterArgs } from "./exception-filter.interface.ts";

/**
 * DefaultExceptionFilter
 *
 * Default global filter that handles all exceptions
 * Returns standardized JSON error format
 */
@Injectable()
export class DefaultExceptionFilter implements ExceptionFilter {
  catch(args: ExceptionFilterArgs): any {
    const { exception, httpContext } = args;

    let status: number;
    let message: string;
    let error: string;

    // Check if exception is HttpException
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getMessage();
      error = exception.getError();
    }
    // Check if exception is standard Error
    else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message;
      error = "Internal Server Error";
    }
    // Unknown exception type
    else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = "Unknown error occurred";
      error = "Internal Server Error";
    }

    // Set response status
    httpContext.response.setStatus(status);

    // Return standardized error response
    return {
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: httpContext.request.path,
    };
  }
}
