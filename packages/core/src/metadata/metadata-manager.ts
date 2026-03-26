/**
 * Metadata Manager - Type-safe wrapper around reflect-metadata
 *
 * This is the bridge between decorators and runtime, providing
 * type-safe access to metadata stored on classes and properties.
 */

import "reflect-metadata";
import type { Constructor } from "../types/common.ts";
import type {
  AutowiredMetadata,
  ImplementsMetadata,
  InjectableMetadata,
  InjectMetadata,
  OptionalMetadata,
} from "../types/metadata.ts";
import { METADATA_KEYS } from "./constants.ts";

/**
 * Metadata Manager class
 * Provides type-safe methods for storing and retrieving metadata
 *
 * Performance: Uses WeakMap caching to avoid repeated Reflect.getMetadata calls
 */
export class MetadataManager {
  // ==================== Performance Caches ====================

  /**
   * Cache for getParamTypes() to avoid repeated Reflect calls
   * WeakMap allows garbage collection when classes are no longer referenced
   */
  private static paramTypesCache = new WeakMap<Constructor, Constructor[] | undefined>();

  /**
   * Cache for getInjects() metadata
   */
  private static injectsCache = new WeakMap<Constructor, InjectMetadata[] | undefined>();

  /**
   * Cache for getOptional() metadata
   */
  private static optionalCache = new WeakMap<Constructor, OptionalMetadata[] | undefined>();

  /**
   * Cache for getAutowired() metadata
   */
  private static autowiredCache = new WeakMap<Constructor, AutowiredMetadata[] | undefined>();

  // ==================== Injectable Metadata ====================

  /**
   * Store @Injectable metadata on a class
   */
  static setInjectable(target: Constructor, metadata: InjectableMetadata): void {
    Reflect.defineMetadata(METADATA_KEYS.INJECTABLE, metadata, target);
  }

  /**
   * Retrieve @Injectable metadata from a class
   */
  static getInjectable(target: Constructor): InjectableMetadata | undefined {
    return Reflect.getMetadata(METADATA_KEYS.INJECTABLE, target);
  }

  /**
   * Check if a class has @Injectable decorator
   */
  static isInjectable(target: Constructor): boolean {
    return Reflect.hasMetadata(METADATA_KEYS.INJECTABLE, target);
  }

  // ==================== Inject Metadata ====================

  /**
   * Add @Inject metadata for a constructor parameter
   */
  static addInject(target: Constructor, metadata: InjectMetadata): void {
    const existing = MetadataManager.getInjects(target) || [];
    const updated = [...existing, metadata];
    Reflect.defineMetadata(METADATA_KEYS.INJECT, updated, target);
    // Invalidate cache
    MetadataManager.injectsCache.delete(target);
  }

  /**
   * Get all @Inject metadata for a class
   * Performance: Cached in WeakMap to avoid repeated Reflect calls
   */
  static getInjects(target: Constructor): InjectMetadata[] | undefined {
    // Check cache first
    if (MetadataManager.injectsCache.has(target)) {
      return MetadataManager.injectsCache.get(target);
    }

    // Fetch from metadata and cache
    const result = Reflect.getMetadata(METADATA_KEYS.INJECT, target);
    MetadataManager.injectsCache.set(target, result);
    return result;
  }

  /**
   * Get @Inject metadata for a specific parameter index
   */
  static getInjectForParameter(
    target: Constructor,
    parameterIndex: number,
  ): InjectMetadata | undefined {
    const injects = MetadataManager.getInjects(target);
    return injects?.find((inject) => inject.parameterIndex === parameterIndex);
  }

  // ==================== Autowired Metadata ====================

  /**
   * Add @Autowired metadata for a property
   */
  static addAutowired(target: Constructor, metadata: AutowiredMetadata): void {
    const existing = MetadataManager.getAutowired(target) || [];
    const updated = [...existing, metadata];
    Reflect.defineMetadata(METADATA_KEYS.AUTOWIRED, updated, target.prototype);
    // Invalidate cache
    MetadataManager.autowiredCache.delete(target);
  }

  /**
   * Get all @Autowired metadata for a class
   * Performance: Cached in WeakMap to avoid repeated Reflect calls
   */
  static getAutowired(target: Constructor): AutowiredMetadata[] | undefined {
    // Check cache first
    if (MetadataManager.autowiredCache.has(target)) {
      return MetadataManager.autowiredCache.get(target);
    }

    // Fetch from metadata and cache
    const result = Reflect.getMetadata(METADATA_KEYS.AUTOWIRED, target.prototype);
    MetadataManager.autowiredCache.set(target, result);
    return result;
  }

  // ==================== Optional Metadata ====================

  /**
   * Add @Optional metadata
   */
  static addOptional(target: Constructor, metadata: OptionalMetadata): void {
    const existing = MetadataManager.getOptional(target) || [];
    const updated = [...existing, metadata];
    Reflect.defineMetadata(METADATA_KEYS.OPTIONAL, updated, target);
    // Invalidate cache
    MetadataManager.optionalCache.delete(target);
  }

  /**
   * Get all @Optional metadata for a class
   * Performance: Cached in WeakMap to avoid repeated Reflect calls
   */
  static getOptional(target: Constructor): OptionalMetadata[] | undefined {
    // Check cache first
    if (MetadataManager.optionalCache.has(target)) {
      return MetadataManager.optionalCache.get(target);
    }

    // Fetch from metadata and cache
    const result = Reflect.getMetadata(METADATA_KEYS.OPTIONAL, target);
    MetadataManager.optionalCache.set(target, result);
    return result;
  }

  /**
   * Check if a parameter is marked as @Optional
   */
  static isParameterOptional(target: Constructor, parameterIndex: number): boolean {
    const optionals = MetadataManager.getOptional(target);
    return optionals?.some((opt) => opt.parameterIndex === parameterIndex) || false;
  }

  /**
   * Check if a property is marked as @Optional
   */
  static isPropertyOptional(target: Constructor, propertyKey: string | symbol): boolean {
    const optionals = MetadataManager.getOptional(target);
    return optionals?.some((opt) => opt.propertyKey === propertyKey) || false;
  }

  // ==================== Implements Metadata ====================

  /**
   * Store @Implements metadata on a class
   */
  static setImplements(target: Constructor, metadata: ImplementsMetadata): void {
    Reflect.defineMetadata(METADATA_KEYS.IMPLEMENTS, metadata, target);
  }

  /**
   * Get @Implements metadata from a class
   */
  static getImplements(target: Constructor): ImplementsMetadata | undefined {
    return Reflect.getMetadata(METADATA_KEYS.IMPLEMENTS, target);
  }

  // ==================== TypeScript Design Metadata ====================

  /**
   * Get constructor parameter types (emitted by TypeScript)
   * Returns array of constructor types
   * Performance: Cached in WeakMap - this is called on every resolution
   */
  static getParamTypes(target: Constructor): Constructor[] | undefined {
    // Check cache first
    if (MetadataManager.paramTypesCache.has(target)) {
      return MetadataManager.paramTypesCache.get(target);
    }

    // Fetch from metadata and cache
    const result = Reflect.getMetadata(METADATA_KEYS.PARAM_TYPES, target);
    MetadataManager.paramTypesCache.set(target, result);
    return result;
  }

  /**
   * Get property type (emitted by TypeScript)
   */
  static getPropertyType(target: object, propertyKey: string | symbol): Constructor | undefined {
    return Reflect.getMetadata(METADATA_KEYS.TYPE, target, propertyKey);
  }

  /**
   * Get method return type (emitted by TypeScript)
   */
  static getReturnType(target: object, propertyKey: string | symbol): Constructor | undefined {
    return Reflect.getMetadata(METADATA_KEYS.RETURN_TYPE, target, propertyKey);
  }

  // ==================== Utility Methods ====================

  /**
   * Check if a class has any metadata
   */
  static hasMetadata(target: Constructor): boolean {
    return (
      MetadataManager.isInjectable(target) ||
      Reflect.hasMetadata(METADATA_KEYS.INJECT, target) ||
      Reflect.hasMetadata(METADATA_KEYS.AUTOWIRED, target.prototype) ||
      Reflect.hasMetadata(METADATA_KEYS.OPTIONAL, target) ||
      Reflect.hasMetadata(METADATA_KEYS.IMPLEMENTS, target)
    );
  }

  /**
   * Clear all metadata from a class (useful for testing)
   */
  static clearMetadata(target: Constructor): void {
    Reflect.deleteMetadata(METADATA_KEYS.INJECTABLE, target);
    Reflect.deleteMetadata(METADATA_KEYS.INJECT, target);
    Reflect.deleteMetadata(METADATA_KEYS.AUTOWIRED, target.prototype);
    Reflect.deleteMetadata(METADATA_KEYS.OPTIONAL, target);
    Reflect.deleteMetadata(METADATA_KEYS.IMPLEMENTS, target);

    // Clear caches
    MetadataManager.paramTypesCache.delete(target);
    MetadataManager.injectsCache.delete(target);
    MetadataManager.optionalCache.delete(target);
    MetadataManager.autowiredCache.delete(target);
  }
}
