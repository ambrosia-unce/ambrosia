/**
 * Bun-native filesystem utilities — no `node:fs/promises` dependency.
 */

import { mkdir } from "node:fs/promises";

/** Write content to a file using Bun.write. */
export async function writeFile(path: string, content: string): Promise<void> {
  await Bun.write(path, content);
}

/** Check if a file exists. */
export async function fileExists(path: string): Promise<boolean> {
  return Bun.file(path).exists();
}

/** Create a directory recursively. Uses native fs API to avoid shell injection. */
export async function mkdirp(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

/** Read a file as text. */
export async function readFile(path: string): Promise<string> {
  return Bun.file(path).text();
}

/** Read and parse a JSON file. */
export async function readJson<T = unknown>(path: string): Promise<T> {
  return JSON.parse(await Bun.file(path).text()) as T;
}

/** Write an object as formatted JSON. */
export async function writeJson(path: string, data: unknown): Promise<void> {
  await Bun.write(path, `${JSON.stringify(data, null, 2)}\n`);
}
