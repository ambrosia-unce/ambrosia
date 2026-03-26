import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { Registry } from "../../container/registry.ts";
import { MetadataManager } from "../../metadata/metadata-manager.ts";
import { METADATA_KEYS } from "../../metadata/constants.ts";
import { Scope } from "../../scope/types.ts";
import { InjectionToken } from "../../types/token.ts";
import { Injectable } from "../injectable.ts";
import { Inject } from "../inject.ts";
import { Optional } from "../optional.ts";
import { Autowired } from "../autowired.ts";
import { Implements } from "../implements.ts";

// ─── Setup / Teardown ───────────────────────────────────────────────────────

describe("Decorators", () => {
  beforeEach(() => {
    Registry.reset();
  });

  afterEach(() => {
    Registry.reset();
  });

  // ==================== @Injectable ====================

  describe("@Injectable", () => {
    it("should set injectable metadata on the class", () => {
      @Injectable()
      class Foo {}

      const meta = MetadataManager.getInjectable(Foo);
      expect(meta).toBeDefined();
      expect(meta!.token).toBe(Foo);
      expect(meta!.scope).toBe(Scope.SINGLETON);
    });

    it("should respect custom scope option", () => {
      @Injectable({ scope: Scope.TRANSIENT })
      class Bar {}

      const meta = MetadataManager.getInjectable(Bar);
      expect(meta).toBeDefined();
      expect(meta!.scope).toBe(Scope.TRANSIENT);
    });

    it("should mark class as injectable via isInjectable", () => {
      @Injectable()
      class Baz {}

      expect(MetadataManager.isInjectable(Baz)).toBe(true);
    });

    it("should NOT mark undecorated classes as injectable", () => {
      class Plain {}
      expect(MetadataManager.isInjectable(Plain)).toBe(false);
    });

    it("should auto-register with the global registry", () => {
      @Injectable()
      class AutoReg {}

      const registry = Registry.getInstance();
      expect(registry.hasProvider(AutoReg)).toBe(true);
    });
  });

  // ==================== @Inject ====================

  describe("@Inject", () => {
    it("should store token metadata for a constructor parameter", () => {
      const TOKEN = new InjectionToken<string>("test-token");

      @Injectable()
      class WithInject {
        constructor(@Inject(TOKEN) public val: string) {}
      }

      const injects = MetadataManager.getInjects(WithInject);
      expect(injects).toBeDefined();
      expect(injects!.length).toBe(1);
      expect(injects![0]!.token).toBe(TOKEN);
      expect(injects![0]!.parameterIndex).toBe(0);
    });

    it("should store multiple @Inject metadata entries", () => {
      const A = new InjectionToken<string>("a");
      const B = new InjectionToken<number>("b");

      @Injectable()
      class Multi {
        constructor(
          @Inject(A) public a: string,
          @Inject(B) public b: number,
        ) {}
      }

      const injects = MetadataManager.getInjects(Multi);
      expect(injects).toBeDefined();
      expect(injects!.length).toBe(2);
    });

    it("should find inject for specific parameter index", () => {
      const TOKEN = new InjectionToken<boolean>("flag");

      @Injectable()
      class Specific {
        constructor(
          public first: any,
          @Inject(TOKEN) public second: boolean,
        ) {}
      }

      const found = MetadataManager.getInjectForParameter(Specific, 1);
      expect(found).toBeDefined();
      expect(found!.token).toBe(TOKEN);
    });
  });

  // ==================== @Optional ====================

  describe("@Optional", () => {
    it("should mark a constructor parameter as optional", () => {
      @Injectable()
      class WithOptional {
        constructor(@Optional() public dep?: any) {}
      }

      expect(MetadataManager.isParameterOptional(WithOptional, 0)).toBe(true);
    });

    it("should not mark non-decorated parameters as optional", () => {
      @Injectable()
      class NoOptional {
        constructor(public dep: any) {}
      }

      expect(MetadataManager.isParameterOptional(NoOptional, 0)).toBe(false);
    });

    it("should mark a property as optional (for @Autowired)", () => {
      @Injectable()
      class WithPropOptional {
        @Optional()
        someProp?: any;
      }

      expect(MetadataManager.isPropertyOptional(WithPropOptional, "someProp")).toBe(true);
    });
  });

  // ==================== @Autowired ====================

  describe("@Autowired", () => {
    it("should store property injection metadata with explicit token", () => {
      const TOKEN = new InjectionToken<string>("auto-token");

      @Injectable()
      class WithAutowired {
        @Autowired(TOKEN)
        myProp!: string;
      }

      const autowired = MetadataManager.getAutowired(WithAutowired);
      expect(autowired).toBeDefined();
      expect(autowired!.length).toBe(1);
      expect(autowired![0]!.token).toBe(TOKEN);
      expect(autowired![0]!.propertyKey).toBe("myProp");
    });

    it("should store optional flag when @Optional is applied before @Autowired", () => {
      const TOKEN = new InjectionToken<number>("opt-auto");

      @Injectable()
      class WithOptAuto {
        @Autowired(TOKEN)
        @Optional()
        optProp?: number;
      }

      const autowired = MetadataManager.getAutowired(WithOptAuto);
      expect(autowired).toBeDefined();
      expect(autowired![0]!.optional).toBe(true);
    });

    it("should store multiple @Autowired entries", () => {
      const A = new InjectionToken<string>("a");
      const B = new InjectionToken<number>("b");

      @Injectable()
      class MultiAuto {
        @Autowired(A)
        propA!: string;

        @Autowired(B)
        propB!: number;
      }

      const autowired = MetadataManager.getAutowired(MultiAuto);
      expect(autowired).toBeDefined();
      expect(autowired!.length).toBe(2);
    });
  });

  // ==================== @Implements ====================

  describe("@Implements", () => {
    it("should set implementation metadata", () => {
      abstract class ILogger {
        abstract log(msg: string): void;
      }

      @Implements(ILogger)
      @Injectable()
      class ConsoleLogger extends ILogger {
        log(msg: string) {
          // noop
        }
      }

      const meta = MetadataManager.getImplements(ConsoleLogger);
      expect(meta).toBeDefined();
      expect(meta!.abstractToken).toBe(ILogger);
    });

    it("should register implementation in global registry", () => {
      abstract class IStorage {
        abstract get(key: string): any;
      }

      @Implements(IStorage)
      @Injectable()
      class MemoryStorage extends IStorage {
        get(key: string) {
          return null;
        }
      }

      const registry = Registry.getInstance();
      const impl = registry.getImplementation(IStorage);
      expect(impl).toBe(MemoryStorage);
    });

    it("should allow resolving abstract class to concrete implementation", () => {
      abstract class IService {
        abstract run(): string;
      }

      @Implements(IService)
      @Injectable()
      class RealService extends IService {
        run() {
          return "real";
        }
      }

      const registry = Registry.getInstance();
      // The registry should resolve IService to RealService's provider
      const provider = registry.getProvider(IService);
      expect(provider).toBeDefined();
    });
  });

  // ==================== MetadataManager.clearMetadata ====================

  describe("MetadataManager.clearMetadata", () => {
    it("should remove all metadata from a class", () => {
      @Injectable()
      class Clearable {}

      expect(MetadataManager.isInjectable(Clearable)).toBe(true);
      MetadataManager.clearMetadata(Clearable);
      expect(MetadataManager.isInjectable(Clearable)).toBe(false);
    });
  });

  // ==================== MetadataManager.hasMetadata ====================

  describe("MetadataManager.hasMetadata", () => {
    it("should return true for decorated class", () => {
      @Injectable()
      class Decorated {}
      expect(MetadataManager.hasMetadata(Decorated)).toBe(true);
    });

    it("should return false for plain class", () => {
      class Plain {}
      expect(MetadataManager.hasMetadata(Plain)).toBe(false);
    });
  });
});
