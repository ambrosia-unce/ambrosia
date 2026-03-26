/**
 * Bun Plugin for @ambrosia/validator
 *
 * This plugin intercepts TypeScript files during load and transforms
 * validate<T>(), assert<T>(), and is<T>() calls into optimized inline
 * validation code generated from TypeScript types.
 */

import type { BunPlugin } from "bun";
import * as ts from "typescript";
import { createTransformer } from "./transformer.ts";

/**
 * Plugin options
 */
export interface ValidatorPluginOptions {
  /**
   * Enable debug logging
   */
  debug?: boolean;

  /**
   * File patterns to include (default: all .ts files)
   */
  include?: RegExp;

  /**
   * File patterns to exclude (default: node_modules)
   */
  exclude?: RegExp;

  /**
   * TypeScript compiler options
   */
  tsconfig?: ts.CompilerOptions;
}

/**
 * Create validator plugin
 */
export function createValidatorPlugin(options: ValidatorPluginOptions = {}): BunPlugin {
  const { debug = false, include = /\.ts$/, exclude = /node_modules/, tsconfig = {} } = options;

  return {
    name: "@ambrosia/validator",
    setup(build) {
      if (debug) {
        console.log("[Validator] Plugin initialized");
      }

      // TypeScript program cache
      let program: ts.Program | null = null;
      const fileVersions = new Map<string, number>();

      build.onLoad({ filter: include }, async (args) => {
        // Skip excluded files
        if (exclude.test(args.path)) {
          return undefined;
        }

        if (debug) {
          console.log(`[Validator] Processing: ${args.path}`);
        }

        try {
          // Read source file
          const source = await Bun.file(args.path).text();

          // Check if file contains validator calls (quick heuristic)
          if (
            !source.includes("validate<") &&
            !source.includes("assert<") &&
            !source.includes("is<")
          ) {
            if (debug) {
              console.log(`[Validator] No validator calls found, skipping`);
            }
            return undefined;
          }

          // Create or update TypeScript program
          if (!program) {
            // Create initial program
            const host = ts.createCompilerHost(tsconfig);
            program = ts.createProgram([args.path], tsconfig, host);

            if (debug) {
              console.log("[Validator] Created TypeScript program");
            }
          } else {
            // Update program with new file version
            const currentVersion = fileVersions.get(args.path) || 0;
            fileVersions.set(args.path, currentVersion + 1);

            // For simplicity, recreate program (in production, use incremental program)
            const host = ts.createCompilerHost(tsconfig);
            program = ts.createProgram([args.path], tsconfig, host, program);
          }

          // Create transformer
          const transformer = createTransformer({ program, debug });

          // Transform source file
          const sourceFile = program.getSourceFile(args.path);
          if (!sourceFile) {
            console.warn(`[Validator] Could not get source file: ${args.path}`);
            return undefined;
          }

          const result = ts.transform(sourceFile, [transformer]);
          const transformedSourceFile = result.transformed[0] as ts.SourceFile;

          // Print transformed code
          const printer = ts.createPrinter();
          const transformedCode = printer.printFile(transformedSourceFile);

          result.dispose();

          if (debug) {
            console.log(`[Validator] Transformed successfully`);
          }

          return {
            contents: transformedCode,
            loader: "ts",
          };
        } catch (error) {
          console.error(`[Validator] Error processing ${args.path}:`, error);
          return undefined;
        }
      });
    },
  };
}

/**
 * Default validator plugin instance
 */
export const validatorPlugin = createValidatorPlugin();
