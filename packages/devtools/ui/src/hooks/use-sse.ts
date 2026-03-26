import { useState, useEffect, useRef, useCallback } from 'react';
import type { SSEEvent, LogEntry } from '../types';

interface UseSSEResult {
  events: SSEEvent[];
  logEntries: LogEntry[];
  connected: boolean;
  error: string | null;
  clear: () => void;
}

const MAX_EVENTS = 500;
const MAX_LOG_ENTRIES = 200;

/**
 * Known named SSE event types emitted by the DevTools server.
 * The EventSource API requires explicit addEventListener calls
 * for named events (they don't fire 'onmessage').
 */
const NAMED_EVENTS = [
  'connected',
  'heartbeat',
  'http:request',
  'event:emitted',
  'log:entry',
];

export function useSSE(url: string): UseSSEResult {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const reconnectDelay = useRef(1000);

  const addEvent = useCallback((type: string, data: unknown) => {
    const sseEvent: SSEEvent = {
      id: crypto.randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      data,
    };

    setEvents((prev) => {
      const next = [sseEvent, ...prev];
      return next.length > MAX_EVENTS ? next.slice(0, MAX_EVENTS) : next;
    });
  }, []);

  const connect = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.close();
    }

    const source = new EventSource(url);
    sourceRef.current = source;

    source.onopen = () => {
      setConnected(true);
      setError(null);
      reconnectDelay.current = 1000;
    };

    // Fallback for unnamed events
    source.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        addEvent(parsed.type ?? 'message', parsed.data ?? parsed);
      } catch {
        // Ignore unparseable messages
      }
    };

    // Listen for named SSE events
    for (const eventName of NAMED_EVENTS) {
      source.addEventListener(eventName, (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data);

          // Forward log entries to the dedicated log state
          if (eventName === 'log:entry') {
            setLogEntries((prev) => {
              const next = [...prev, parsed as LogEntry];
              return next.length > MAX_LOG_ENTRIES
                ? next.slice(next.length - MAX_LOG_ENTRIES)
                : next;
            });
          }

          addEvent(eventName, parsed);
        } catch {
          // Ignore unparseable messages
        }
      });
    }

    source.onerror = () => {
      setConnected(false);
      source.close();
      setError('Connection lost. Reconnecting...');

      reconnectTimerRef.current = setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, 10000);
        connect();
      }, reconnectDelay.current);
    };
  }, [url, addEvent]);

  useEffect(() => {
    connect();

    return () => {
      sourceRef.current?.close();
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [connect]);

  const clear = useCallback(() => {
    setEvents([]);
    setLogEntries([]);
  }, []);

  return { events, logEntries, connected, error, clear };
}
