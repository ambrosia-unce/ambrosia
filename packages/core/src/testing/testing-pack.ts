/**
 * TestingPackFactory — utilities for testing packs in isolation.
 *
 * @example
 * ```typescript
 * const testPack = await TestingPackFactory
 *   .create(AuthPack.forRoot({ secret: "test" }))
 *   .overrideValue(DATABASE_TOKEN, mockDb)
 *   .override(LoggerService, MockLoggerService)
 *   .compile();
 *
 * const auth = testPack.get(AuthService);
 * // ... run assertions
 * await testPack.close();
 * ```
 */

import { Container } from "../container/container.ts";
import { PackProcessor } from "../pack/pack-processor.ts";
import type { Packable } from "../pack/types.ts";
import type { Constructor, Factory, Token } from "../types/common.ts";
import type { Provider } from "../types/provider.ts";

export interface TestingPack {
  get<T = unknown>(token: Token<T>): T;
  getOptional<T = unknown>(token: Token<T>): T | undefined;
  getContainer(): Container;
  close(): Promise<void>;
}

export class TestingPackFactory {
  private packs: Packable[];
  private overrides = new Map<Token, Provider>();

  private constructor(packs: Packable[]) {
    this.packs = packs;
  }

  static create(...packs: Packable[]): TestingPackFactory {
    return new TestingPackFactory(packs);
  }

  override<T>(token: Token<T>, useClass: Constructor<T>): this {
    this.overrides.set(token, { token, useClass });
    return this;
  }

  overrideValue<T>(token: Token<T>, value: T): this {
    this.overrides.set(token, { token, useValue: value });
    return this;
  }

  overrideFactory<T>(token: Token<T>, factory: Factory<T>): this {
    this.overrides.set(token, { token, useFactory: factory });
    return this;
  }

  async compile(): Promise<TestingPack> {
    const container = new Container({ autoRegister: false });

    const processor = new PackProcessor();
    const result = processor.process(this.packs);
    PackProcessor.registerInContainer(container, result.providers);

    // Overrides AFTER pack registration — overrides win
    for (const provider of this.overrides.values()) {
      container.register(provider);
    }

    // Execute lifecycle init
    const lifecycleManager = processor.getLifecycleManager();
    await lifecycleManager.executeInit(container);

    return {
      get: <T = unknown>(token: Token<T>) => container.resolve<T>(token),
      getOptional: <T = unknown>(token: Token<T>) => container.resolveOptional<T>(token),
      getContainer: () => container,
      close: async () => {
        await lifecycleManager.executeDestroy();
        await container.destroyAll();
      },
    };
  }
}
