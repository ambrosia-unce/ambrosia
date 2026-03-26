/**
 * Server-Sent Events (SSE) stream
 */

/**
 * SSE event data
 */
export interface SseEvent {
  /** Event data (string or object, objects are JSON-serialized) */
  data: string | object;
  /** Event type/name */
  event?: string;
  /** Event ID for reconnection */
  id?: string;
  /** Reconnection interval in ms */
  retry?: number;
}

/**
 * SseStream
 *
 * Wraps a ReadableStream for Server-Sent Events.
 * Create an instance and return it from a controller method marked with @Sse().
 *
 * @example
 * ```typescript
 * @Controller('/events')
 * export class EventsController {
 *   @Get('/')
 *   @Sse()
 *   stream() {
 *     const sse = new SseStream();
 *
 *     const interval = setInterval(() => {
 *       sse.send({ data: { time: Date.now() }, event: 'tick' });
 *     }, 1000);
 *
 *     // Clean up when client disconnects
 *     sse.onClose(() => clearInterval(interval));
 *
 *     return sse;
 *   }
 * }
 * ```
 */
export class SseStream {
  private controller: ReadableStreamDefaultController | null = null;
  private encoder = new TextEncoder();
  private closeCallbacks: Array<() => void> = [];

  readonly stream: ReadableStream;

  constructor() {
    this.stream = new ReadableStream({
      start: (controller) => {
        this.controller = controller;
      },
      cancel: () => {
        this.controller = null;
        for (const cb of this.closeCallbacks) {
          cb();
        }
      },
    });
  }

  /**
   * Send an SSE event
   */
  send(event: SseEvent): void {
    if (!this.controller) return;

    try {
      let message = "";
      if (event.id) message += `id: ${event.id}\n`;
      if (event.event) message += `event: ${event.event}\n`;
      if (event.retry) message += `retry: ${event.retry}\n`;

      let data: string;
      if (typeof event.data === "object" && event.data !== null) {
        data = JSON.stringify(event.data);
      } else {
        data = String(event.data ?? "");
      }

      message += `data: ${data}\n\n`;
      this.controller.enqueue(this.encoder.encode(message));
    } catch {
      // Controller closed or JSON.stringify failed — silently ignore
      this.controller = null;
    }
  }

  /**
   * Register a callback for when the client disconnects
   */
  onClose(callback: () => void): void {
    this.closeCallbacks.push(callback);
  }

  /**
   * Close the stream
   */
  close(): void {
    if (this.controller) {
      this.controller.close();
      this.controller = null;
    }
    for (const cb of this.closeCallbacks) {
      cb();
    }
  }
}
