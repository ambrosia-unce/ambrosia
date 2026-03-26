/**
 * Metadata keys for HTTP decorators
 */

/**
 * Ключи метаданных для HTTP декораторов
 */
export const HTTP_METADATA_KEYS = {
  /**
   * Метаданные контроллера
   * Хранятся на классе контроллера
   */
  CONTROLLER: "ambrosia:http:controller",

  /**
   * Метаданные метода роута (GET, POST, etc.)
   * Хранятся на методе класса
   */
  ROUTE_METHOD: "ambrosia:http:route",

  /**
   * Метаданные параметров (@Body, @Query, etc.)
   * Хранятся на методе класса как массив
   */
  PARAMETERS: "ambrosia:http:parameters",

  /**
   * Guards metadata
   * Applied at class or method level
   */
  GUARDS: "ambrosia:http:guards",

  /**
   * Interceptors metadata
   * Applied at class or method level
   */
  INTERCEPTORS: "ambrosia:http:interceptors",

  /**
   * Pipes metadata
   * Applied at class or method level
   */
  PIPES: "ambrosia:http:pipes",

  /**
   * Middleware metadata
   * Applied at class level
   */
  MIDDLEWARE: "ambrosia:http:middleware",

  /**
   * Exception filters metadata
   * Applied at class or method level
   */
  FILTERS: "ambrosia:http:filters",

  /**
   * Response headers metadata
   * Applied at method level
   */
  RESPONSE_HEADERS: "ambrosia:http:response-headers",

  /**
   * Response status code metadata
   * Applied at method level
   */
  RESPONSE_STATUS: "ambrosia:http:response-status",

  /**
   * Redirect metadata (url + statusCode)
   * Applied at method level
   */
  REDIRECT: "ambrosia:http:redirect",

  /**
   * Custom metadata set via SetMetadata or @Public
   * Applied at class or method level
   */
  CUSTOM_METADATA: "ambrosia:http:custom-metadata",

  /**
   * SSE marker for route methods
   * Applied at method level
   */
  SSE: "ambrosia:http:sse",

  /**
   * Serialization DTO class
   * Applied at method level
   */
  SERIALIZE: "ambrosia:http:serialize",

  /**
   * Exception types a filter catches (@Catch)
   * Applied at class level
   */
  CATCH: "ambrosia:http:catch",

  /**
   * Timeout in milliseconds
   * Applied at method level
   */
  TIMEOUT: "ambrosia:http:timeout",

  /**
   * OpenAPI property metadata
   * Applied at property level (on DTO classes)
   */
  API_PROPERTY: "ambrosia:http:api-property",

  /**
   * OpenAPI response metadata
   * Applied at method level
   */
  API_RESPONSE: "ambrosia:http:api-response",

  /**
   * OpenAPI tags metadata
   * Applied at class level
   */
  API_TAGS: "ambrosia:http:api-tags",
} as const;
