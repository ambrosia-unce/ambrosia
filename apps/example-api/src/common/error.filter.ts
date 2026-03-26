import { Injectable, LoggerService } from "@ambrosia/core";
import {
  HttpException,
  type ExceptionFilter,
  type ExceptionFilterArgs,
} from "@ambrosia/http";

/**
 * Global error filter — catches all exceptions and formats
 * a consistent JSON error response.
 *
 * HttpExceptions are returned with their status code.
 * Unknown errors default to 500 Internal Server Error.
 */
@Injectable()
export class GlobalErrorFilter implements ExceptionFilter {
  private logger: LoggerService;

  constructor(logger: LoggerService) {
    this.logger = logger.child("ErrorFilter");
  }

  catch(args: ExceptionFilterArgs): any {
    const { exception, httpContext } = args;

    let status = 500;
    let message = "Internal Server Error";
    let error = "Internal Server Error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getMessage();
      error = exception.getError();
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(`${status} ${error}: ${message}`, exception instanceof Error ? exception : undefined);

    httpContext.response.setStatus(status);

    return {
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: httpContext.request.path,
    };
  }
}
