/**
 * Test Helpers - Utility functions for testing
 */
import "reflect-metadata";
import { Container } from "../../src/container/container.ts";
import type { Constructor } from "../../src/types/common.ts";
/**
 * Clean the global Registry between tests
 * Important: Call this in beforeEach to ensure test isolation
 */
export declare function cleanRegistry(): void;
/**
 * Create a fresh container without auto-registration
 * Useful for testing manual provider registration
 */
export declare function createTestContainer(): Container;
/**
 * Mock logger for testing
 */
export declare class MockLogger {
  logs: string[];
  errors: string[];
  log(message: string): void;
  error(message: string): void;
  clear(): void;
  hasLog(message: string): boolean;
  hasError(message: string): boolean;
}
/**
 * Create a test class with a specific name and dependencies
 * Useful for dynamic test generation
 */
export declare function createTestClass(name: string, _deps?: Constructor[]): Constructor;
/**
 * Wait for a promise to settle
 * Useful for testing async operations
 */
export declare function waitFor(ms: number): Promise<void>;
/**
 * Expect an async function to throw a specific error
 */
export declare function expectAsyncThrow(
  fn: () => Promise<any>,
  errorType: new (...args: any[]) => Error,
): Promise<Error>;
//# sourceMappingURL=test-helpers.d.ts.map
