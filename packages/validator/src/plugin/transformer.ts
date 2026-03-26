/**
 * Transformer - Main plugin transformer that replaces validate/assert/is calls
 * with generated validation code
 */

import * as ts from "typescript";
import { CodeGenerator } from "./codegen.ts";
import { TypeAnalyzer } from "./type-analyzer.ts";

/**
 * Transformer options
 */
export interface TransformerOptions {
  /**
   * TypeScript program
   */
  program: ts.Program;

  /**
   * Enable debug logging
   */
  debug?: boolean;
}

/**
 * Create transformer factory
 */
export function createTransformer(
  options: TransformerOptions,
): ts.TransformerFactory<ts.SourceFile> {
  const { program, debug } = options;
  const analyzer = new TypeAnalyzer(program);
  const codegen = new CodeGenerator();
  const checker = program.getTypeChecker();

  return (context: ts.TransformationContext) => {
    return (sourceFile: ts.SourceFile) => {
      if (debug) {
        console.log(`[Validator] Transforming: ${sourceFile.fileName}`);
      }

      const visitor = (node: ts.Node): ts.Node => {
        // Look for validate<T>(), assert<T>(), is<T>() calls
        if (ts.isCallExpression(node)) {
          const callExpr = node as ts.CallExpression;

          // Check if it's one of our validation functions
          const funcName = getFunctionName(callExpr);
          if (funcName === "validate" || funcName === "assert" || funcName === "is") {
            // Check if it has a type argument
            if (callExpr.typeArguments && callExpr.typeArguments.length > 0) {
              const typeArg = callExpr.typeArguments[0];

              if (debug) {
                console.log(`[Validator] Found ${funcName}<T>() call`);
              }

              // Analyze the type
              try {
                const structure = analyzer.analyzeType(typeArg);

                // Get the data argument
                const dataArg = callExpr.arguments[0];
                if (!dataArg) {
                  console.warn(`[Validator] ${funcName}<T>() missing data argument`);
                  return node;
                }

                // Generate validation code
                const mode =
                  funcName === "validate" ? "validate" : funcName === "assert" ? "assert" : "guard";

                // Get data argument as string
                const printer = ts.createPrinter();
                const dataVarCode = printer.printNode(ts.EmitHint.Expression, dataArg, sourceFile);

                const validationCode = codegen.generate(structure, {
                  dataVar: dataVarCode,
                  mode,
                });

                if (debug) {
                  console.log(`[Validator] Generated code:\n${validationCode}`);
                }

                // Parse generated code and return as expression
                const generatedExpr = parseExpression(validationCode);
                if (generatedExpr) {
                  return generatedExpr;
                }
              } catch (error) {
                console.error(`[Validator] Error transforming ${funcName}<T>():`, error);
              }
            }
          }
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
    };
  };
}

/**
 * Get function name from call expression
 */
function getFunctionName(callExpr: ts.CallExpression): string | null {
  const expression = callExpr.expression;

  if (ts.isIdentifier(expression)) {
    return expression.text;
  }

  if (ts.isPropertyAccessExpression(expression)) {
    return expression.name.text;
  }

  return null;
}

/**
 * Parse generated code string into AST expression
 * This is a simplified version - in production, use a proper parser
 */
function parseExpression(code: string): ts.Expression | null {
  try {
    // Create a temporary source file
    const sourceFile = ts.createSourceFile("temp.ts", code, ts.ScriptTarget.Latest, true);

    // Extract the expression
    if (sourceFile.statements.length > 0) {
      const statement = sourceFile.statements[0];
      if (ts.isExpressionStatement(statement)) {
        return statement.expression;
      }
    }

    return null;
  } catch (error) {
    console.error("[Validator] Failed to parse generated code:", error);
    return null;
  }
}

/**
 * Transpile a node to JavaScript string
 */
function transpileNode(node: ts.Node, options: ts.CompilerOptions): string {
  const printer = ts.createPrinter();
  return printer.printNode(ts.EmitHint.Unspecified, node, node.getSourceFile());
}
