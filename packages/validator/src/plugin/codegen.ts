/**
 * Code Generator - Generates optimized validation code from type structures
 *
 * This module generates inline JavaScript code that validates data against
 * the analyzed TypeScript type structure.
 */

import { type PropertyStructure, TypeKind, type TypeStructure } from "./type-analyzer.ts";

/**
 * Code generation options
 */
export interface CodeGenOptions {
  /**
   * Variable name for the data being validated
   */
  dataVar: string;

  /**
   * Variable name for error array
   */
  errorsVar?: string;

  /**
   * Path prefix for error messages
   */
  pathPrefix?: string;

  /**
   * Generate assert code (throws) vs validate code (returns result)
   */
  mode: "assert" | "validate" | "guard";

  /**
   * Nesting depth counter — used to generate unique loop variable names
   * for nested arrays (e.g. __i0, __i1, __i2) to avoid collisions.
   */
  depth?: number;
}

/**
 * Code Generator class
 */
export class CodeGenerator {
  /**
   * Generate validation code for a type structure
   */
  generate(structure: TypeStructure, options: CodeGenOptions): string {
    const { mode } = options;

    if (mode === "assert") {
      return this.generateAssertCode(structure, options);
    } else if (mode === "validate") {
      return this.generateValidateCode(structure, options);
    } else {
      return this.generateGuardCode(structure, options);
    }
  }

  /**
   * Generate assert-style code (throws ValidationError)
   */
  private generateAssertCode(structure: TypeStructure, options: CodeGenOptions): string {
    const checks = this.generateChecks(structure, options);

    return `
((data) => {
${checks}
  return data;
})(${options.dataVar})
    `.trim();
  }

  /**
   * Generate validate-style code (returns ValidationResult)
   */
  private generateValidateCode(structure: TypeStructure, options: CodeGenOptions): string {
    const errorsVar = options.errorsVar || "__errors";
    const checks = this.generateChecks(structure, { ...options, errorsVar }, true);

    return `
(() => {
  const ${errorsVar} = [];
${checks}

  if (${errorsVar}.length > 0) {
    return { success: false, errors: ${errorsVar} };
  }

  return { success: true, data: ${options.dataVar} };
})()
    `.trim();
  }

  /**
   * Generate guard-style code (returns boolean)
   */
  private generateGuardCode(structure: TypeStructure, options: CodeGenOptions): string {
    const checks = this.generateChecks(structure, options);

    return `
(() => {
  try {
${checks}
    return true;
  } catch {
    return false;
  }
})()
    `.trim();
  }

  /**
   * Generate validation checks for a type structure
   */
  private generateChecks(
    structure: TypeStructure,
    options: CodeGenOptions,
    collectErrors = false,
  ): string {
    const { dataVar, pathPrefix = "" } = options;

    switch (structure.kind) {
      case TypeKind.STRING:
        return this.generateStringCheck(dataVar, pathPrefix, collectErrors, options);

      case TypeKind.NUMBER:
        return this.generateNumberCheck(
          dataVar,
          pathPrefix,
          collectErrors,
          options,
          structure.constraints,
        );

      case TypeKind.BOOLEAN:
        return this.generateBooleanCheck(dataVar, pathPrefix, collectErrors, options);

      case TypeKind.OBJECT:
        return this.generateObjectCheck(structure, dataVar, pathPrefix, collectErrors, options);

      case TypeKind.ARRAY:
        return this.generateArrayCheck(structure, dataVar, pathPrefix, collectErrors, options);

      case TypeKind.UNION:
        return this.generateUnionCheck(structure, dataVar, pathPrefix, collectErrors, options);

      case TypeKind.INTERSECTION:
        return this.generateIntersectionCheck(
          structure,
          dataVar,
          pathPrefix,
          collectErrors,
          options,
        );

      case TypeKind.BRANDED:
        return this.generateBrandedCheck(structure, dataVar, pathPrefix, collectErrors, options);

      case TypeKind.LITERAL:
        return this.generateLiteralCheck(structure, dataVar, pathPrefix, collectErrors, options);

      default:
        return "";
    }
  }

  /**
   * Generate string type check
   */
  private generateStringCheck(
    dataVar: string,
    path: string,
    collectErrors: boolean,
    options: CodeGenOptions,
  ): string {
    const error = this.createError(path, "must be a string", dataVar);

    if (collectErrors) {
      return `  if (typeof ${dataVar} !== "string") ${options.errorsVar}.push(${error});`;
    }

    return `  if (typeof ${dataVar} !== "string") throw new ValidationError(${JSON.stringify(`${path || "value"} must be a string`)});`;
  }

  /**
   * Generate number type check
   */
  private generateNumberCheck(
    dataVar: string,
    path: string,
    collectErrors: boolean,
    options: CodeGenOptions,
    constraints?: any,
  ): string {
    const checks: string[] = [];
    const error = this.createError(path, "must be a number", dataVar);

    if (collectErrors) {
      checks.push(`  if (typeof ${dataVar} !== "number") ${options.errorsVar}.push(${error});`);
    } else {
      checks.push(
        `  if (typeof ${dataVar} !== "number") throw new ValidationError(${JSON.stringify(`${path || "value"} must be a number`)});`,
      );
    }

    // Add constraint checks
    if (constraints?.minimum !== undefined) {
      const minError = this.createError(path, `must be >= ${constraints.minimum}`, dataVar);
      if (collectErrors) {
        checks.push(
          `  if (${dataVar} < ${constraints.minimum}) ${options.errorsVar}.push(${minError});`,
        );
      } else {
        checks.push(
          `  if (${dataVar} < ${constraints.minimum}) throw new ValidationError(${JSON.stringify(`${path || "value"} must be >= ${constraints.minimum}`)});`,
        );
      }
    }

    if (constraints?.maximum !== undefined) {
      const maxError = this.createError(path, `must be <= ${constraints.maximum}`, dataVar);
      if (collectErrors) {
        checks.push(
          `  if (${dataVar} > ${constraints.maximum}) ${options.errorsVar}.push(${maxError});`,
        );
      } else {
        checks.push(
          `  if (${dataVar} > ${constraints.maximum}) throw new ValidationError(${JSON.stringify(`${path || "value"} must be <= ${constraints.maximum}`)});`,
        );
      }
    }

    return checks.join("\n");
  }

  /**
   * Generate boolean type check
   */
  private generateBooleanCheck(
    dataVar: string,
    path: string,
    collectErrors: boolean,
    options: CodeGenOptions,
  ): string {
    const error = this.createError(path, "must be a boolean", dataVar);

    if (collectErrors) {
      return `  if (typeof ${dataVar} !== "boolean") ${options.errorsVar}.push(${error});`;
    }

    return `  if (typeof ${dataVar} !== "boolean") throw new ValidationError(${JSON.stringify(`${path || "value"} must be a boolean`)});`;
  }

  /**
   * Generate object type check
   */
  private generateObjectCheck(
    structure: TypeStructure,
    dataVar: string,
    path: string,
    collectErrors: boolean,
    options: CodeGenOptions,
  ): string {
    const checks: string[] = [];
    const error = this.createError(path, "must be an object", dataVar);

    if (collectErrors) {
      checks.push(
        `  if (typeof ${dataVar} !== "object" || ${dataVar} === null) { ${options.errorsVar}.push(${error}); } else {`,
      );
    } else {
      checks.push(
        `  if (typeof ${dataVar} !== "object" || ${dataVar} === null) throw new ValidationError(${JSON.stringify(`${path || "value"} must be an object`)});`,
      );
    }

    // Check each property
    if (structure.properties) {
      for (const prop of structure.properties) {
        const propPath = path ? `${path}.${prop.name}` : prop.name;
        const propVar = `${dataVar}.${prop.name}`;

        if (!prop.optional) {
          const missingError = this.createError(propPath, "is required", "undefined");
          if (collectErrors) {
            checks.push(
              `  if (!(${JSON.stringify(prop.name)} in ${dataVar})) ${options.errorsVar}.push(${missingError});`,
            );
          } else {
            checks.push(
              `  if (!(${JSON.stringify(prop.name)} in ${dataVar})) throw new ValidationError(${JSON.stringify(`${propPath} is required`)});`,
            );
          }
        }

        const propChecks = this.generateChecks(
          prop.type,
          {
            ...options,
            dataVar: propVar,
            pathPrefix: propPath,
          },
          collectErrors,
        );

        if (prop.optional) {
          checks.push(`  if (${JSON.stringify(prop.name)} in ${dataVar}) {`);
          checks.push(propChecks);
          checks.push("  }");
        } else {
          checks.push(propChecks);
        }
      }
    }

    // Close the else { block for collectErrors mode null-safety guard
    if (collectErrors) {
      checks.push("  }");
    }

    return checks.join("\n");
  }

  /**
   * Generate array type check
   */
  private generateArrayCheck(
    structure: TypeStructure,
    dataVar: string,
    path: string,
    collectErrors: boolean,
    options: CodeGenOptions,
  ): string {
    const checks: string[] = [];
    const error = this.createError(path, "must be an array", dataVar);

    if (collectErrors) {
      checks.push(`  if (!Array.isArray(${dataVar})) ${options.errorsVar}.push(${error});`);
    } else {
      checks.push(
        `  if (!Array.isArray(${dataVar})) throw new ValidationError(${JSON.stringify(`${path || "value"} must be an array`)});`,
      );
    }

    // Check each element — use depth-based iterator to avoid collisions in nested arrays
    if (structure.elementType) {
      const depth = options.depth ?? 0;
      const iterVar = `__i${depth}`;
      checks.push(`  for (let ${iterVar} = 0; ${iterVar} < ${dataVar}.length; ${iterVar}++) {`);
      const elementChecks = this.generateChecks(
        structure.elementType,
        {
          ...options,
          dataVar: `${dataVar}[${iterVar}]`,
          pathPrefix: `${path}[${iterVar}]`,
          depth: depth + 1,
        },
        collectErrors,
      );
      checks.push(elementChecks);
      checks.push("  }");
    }

    return checks.join("\n");
  }

  /**
   * Generate union type check
   */
  private generateUnionCheck(
    structure: TypeStructure,
    dataVar: string,
    path: string,
    collectErrors: boolean,
    options: CodeGenOptions,
  ): string {
    // For unions, we try each type and accept the first that validates
    if (!structure.types) return "";

    const checks: string[] = [];
    // Wrap in do-while(false) so `break` is valid
    checks.push("  do {");
    checks.push("    let __valid = false;");

    for (const unionType of structure.types) {
      checks.push("    try {");
      const typeChecks = this.generateChecks(unionType, options, false);
      checks.push(typeChecks);
      checks.push("      __valid = true;");
      checks.push("    } catch {}");
      checks.push("    if (__valid) break;");
    }

    const error = this.createError(path, "must match one of the union types", dataVar);
    if (collectErrors) {
      checks.push(`    if (!__valid) ${options.errorsVar}.push(${error});`);
    } else {
      checks.push(
        `    if (!__valid) throw new ValidationError(${JSON.stringify(`${path || "value"} must match one of the union types`)});`,
      );
    }

    checks.push("  } while (false);");
    return checks.join("\n");
  }

  /**
   * Generate intersection type check
   * All constituent types must pass validation
   */
  private generateIntersectionCheck(
    structure: TypeStructure,
    dataVar: string,
    path: string,
    collectErrors: boolean,
    options: CodeGenOptions,
  ): string {
    if (!structure.types) return "";

    // Generate checks for each type in the intersection — all must pass
    return structure.types
      .map((t) => this.generateChecks(t, { ...options, dataVar, pathPrefix: path }, collectErrors))
      .join("\n");
  }

  /**
   * Generate branded type check
   */
  private generateBrandedCheck(
    structure: TypeStructure,
    dataVar: string,
    path: string,
    collectErrors: boolean,
    options: CodeGenOptions,
  ): string {
    const brand = structure.brand!;
    const patterns: Record<string, string> = {
      // String patterns (regex-based)
      Email: `/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/`,
      UUID: `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`,
      URL: `new URL(${dataVar})`, // Will throw if invalid
      IPv4: `/^((25[0-5]|(2[0-4]|1\\d|[1-9]|)\\d)\\.?\\b){4}$/`,
      IPv6: `/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::$|^([0-9a-fA-F]{1,4}:){1,7}:$|^:(:([0-9a-fA-F]{1,4})){1,7}$|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$/`,
      DateString: `/^\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$/`,
      DateTime: `/^\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])T(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z|[+-](?:[01]\\d|2[0-3]):[0-5]\\d)?$/`,
      JSONString: `JSON.parse(${dataVar})`, // Will throw if invalid
      PhoneNumber: `/^\\+[1-9]\\d{6,14}$/`,
      CreditCard: `__luhn(${dataVar})`, // Luhn algorithm
      HexColor: `/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/`,
      Base64: `/^[A-Za-z0-9+/]*={0,2}$/`,
      Alphanumeric: `/^[a-zA-Z0-9]+$/`,
      NonEmptyString: `${dataVar}.length > 0`,

      // Number patterns (expression-based)
      PositiveInt: `Number.isInteger(${dataVar}) && ${dataVar} > 0`,
      NonNegativeInt: `Number.isInteger(${dataVar}) && ${dataVar} >= 0`,
      Integer: `Number.isInteger(${dataVar})`,
      SafeInteger: `Number.isSafeInteger(${dataVar})`,

      // String case patterns
      Lowercase: `${dataVar} === ${dataVar}.toLowerCase()`,
      Uppercase: `${dataVar} === ${dataVar}.toUpperCase()`,
    };

    const pattern = patterns[brand];
    if (!pattern) {
      return this.generateStringCheck(dataVar, path, collectErrors, options);
    }

    const error = this.createError(path, `must be a valid ${brand}`, dataVar);
    const throwMsg = `throw new ValidationError(${JSON.stringify(`${path || "value"} must be a valid ${brand}`)})`;

    // Try/catch brands (URL, JSONString)
    const tryCatchBrands = ["URL", "JSONString"];
    if (tryCatchBrands.includes(brand)) {
      if (collectErrors) {
        return `  try { ${pattern}; } catch { ${options.errorsVar}.push(${error}); }`;
      }
      return `  try { ${pattern}; } catch { ${throwMsg}; }`;
    }

    // CreditCard uses inline Luhn algorithm
    if (brand === "CreditCard") {
      const luhnCheck = `((s) => { const d = s.replace(/\\D/g, ""); let sum = 0; for (let i = d.length - 1, alt = false; i >= 0; i--, alt = !alt) { let n = parseInt(d[i], 10); if (alt) { n *= 2; if (n > 9) n -= 9; } sum += n; } return sum % 10 === 0 && d.length >= 13 && d.length <= 19; })(${dataVar})`;
      if (collectErrors) {
        return `  if (!${luhnCheck}) ${options.errorsVar}.push(${error});`;
      }
      return `  if (!${luhnCheck}) ${throwMsg};`;
    }

    // Expression-based brands (no .test())
    const expressionBrands = [
      "PositiveInt",
      "NonNegativeInt",
      "Integer",
      "SafeInteger",
      "Lowercase",
      "Uppercase",
      "NonEmptyString",
    ];
    if (expressionBrands.includes(brand)) {
      if (collectErrors) {
        return `  if (!(${pattern})) ${options.errorsVar}.push(${error});`;
      }
      return `  if (!(${pattern})) ${throwMsg};`;
    }

    // Regex-based brands (default)
    if (collectErrors) {
      return `  if (!${pattern}.test(${dataVar})) ${options.errorsVar}.push(${error});`;
    }

    return `  if (!${pattern}.test(${dataVar})) ${throwMsg};`;
  }

  /**
   * Generate literal type check
   */
  private generateLiteralCheck(
    structure: TypeStructure,
    dataVar: string,
    path: string,
    collectErrors: boolean,
    options: CodeGenOptions,
  ): string {
    const literal = JSON.stringify(structure.literal);
    const error = this.createError(path, `must be ${literal}`, dataVar);

    if (collectErrors) {
      return `  if (${dataVar} !== ${literal}) ${options.errorsVar}.push(${error});`;
    }

    return `  if (${dataVar} !== ${literal}) throw new ValidationError(${JSON.stringify(`${path || "value"} must be ${literal}`)});`;
  }

  /**
   * Create error object
   */
  private createError(path: string, message: string, value: string): string {
    return `{ path: ${JSON.stringify(path)}, message: ${JSON.stringify(message)}, value: ${value} }`;
  }
}
