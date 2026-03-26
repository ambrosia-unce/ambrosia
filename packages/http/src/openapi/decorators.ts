/**
 * OpenAPI decorators for API documentation
 */

import "reflect-metadata";
import { HTTP_METADATA_KEYS } from "../metadata/constants.ts";

/**
 * OpenAPI property metadata
 */
export interface ApiPropertyOptions {
  description?: string;
  type?: string | Function;
  required?: boolean;
  example?: any;
  enum?: any[];
  format?: string;
  default?: any;
  nullable?: boolean;
}

/**
 * @ApiProperty() decorator
 *
 * Marks a DTO property with OpenAPI metadata for documentation generation.
 *
 * @example
 * ```ts
 * class CreateUserDto {
 *   @ApiProperty({ description: 'User name', example: 'Alice' })
 *   name: string;
 *
 *   @ApiProperty({ description: 'User email', format: 'email' })
 *   email: string;
 *
 *   @ApiProperty({ description: 'User role', enum: ['admin', 'user'], default: 'user' })
 *   role: string;
 * }
 * ```
 */
export function ApiProperty(options: ApiPropertyOptions = {}): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const existing: Record<string, ApiPropertyOptions> =
      Reflect.getMetadata(HTTP_METADATA_KEYS.API_PROPERTY, target.constructor) || {};
    existing[String(propertyKey)] = options;
    Reflect.defineMetadata(HTTP_METADATA_KEYS.API_PROPERTY, existing, target.constructor);
  };
}

/**
 * OpenAPI response metadata
 */
export interface ApiResponseOptions {
  status: number;
  description: string;
  type?: Function;
  isArray?: boolean;
}

/**
 * @ApiResponse() decorator
 *
 * Documents a possible response from a route handler.
 * Can be applied multiple times for different status codes.
 *
 * @example
 * ```ts
 * @Controller('/users')
 * export class UserController {
 *   @Get('/:id')
 *   @ApiResponse({ status: 200, description: 'User found', type: UserDto })
 *   @ApiResponse({ status: 404, description: 'User not found' })
 *   getUser(@Param('id') id: string) { }
 * }
 * ```
 */
export function ApiResponse(options: ApiResponseOptions): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const existing: ApiResponseOptions[] =
      Reflect.getMetadata(HTTP_METADATA_KEYS.API_RESPONSE, target.constructor, propertyKey) || [];
    existing.push(options);
    Reflect.defineMetadata(
      HTTP_METADATA_KEYS.API_RESPONSE,
      existing,
      target.constructor,
      propertyKey,
    );
    return descriptor;
  };
}

/**
 * @ApiTags() decorator
 *
 * Adds OpenAPI tags to a controller for grouping in documentation.
 *
 * @example
 * ```ts
 * @Controller('/users')
 * @ApiTags('Users', 'Authentication')
 * export class UserController { }
 * ```
 */
export function ApiTags(...tags: string[]): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(HTTP_METADATA_KEYS.API_TAGS, tags, target);
    return target;
  };
}
