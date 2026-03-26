/**
 * Path Matcher
 *
 * Утилиты для работы с HTTP путями:
 * - Нормализация путей
 * - Конвертация в regex для поддержки :id параметров
 * - Извлечение параметров из путей
 */

/**
 * Нормализует путь
 *
 * @example
 * normalize("/users/") → "/users"
 * normalize("users") → "/users"
 * normalize("//users//") → "/users"
 * normalize("/") → "/"
 */
export function normalize(path: string): string {
  const normalized = path.trim().replace(/^\/+|\/+$/g, "");
  if (normalized === "") {
    return "/";
  }
  return "/" + normalized;
}

/**
 * Cache for compiled path regexes to avoid re-creating RegExp on every match
 */
const regexCache = new Map<string, RegExp>();

/**
 * Конвертирует путь с параметрами в RegExp
 *
 * Поддерживаемые форматы:
 * - /users/:id → /^\/users\/([^\/]+)$/
 * - /posts/:postId/comments/:commentId → /^\/posts\/([^\/]+)\/comments\/([^\/]+)$/
 *
 * @param pattern - Путь с параметрами (:id, :name, etc.)
 * @returns RegExp для матчинга
 *
 * @example
 * const regex = pathToRegex('/users/:id');
 * regex.test('/users/123'); // true
 * regex.test('/users/123/posts'); // false
 */
export function pathToRegex(pattern: string): RegExp {
  let cached = regexCache.get(pattern);
  if (cached) return cached;

  // Экранируем специальные символы regex (кроме :)
  let regexPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");

  // Заменяем :param на capturing group
  regexPattern = regexPattern.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, "([^/]+)");

  // Добавляем якоря начала и конца
  cached = new RegExp(`^${regexPattern}$`);
  regexCache.set(pattern, cached);
  return cached;
}

/**
 * Извлекает имена параметров из pattern
 *
 * @param pattern - Путь с параметрами
 * @returns Массив имен параметров
 *
 * @example
 * extractParamNames('/users/:id') → ['id']
 * extractParamNames('/posts/:postId/comments/:commentId') → ['postId', 'commentId']
 */
export function extractParamNames(pattern: string): string[] {
  const matches = pattern.matchAll(/:([a-zA-Z_][a-zA-Z0-9_]*)/g);
  return Array.from(matches, (match) => match[1]);
}

/**
 * Проверяет, соответствует ли путь паттерну
 *
 * @param pattern - Путь с параметрами (:id, :name, etc.)
 * @param path - Фактический путь для проверки
 * @returns true если путь соответствует паттерну
 *
 * @example
 * matches('/users/:id', '/users/123') → true
 * matches('/users/:id', '/users/123/posts') → false
 */
export function matches(pattern: string, path: string): boolean {
  const regex = pathToRegex(pattern);
  return regex.test(path);
}

/**
 * Извлекает параметры из пути
 *
 * @param pattern - Путь с параметрами (:id, :name, etc.)
 * @param path - Фактический путь
 * @returns Объект с параметрами или null если не соответствует
 *
 * @example
 * extractParams('/users/:id', '/users/123')
 * → { id: '123' }
 *
 * extractParams('/posts/:postId/comments/:commentId', '/posts/1/comments/2')
 * → { postId: '1', commentId: '2' }
 *
 * extractParams('/users/:id', '/posts/123')
 * → null
 */
export function extractParams(pattern: string, path: string): Record<string, string> | null {
  const regex = pathToRegex(pattern);
  const match = path.match(regex);

  if (!match) {
    return null;
  }

  const paramNames = extractParamNames(pattern);
  const params: Record<string, string> = {};

  // match[0] - полное совпадение, match[1+] - capturing groups
  for (let i = 0; i < paramNames.length; i++) {
    params[paramNames[i]] = match[i + 1];
  }

  return params;
}

/**
 * PathMatcher класс (если нужна stateful версия)
 */
export class PathMatcher {
  /**
   * Нормализует путь
   */
  static normalize = normalize;

  /**
   * Конвертирует путь в RegExp
   */
  static pathToRegex = pathToRegex;

  /**
   * Извлекает имена параметров
   */
  static extractParamNames = extractParamNames;

  /**
   * Проверяет соответствие
   */
  static matches = matches;

  /**
   * Извлекает параметры
   */
  static extractParams = extractParams;
}
