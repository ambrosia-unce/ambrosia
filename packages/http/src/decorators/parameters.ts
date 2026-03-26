/**
 * Parameter Decorators
 *
 * Декораторы для извлечения данных из HTTP запроса:
 * @Body, @Query, @Param, @Headers, @Header, @Ctx
 */

import type { Constructor } from "@ambrosia-unce/core";
import { HttpMetadataManager } from "../metadata";
import { type ParameterMetadata, ParameterType } from "../types";

/**
 * Создает декоратор параметра
 */
function createParameterDecorator(type: ParameterType, propertyKey?: string): ParameterDecorator {
  return (target: any, methodName: string | symbol | undefined, parameterIndex: number) => {
    if (!methodName) return;

    const constructor = target.constructor as Constructor;

    const metadata: ParameterMetadata = {
      type,
      parameterIndex,
      propertyKey,
      target: constructor,
      methodName,
    };

    HttpMetadataManager.addParameter(constructor, methodName, metadata);
  };
}

/**
 * @Body decorator
 *
 * Извлекает тело запроса (уже распарсенное)
 *
 * @example
 * ```typescript
 * @Http.Post('/')
 * create(@Body() body: CreateUserDto) {
 *   // body содержит тело запроса
 * }
 * ```
 */
export function Body(): ParameterDecorator {
  return createParameterDecorator(ParameterType.BODY);
}

/**
 * @Query decorator
 *
 * Извлекает query параметры из URL
 *
 * @param key - Ключ для извлечения конкретного query параметра (опционально)
 *
 * @example
 * ```typescript
 * @Http.Get('/')
 * list(@Query() query: any) {
 *   // query содержит все query параметры
 * }
 *
 * @Http.Get('/')
 * search(@Query('search') search: string) {
 *   // search содержит значение ?search=...
 * }
 * ```
 */
export function Query(key?: string): ParameterDecorator {
  return createParameterDecorator(ParameterType.QUERY, key);
}

/**
 * @Param decorator
 *
 * Извлекает path параметры из URL
 *
 * @param key - Ключ для извлечения конкретного path параметра (опционально)
 *
 * @example
 * ```typescript
 * @Http.Get('/:id')
 * getOne(@Param('id') id: string) {
 *   // id содержит значение из /users/:id
 * }
 *
 * @Http.Get('/:userId/posts/:postId')
 * getPost(@Param() params: any) {
 *   // params содержит { userId: '...', postId: '...' }
 * }
 * ```
 */
export function Param(key?: string): ParameterDecorator {
  return createParameterDecorator(ParameterType.PARAM, key);
}

/**
 * @Headers decorator
 *
 * Извлекает все HTTP заголовки
 *
 * @example
 * ```typescript
 * @Http.Get('/')
 * list(@Headers() headers: any) {
 *   // headers содержит все заголовки запроса
 * }
 * ```
 */
export function Headers(): ParameterDecorator {
  return createParameterDecorator(ParameterType.HEADERS);
}

/**
 * @Header decorator
 *
 * Извлекает конкретный HTTP заголовок
 *
 * @param key - Имя заголовка
 *
 * @example
 * ```typescript
 * @Http.Get('/')
 * protected(@Header('authorization') token: string) {
 *   // token содержит значение заголовка Authorization
 * }
 * ```
 */
export function Header(key: string): ParameterDecorator {
  if (!key) {
    throw new Error("@Header decorator requires a header name");
  }
  return createParameterDecorator(ParameterType.HEADER, key.toLowerCase());
}

/**
 * @Ctx decorator
 *
 * Извлекает нативный контекст HTTP провайдера
 * Полезно когда нужен доступ к специфичным API провайдера
 *
 * @example
 * ```typescript
 * import type { Context } from 'elysia';
 *
 * @Http.Get('/cookies')
 * getCookies(@Ctx() ctx: Context) {
 *   // ctx - нативный Elysia context
 *   return { cookies: ctx.cookie };
 * }
 * ```
 */
export function Ctx(): ParameterDecorator {
  return createParameterDecorator(ParameterType.CONTEXT);
}

/**
 * @Req() / @Request() decorator
 *
 * Инжектирует полный объект request
 *
 * @example
 * ```typescript
 * @Http.Get('/info')
 * getInfo(@Req() req: IHttpRequest) {
 *   return {
 *     method: req.method,
 *     path: req.path,
 *     ip: req.ip
 *   };
 * }
 * ```
 */
export function Req(): ParameterDecorator {
  return createParameterDecorator(ParameterType.REQUEST);
}

/**
 * Alias for @Req()
 */
export const Request = Req;

/**
 * @Res() / @Response() decorator
 *
 * Инжектирует полный объект response
 *
 * @example
 * ```typescript
 * @Http.Get('/custom')
 * custom(@Res() res: IHttpResponse) {
 *   res.setStatus(201).setHeader('X-Custom', 'value');
 *   return { data: 'result' };
 * }
 * ```
 */
export function Res(): ParameterDecorator {
  return createParameterDecorator(ParameterType.RESPONSE);
}

/**
 * Alias for @Res()
 */
export const Response = Res;

/**
 * @Session() decorator
 *
 * Извлекает данные сессии
 *
 * @example
 * ```typescript
 * @Http.Get('/profile')
 * getProfile(@Session() session: any) {
 *   return { userId: session.userId };
 * }
 * ```
 */
export function Session(): ParameterDecorator {
  return createParameterDecorator(ParameterType.SESSION);
}

/**
 * @Cookie() decorator
 *
 * Извлекает cookies
 *
 * @param name - Имя конкретной cookie (опционально)
 *
 * @example
 * ```typescript
 * @Http.Get('/auth')
 * checkAuth(@Cookie('token') token: string) {
 *   // token содержит значение cookie 'token'
 * }
 *
 * @Http.Get('/cookies')
 * getAllCookies(@Cookie() cookies: Record<string, string>) {
 *   // cookies содержит все cookies
 * }
 * ```
 */
export function Cookie(name?: string): ParameterDecorator {
  return createParameterDecorator(ParameterType.COOKIE, name);
}

/**
 * @Ip() decorator
 *
 * Извлекает IP адрес клиента
 *
 * @example
 * ```typescript
 * @Http.Post('/login')
 * login(@Body() credentials: LoginDto, @Ip() ip: string) {
 *   console.log(`Login attempt from ${ip}`);
 *   return this.authService.login(credentials, ip);
 * }
 * ```
 */
export function Ip(): ParameterDecorator {
  return createParameterDecorator(ParameterType.IP);
}

/**
 * @UploadedFile() decorator
 *
 * Извлекает загруженный файл из multipart/form-data
 *
 * @param fieldName - Имя поля в форме
 *
 * @example
 * ```typescript
 * @Http.Post('/upload')
 * uploadAvatar(@UploadedFile('avatar') file: UploadedFile) {
 *   return {
 *     filename: file.originalname,
 *     size: file.size,
 *     mimetype: file.mimetype
 *   };
 * }
 * ```
 */
export function UploadedFile(fieldName: string): ParameterDecorator {
  if (!fieldName) {
    throw new Error("@UploadedFile decorator requires a field name");
  }
  return createParameterDecorator(ParameterType.UPLOADED_FILE, fieldName);
}

/**
 * @UploadedFiles() decorator
 *
 * Извлекает массив загруженных файлов из multipart/form-data
 *
 * @param fieldName - Имя поля в форме (опционально, если не указано - все файлы)
 *
 * @example
 * ```typescript
 * @Http.Post('/upload-multiple')
 * uploadPhotos(@UploadedFiles('photos') files: UploadedFile[]) {
 *   return {
 *     count: files.length,
 *     totalSize: files.reduce((sum, f) => sum + f.size, 0)
 *   };
 * }
 *
 * @Http.Post('/upload-all')
 * uploadAll(@UploadedFiles() files: UploadedFile[]) {
 *   // files содержит все загруженные файлы
 * }
 * ```
 */
export function UploadedFiles(fieldName?: string): ParameterDecorator {
  return createParameterDecorator(ParameterType.UPLOADED_FILES, fieldName);
}
