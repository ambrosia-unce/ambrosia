/**
 * @Optional Decorator Unit Tests
 */

import { beforeEach, describe, expect, test } from "bun:test";
import "reflect-metadata";
import { Container } from "../../../src/container/container.ts";
import { ProviderNotFoundError } from "../../../src/container/errors.ts";
import { Autowired } from "../../../src/decorators/autowired.ts";
import { Inject } from "../../../src/decorators/inject.ts";
import { Injectable } from "../../../src/decorators/injectable.ts";
import { Optional } from "../../../src/decorators/optional.ts";
import { InjectionToken } from "../../../src/types/token.ts";
import { cleanRegistry } from "../../helpers/test-helpers.ts";

describe("@Optional", () => {
  beforeEach(() => {
    cleanRegistry();
  });

  test("should return undefined for optional constructor param when provider is missing", () => {
    const CACHE_TOKEN = new InjectionToken("Cache");

    @Injectable()
    class MyService {
      constructor(@Optional() @Inject(CACHE_TOKEN) public cache?: any) {}
    }

    const container = new Container(true);
    const service = container.resolve<MyService>(MyService);

    expect(service).toBeInstanceOf(MyService);
    expect(service.cache).toBeUndefined();
  });

  test("should inject normally for optional constructor param when provider exists", () => {
    const CACHE_TOKEN = new InjectionToken("Cache");
    const cacheImpl = { get: () => "cached" };

    @Injectable()
    class MyService {
      constructor(@Optional() @Inject(CACHE_TOKEN) public cache?: any) {}
    }

    const container = new Container(true);
    container.registerValue(CACHE_TOKEN, cacheImpl);
    const service = container.resolve<MyService>(MyService);

    expect(service).toBeInstanceOf(MyService);
    expect(service.cache).toBe(cacheImpl);
    expect(service.cache.get()).toBe("cached");
  });

  test("should return undefined for @Optional with @Inject token when token not registered", () => {
    const LOGGER_TOKEN = new InjectionToken("Logger");

    @Injectable()
    class AppService {
      constructor(@Optional() @Inject(LOGGER_TOKEN) public logger?: any) {}
    }

    const container = new Container(true);
    const service = container.resolve<AppService>(AppService);

    expect(service.logger).toBeUndefined();
  });

  test("should inject value for @Optional with @Inject token when token is registered", () => {
    const LOGGER_TOKEN = new InjectionToken("Logger");
    const loggerImpl = { log: (msg: string) => msg };

    @Injectable()
    class AppService {
      constructor(@Optional() @Inject(LOGGER_TOKEN) public logger?: any) {}
    }

    const container = new Container(true);
    container.registerValue(LOGGER_TOKEN, loggerImpl);
    const service = container.resolve<AppService>(AppService);

    expect(service.logger).toBe(loggerImpl);
  });

  test("should handle multiple @Optional parameters with some available and some not", () => {
    const CACHE_TOKEN = new InjectionToken("Cache");
    const LOGGER_TOKEN = new InjectionToken("Logger");
    const METRICS_TOKEN = new InjectionToken("Metrics");

    const loggerImpl = { log: (msg: string) => msg };

    @Injectable()
    class MultiService {
      constructor(
        @Optional() @Inject(CACHE_TOKEN) public cache?: any,
        @Optional() @Inject(LOGGER_TOKEN) public logger?: any,
        @Optional() @Inject(METRICS_TOKEN) public metrics?: any,
      ) {}
    }

    const container = new Container(true);
    container.registerValue(LOGGER_TOKEN, loggerImpl);
    const service = container.resolve<MultiService>(MultiService);

    expect(service.cache).toBeUndefined();
    expect(service.logger).toBe(loggerImpl);
    expect(service.metrics).toBeUndefined();
  });

  test("should throw ProviderNotFoundError without @Optional when provider is missing", () => {
    const REQUIRED_TOKEN = new InjectionToken("Required");

    @Injectable()
    class StrictService {
      constructor(@Inject(REQUIRED_TOKEN) public required: any) {}
    }

    const container = new Container(true);

    expect(() => container.resolve<StrictService>(StrictService)).toThrow(ProviderNotFoundError);
  });

  test("should return undefined for @Optional on property with @Autowired when missing", () => {
    const CACHE_TOKEN = new InjectionToken("Cache");

    @Injectable()
    class PropertyService {
      @Autowired(CACHE_TOKEN)
      @Optional()
      public cache?: any;
    }

    const container = new Container(true);
    const service = container.resolve<PropertyService>(PropertyService);

    expect(service).toBeInstanceOf(PropertyService);
    expect(service.cache).toBeUndefined();
  });

  test("should inject for @Optional on property with @Autowired when available", () => {
    const CACHE_TOKEN = new InjectionToken("Cache");
    const cacheImpl = { get: () => "value", set: () => {} };

    @Injectable()
    class PropertyService {
      @Autowired(CACHE_TOKEN)
      @Optional()
      public cache?: any;
    }

    const container = new Container(true);
    container.registerValue(CACHE_TOKEN, cacheImpl);
    const service = container.resolve<PropertyService>(PropertyService);

    expect(service).toBeInstanceOf(PropertyService);
    expect(service.cache).toBe(cacheImpl);
  });
});
