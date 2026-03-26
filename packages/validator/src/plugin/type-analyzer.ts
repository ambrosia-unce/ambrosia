/**
 * Type Analyzer - Analyzes TypeScript types using TypeScript Compiler API
 *
 * This module provides functions to analyze TypeScript types and extract
 * structural information needed for validation code generation.
 */

import * as ts from "typescript";
import type { JSDocConstraints } from "../types/jsdoc.ts";

/**
 * Analyzed type structure
 */
export interface TypeStructure {
  kind: TypeKind;
  name?: string;
  properties?: PropertyStructure[];
  elementType?: TypeStructure;
  types?: TypeStructure[]; // For union/intersection
  literal?: string | number | boolean;
  brand?: string; // For branded types
  constraints?: JSDocConstraints;
}

/**
 * Property structure in an object/interface
 */
export interface PropertyStructure {
  name: string;
  type: TypeStructure;
  optional: boolean;
  constraints?: JSDocConstraints;
}

/**
 * Type kinds we can validate
 */
export enum TypeKind {
  STRING = "string",
  NUMBER = "number",
  BOOLEAN = "boolean",
  OBJECT = "object",
  ARRAY = "array",
  UNION = "union",
  INTERSECTION = "intersection",
  LITERAL = "literal",
  UNDEFINED = "undefined",
  NULL = "null",
  UNKNOWN = "unknown",
  ANY = "any",
  BRANDED = "branded",
}

/**
 * Type Analyzer class
 */
export class TypeAnalyzer {
  private checker: ts.TypeChecker;
  private program: ts.Program;

  constructor(program: ts.Program) {
    this.program = program;
    this.checker = program.getTypeChecker();
  }

  /**
   * Analyze a type from a type node
   */
  analyzeType(typeNode: ts.TypeNode): TypeStructure {
    const type = this.checker.getTypeFromTypeNode(typeNode);
    return this.analyzeTypeInternal(type, typeNode);
  }

  /**
   * Analyze a type from a type reference
   */
  analyzeTypeFromSymbol(type: ts.Type, node?: ts.Node): TypeStructure {
    return this.analyzeTypeInternal(type, node);
  }

  /** Set of type IDs currently being analyzed — prevents infinite recursion on self-referential types */
  private analyzingTypes = new Set<number>();

  /**
   * Internal type analysis
   */
  private analyzeTypeInternal(type: ts.Type, node?: ts.Node): TypeStructure {
    // Cycle detection: if we're already analyzing this type, return UNKNOWN
    // to break the recursion (e.g. interface Node { next?: Node })
    const typeId = (type as any).id;
    if (typeId !== undefined && this.analyzingTypes.has(typeId)) {
      return { kind: TypeKind.UNKNOWN };
    }
    if (typeId !== undefined) {
      this.analyzingTypes.add(typeId);
    }
    try {
      return this.analyzeTypeInner(type, node);
    } finally {
      if (typeId !== undefined) {
        this.analyzingTypes.delete(typeId);
      }
    }
  }

  private analyzeTypeInner(type: ts.Type, node?: ts.Node): TypeStructure {
    // Check for branded types
    const brand = this.extractBrandName(type);
    if (brand) {
      return {
        kind: TypeKind.BRANDED,
        brand,
        name: this.checker.typeToString(type),
      };
    }

    // String type
    if (type.flags & ts.TypeFlags.String) {
      return { kind: TypeKind.STRING };
    }

    // String literal type
    if (type.flags & ts.TypeFlags.StringLiteral) {
      const literalType = type as ts.StringLiteralType;
      return {
        kind: TypeKind.LITERAL,
        literal: literalType.value,
      };
    }

    // Number type
    if (type.flags & ts.TypeFlags.Number) {
      return { kind: TypeKind.NUMBER };
    }

    // Number literal type
    if (type.flags & ts.TypeFlags.NumberLiteral) {
      const literalType = type as ts.NumberLiteralType;
      return {
        kind: TypeKind.LITERAL,
        literal: literalType.value,
      };
    }

    // Boolean type
    if (type.flags & ts.TypeFlags.Boolean) {
      return { kind: TypeKind.BOOLEAN };
    }

    // Boolean literal type
    if (type.flags & ts.TypeFlags.BooleanLiteral) {
      return {
        kind: TypeKind.LITERAL,
        literal: (type as any).intrinsicName === "true",
      };
    }

    // Undefined type
    if (type.flags & ts.TypeFlags.Undefined) {
      return { kind: TypeKind.UNDEFINED };
    }

    // Null type
    if (type.flags & ts.TypeFlags.Null) {
      return { kind: TypeKind.NULL };
    }

    // Union type
    if (type.flags & ts.TypeFlags.Union) {
      const unionType = type as ts.UnionType;
      return {
        kind: TypeKind.UNION,
        types: unionType.types.map((t) => this.analyzeTypeInternal(t)),
      };
    }

    // Intersection type
    if (type.flags & ts.TypeFlags.Intersection) {
      const intersectionType = type as ts.IntersectionType;
      return {
        kind: TypeKind.INTERSECTION,
        types: intersectionType.types.map((t) => this.analyzeTypeInternal(t)),
      };
    }

    // Array type
    if (this.checker.isArrayType(type)) {
      const typeArguments = (type as any).typeArguments;
      const elementType = typeArguments && typeArguments[0];
      return {
        kind: TypeKind.ARRAY,
        elementType: elementType
          ? this.analyzeTypeInternal(elementType)
          : { kind: TypeKind.UNKNOWN },
      };
    }

    // Object/Interface type
    if (type.flags & ts.TypeFlags.Object) {
      const properties = this.extractProperties(type);
      if (properties.length > 0) {
        return {
          kind: TypeKind.OBJECT,
          properties,
          name: type.symbol?.name,
        };
      }
    }

    // Any type
    if (type.flags & ts.TypeFlags.Any) {
      return { kind: TypeKind.ANY };
    }

    // Fallback to unknown
    return { kind: TypeKind.UNKNOWN };
  }

  /**
   * Extract properties from an object/interface type
   */
  private extractProperties(type: ts.Type): PropertyStructure[] {
    const properties: PropertyStructure[] = [];
    const typeProperties = this.checker.getPropertiesOfType(type);

    for (const prop of typeProperties) {
      const propType = this.checker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration!);

      const optional = !!(prop.flags & ts.SymbolFlags.Optional);

      // Extract JSDoc constraints from property declaration
      const constraints = this.extractJSDocConstraints(prop.valueDeclaration);

      properties.push({
        name: prop.name,
        type: this.analyzeTypeInternal(propType),
        optional,
        constraints,
      });
    }

    return properties;
  }

  /**
   * Extract brand name from branded type
   * A branded type has an intersection with { __brand: "BrandName" }
   */
  private extractBrandName(type: ts.Type): string | undefined {
    if (!(type.flags & ts.TypeFlags.Intersection)) {
      return undefined;
    }

    const intersectionType = type as ts.IntersectionType;
    for (const t of intersectionType.types) {
      if (t.flags & ts.TypeFlags.Object) {
        const properties = this.checker.getPropertiesOfType(t);
        const brandProp = properties.find((p) => p.name === "__brand");

        if (brandProp) {
          const brandType = this.checker.getTypeOfSymbolAtLocation(
            brandProp,
            brandProp.valueDeclaration!,
          );

          if (brandType.flags & ts.TypeFlags.StringLiteral) {
            return (brandType as ts.StringLiteralType).value;
          }
        }
      }
    }

    return undefined;
  }

  /**
   * Extract JSDoc constraints from a node's JSDoc comments
   */
  private extractJSDocConstraints(node?: ts.Node): JSDocConstraints | undefined {
    if (!node) return undefined;

    const jsdocTags = ts.getJSDocTags(node);
    if (jsdocTags.length === 0) return undefined;

    const constraints: JSDocConstraints = {};

    for (const tag of jsdocTags) {
      const tagName = `@${tag.tagName.text}`;
      const comment = typeof tag.comment === "string" ? tag.comment : undefined;

      if (!comment) continue;

      switch (tagName) {
        case "@minLength":
          constraints.minLength = parseInt(comment, 10);
          break;
        case "@maxLength":
          constraints.maxLength = parseInt(comment, 10);
          break;
        case "@pattern":
          constraints.pattern = comment;
          break;
        case "@format":
          constraints.format = comment;
          break;
        case "@minimum":
          constraints.minimum = parseFloat(comment);
          break;
        case "@maximum":
          constraints.maximum = parseFloat(comment);
          break;
        case "@minItems":
          constraints.minItems = parseInt(comment, 10);
          break;
        case "@maxItems":
          constraints.maxItems = parseInt(comment, 10);
          break;
        case "@optional":
          constraints.optional = true;
          break;
        case "@nullable":
          constraints.nullable = true;
          break;
      }
    }

    return Object.keys(constraints).length > 0 ? constraints : undefined;
  }
}
