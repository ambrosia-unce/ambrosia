/**
 * Error Formatter — Pretty terminal output for AmbrosiaError.
 *
 * Produces colorized, boxed error messages with hints and docs links.
 * Respects NO_COLOR environment variable for plain text output.
 */

import { AmbrosiaError } from "./ambrosia-error.ts";

// ─── ANSI Color Helpers ──────────────────────────────────────────────────

const supportsColor = (): boolean => {
  // Respect NO_COLOR convention: https://no-color.org/
  if (typeof process !== "undefined" && process.env?.NO_COLOR !== undefined) {
    return false;
  }
  // Bun and Node both support colors in TTY
  if (typeof process !== "undefined" && process.stderr?.isTTY) {
    return true;
  }
  return false;
};

interface Colors {
  red: (s: string) => string;
  cyan: (s: string) => string;
  yellow: (s: string) => string;
  dim: (s: string) => string;
  bold: (s: string) => string;
  reset: string;
}

const ansi = (code: string, reset: string) => (s: string) => `\x1b[${code}m${s}\x1b[${reset}m`;

const colorful: Colors = {
  red: ansi("31", "39"),
  cyan: ansi("36", "39"),
  yellow: ansi("33", "39"),
  dim: ansi("2", "22"),
  bold: ansi("1", "22"),
  reset: "\x1b[0m",
};

const plain: Colors = {
  red: (s) => s,
  cyan: (s) => s,
  yellow: (s) => s,
  dim: (s) => s,
  bold: (s) => s,
  reset: "",
};

// ─── Formatter ───────────────────────────────────────────────────────────

const BAR = "\u2502";  // │
const TL = "\u250c";   // ┌
const BL = "\u2514";   // └
const HR = "\u2500";   // ─

/**
 * Wrap long text to fit within a max width, preserving leading indent.
 */
function wrapText(text: string, maxWidth: number, indent: string): string {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (currentLine.length === 0) {
      currentLine = word;
    } else if (currentLine.length + 1 + word.length > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine += " " + word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.map((line, i) => (i === 0 ? line : indent + line)).join("\n");
}

/**
 * Format an AmbrosiaError into a pretty string for the terminal.
 *
 * @param error - The AmbrosiaError to format
 * @returns Formatted multi-line string
 *
 * @example
 * ```ts
 * const err = new AmbrosiaError('AMB001', 'Provider not found', 'Add @Injectable()');
 * console.error(formatError(err));
 * ```
 */
export function formatError(error: AmbrosiaError): string {
  const c = supportsColor() ? colorful : plain;
  const width = 65;
  const hrLine = HR.repeat(width);

  const lines: string[] = [];

  // Top border with code and title
  const titlePart = `${TL}${HR} ${c.cyan(error.code)}: ${c.bold(c.red(error.message))} `;
  const titlePlainLength = `${TL}${HR} ${error.code}: ${error.message} `.length;
  const remainingDashes = Math.max(0, width + 2 - titlePlainLength);
  lines.push(titlePart + HR.repeat(remainingDashes));

  // Empty bar
  lines.push(`${BAR}`);

  // Message body
  const messageIndent = `${BAR}  `;
  const wrappedMessage = wrapText(error.message, width - 4, messageIndent);
  lines.push(`${messageIndent}${wrappedMessage}`);

  // Context fields
  if (error.context && Object.keys(error.context).length > 0) {
    lines.push(`${BAR}`);
    for (const [key, value] of Object.entries(error.context)) {
      const valueStr = typeof value === "string" ? value : JSON.stringify(value);
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      const contextLine = wrapText(`${valueStr}`, width - 6 - label.length, `${BAR}  ${" ".repeat(label.length + 2)}`);
      lines.push(`${BAR}  ${c.bold(label)}: ${contextLine}`);
    }
  }

  // Hint
  if (error.hint) {
    lines.push(`${BAR}`);
    const hintIndent = `${BAR}  ${" ".repeat("Hint: ".length)}`;
    const wrappedHint = wrapText(error.hint, width - 10, hintIndent);
    lines.push(`${BAR}  ${c.yellow("Hint")}: ${wrappedHint}`);
  }

  // Docs link
  lines.push(`${BAR}`);
  lines.push(`${BAR}  ${c.dim(`Docs: ${error.docsUrl}`)}`);

  // Bottom border
  lines.push(`${BAR}`);
  lines.push(`${BL}${hrLine}${HR}`);

  return lines.join("\n");
}

/**
 * Print a formatted AmbrosiaError to stderr.
 *
 * @param error - The AmbrosiaError to print
 */
export function printError(error: AmbrosiaError): void {
  const formatted = formatError(error);

  if (typeof process !== "undefined" && process.stderr?.write) {
    process.stderr.write(formatted + "\n");
  } else {
    console.error(formatted);
  }
}

/**
 * Format any Error — if it's an AmbrosiaError, use pretty formatting.
 * Otherwise, return the default message.
 */
export function formatAnyError(error: unknown): string {
  if (error instanceof AmbrosiaError) {
    return formatError(error);
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
