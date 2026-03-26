/**
 * Test Helpers - Utility functions for testing
 */

import "reflect-metadata";
import { Container } from "../../src/container/container.ts";
import { Registry } from "../../src/container/registry.ts";
import { Injectable } from "../../src/decorators/injectable.ts";
import type { Constructor } from "../../src/types/common.ts";

/**
 * Clean the global Registry between tests
 * Important: Call this in beforeEach to ensure test isolation
 */
export function cleanRegistry(): void {
  Registry.reset();
}

/**
 * Create a fresh container without auto-registration
 * Useful for testing manual provider registration
 */
export function createTestContainer(): Container {
  return new Container(false);
}

/**
 * Mock logger for testing
 */
export class MockLogger {
  logs: string[] = [];
  errors: string[] = [];

  log(message: string): void {
    this.logs.push(message);
  }

  error(message: string): void {
    this.errors.push(message);
  }

  clear(): void {
    this.logs = [];
    this.errors = [];
  }

  hasLog(message: string): boolean {
    return this.logs.some((log) => log.includes(message));
  }

  hasError(message: string): boolean {
    return this.errors.some((err) => err.includes(message));
  }
}

/**
 * Create a test class with a specific name and dependencies
 * Useful for dynamic test generation
 */
export function createTestClass(name: string, _deps: Constructor[] = []): Constructor {
  @Injectable()
  class DynamicTestClass {
    static injectedDeps: any[] = [];

    constructor(...args: any[]) {
      DynamicTestClass.injectedDeps = args;
    }
  }

  // Set the class name for better error messages
  Object.defineProperty(DynamicTestClass, "name", {
    value: name,
    writable: false,
  });

  return DynamicTestClass as Constructor;
}

/**
 * Wait for a promise to settle
 * Useful for testing async operations
 */
export async function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Expect an async function to throw a specific error
 */
export async function expectAsyncThrow(
  fn: () => Promise<any>,
  errorType: new (...args: any[]) => Error,
): Promise<Error> {
  try {
    await fn();
    throw new Error("Expected function to throw, but it did not");
  } catch (error) {
    if (!(error instanceof errorType)) {
      throw new Error(
        `Expected error of type ${errorType.name}, but got ${error instanceof Error ? error.constructor.name : typeof error}`,
      );
    }
    return error;
  }
}
