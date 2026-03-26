import { Injectable } from "@ambrosia/core";
import { BadRequestException, type Pipe, type PipeMetadata } from "@ambrosia/http";

/**
 * Simple validation pipe — ensures the body is not empty.
 *
 * In a real application, you would use @ambrosia/validator for
 * compile-time type validation. This is a simplified demo.
 */
@Injectable()
export class ValidationPipe implements Pipe {
  transform(value: any, _metadata?: PipeMetadata): any {
    if (value === null || value === undefined) {
      throw new BadRequestException("Request body is required");
    }

    if (typeof value === "object" && Object.keys(value).length === 0) {
      throw new BadRequestException("Request body must not be empty");
    }

    return value;
  }
}
