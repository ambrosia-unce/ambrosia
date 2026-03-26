/**
 * @Validate() decorator - Marks parameter for automatic validation
 *
 * This decorator is a marker for the @ambrosia-unce/validator plugin.
 * When the plugin is active, it will automatically generate validation
 * code for parameters marked with @Validate().
 *
 * If the validator plugin is not active, this decorator has no effect.
 */

/**
 * Marks a parameter for automatic validation via @ambrosia-unce/validator plugin.
 *
 * **Requires:** @ambrosia-unce/validator plugin to be active.
 * Add `preload = ["@ambrosia-unce/validator/preload"]` to bunfig.toml.
 *
 * @example
 * ```typescript
 * import { Controller, Post, Body, Validate } from '@ambrosia-unce/http';
 *
 * interface CreateUserDto {
 *   name: string;
 *   email: string;
 *   age: number;
 * }
 *
 * @Controller('/users')
 * export class UserController {
 *   @Post('/')
 *   async create(
 *     @Body()
 *     @Validate() // ← Plugin generates validation automatically
 *     dto: CreateUserDto
 *   ) {
 *     // dto is validated and typed!
 *     return this.userService.create(dto);
 *   }
 * }
 * ```
 *
 * @example With branded types
 * ```typescript
 * import type { Email, UUID } from '@ambrosia-unce/validator/types';
 *
 * interface UpdateUserDto {
 *   id: UUID;
 *   email: Email;
 *   name: string;
 * }
 *
 * @Patch('/users/:id')
 * async update(
 *   @Param('id') id: string,
 *   @Body() @Validate() dto: UpdateUserDto
 * ) {
 *   // dto.id validated as UUID
 *   // dto.email validated as Email
 *   return this.userService.update(dto);
 * }
 * ```
 *
 * @example With JSDoc constraints
 * ```typescript
 * interface CreateProductDto {
 *   /**
 *    * ＠minLength 3
 *    * ＠maxLength 100
 *    *\/
 *   name: string;
 *
 *   /**
 *    * ＠minimum 0
 *    *\/
 *   price: number;
 * }
 *
 * @Post('/products')
 * async create(@Body() @Validate() dto: CreateProductDto) {
 *   // Validation includes JSDoc constraints
 *   return dto;
 * }
 * ```
 */
export function Validate(): ParameterDecorator {
  // This is just a marker decorator.
  // The @ambrosia-unce/validator plugin will detect it and generate validation code.
  // If the plugin is not active, this decorator does nothing.

  return (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    // No-op implementation
    // The plugin will replace calls to functions with @Validate() parameters
  };
}
