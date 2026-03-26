/**
 * Ambrosia DI Container - Main Entry Point
 *
 * A full-featured dependency injection container for Bun and TypeScript.
 *
 * @example
 * Basic usage:
 * ```typescript
 * import { Injectable, container } from '@ambrosia/core';
 *
 * @Injectable()
 * class Database {
 *   connect() { console.log('Connected!'); }
 * }
 *
 * @Injectable()
 * class UserService {
 *   constructor(private db: Database) {}
 * }
 *
 * const userService = container.resolve(UserService);
 * ```
 *
 * @module @ambrosia/core
 */

import "reflect-metadata";

export { Container, container } from "./container/container.ts";
export {
  AsyncInSyncError,
  CircularDependencyError,
  DIError,
  InstantiationError,
  InvalidProviderError,
  MetadataError,
  NoRequestScopeError,
  NotInjectableError,
  PropertyInjectionError,
  ProviderNotFoundError,
  ResolutionError,
} from "./container/errors.ts";
export { AmbrosiaError } from "./errors/ambrosia-error.ts";
export {
  AMB001,
  AMB002,
  AMB003,
  AMB004,
  AMB005,
  AMB006,
  AMB007,
  AMB100,
  AMB101,
  AMB102,
  AMB103,
  AMB200,
  AMB201,
  AMB202,
  AMB203,
  AMB204,
  AMB300,
  AMB301,
  AMB302,
  AMB400,
  AMB401,
  createError,
  ERROR_CATALOG,
  type ErrorDefinition,
} from "./errors/error-codes.ts";
export { formatAnyError, formatError, printError } from "./errors/error-formatter.ts";
export { getRegistry, Registry } from "./container/registry.ts";
export { Autowired } from "./decorators/autowired.ts";
export { Implements } from "./decorators/implements.ts";
export { Inject } from "./decorators/inject.ts";
export { Injectable, type InjectableOptions } from "./decorators/injectable.ts";
export { Optional } from "./decorators/optional.ts";
export type { IContainer, OnDestroy, OnInit } from "./interfaces/index.ts";
export { hasOnDestroy, hasOnInit } from "./interfaces/index.ts";
export { METADATA_KEYS } from "./metadata/constants.ts";
export { MetadataManager } from "./metadata/metadata-manager.ts";
export type {
  AsyncPackOptions,
  LoadedPackInfo,
  Packable,
  PackDefinition,
  PackMetadata,
  PackProcessingResult,
} from "./pack/index.ts";
export {
  createAsyncProvider,
  definePack,
  isConstructorProvider,
  PackLifecycleManager,
  PackProcessor,
  PackRegistry,
  packRegistry,
} from "./pack/index.ts";
export { LoggingPlugin, type LoggingPluginOptions } from "./plugins/logging-plugin.ts";
export { PluginManager } from "./plugins/plugin-manager.ts";
export type { Plugin, ResolutionContext, ScopeHandler } from "./plugins/types.ts";
export { PluginPriority } from "./plugins/types.ts";
export { RequestScopeStorage } from "./scope/request-scope-storage.ts";
export { ScopeManager } from "./scope/scope-manager.ts";
export { DEFAULT_SCOPE, Scope } from "./scope/types.ts";
export { type TestingPack, TestingPackFactory } from "./testing/index.ts";
export type {
  Abstract,
  AnyConstructor,
  AsyncFactoryContainer,
  Constructor,
  Factory,
  FactoryContainer,
  Token,
} from "./types/common.ts";
export type {
  ClassProvider,
  ExistingProvider,
  FactoryProvider,
  Provider,
  ValueProvider,
} from "./types/provider.ts";
export {
  isClassProvider,
  isExistingProvider,
  isFactoryProvider,
  isValueProvider,
} from "./types/provider.ts";
export { InjectionToken } from "./types/token.ts";

export {
  ConsoleLogger,
  type Logger,
  SilentLogger,
  setGlobalLogger,
} from "./utils/logger.ts";
export {
  isConstructor,
  isInjectionToken,
  tokenToString,
} from "./utils/reflection.ts";

// Logger
export { DefaultLoggerAdapter } from "./logger/logger.adapter.ts";
export { LoggerModule } from "./logger/logger.module.ts";
export {
  LOGGER_CONFIG,
  LOGGER_EVENT_BUS,
  LOGGER_REQUEST_CONTEXT,
  LogEntryEvent,
  LoggerService,
} from "./logger/logger.service.ts";
export type {
  LogEntry,
  LoggerAdapter,
  LoggerConfig,
  LogLevel,
} from "./logger/logger.types.ts";
