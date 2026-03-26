import React, { useState } from 'react';
import { useApi } from '../hooks/use-api';
import type { EventData, SSEEvent } from '../types';
import { JsonView } from './JsonView';
import {
  Radio,
  Trash2,
  ChevronDown,
  ChevronRight,
  Zap,
  List,
} from 'lucide-react';

interface EventMonitorProps {
  events: SSEEvent[];
  connected: boolean;
  onClear: () => void;
}

function formatTime(timestamp: string): string {
  try {
    const d = new Date(timestamp);
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  } catch {
    return timestamp;
  }
}

export const EventMonitor: React.FC<EventMonitorProps> = ({
  events,
  connected,
  onClear,
}) => {
  const { data: handlerData, loading } = useApi<EventData>('events');
  const [activeTab, setActiveTab] = useState<'stream' | 'handlers'>('stream');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Event Monitor</h1>
          <p className="text-sm text-dt-muted mt-0.5">
            Live event stream and handler registry
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? 'bg-dt-success animate-pulse' : 'bg-dt-error'
              }`}
            />
            <span className="text-dt-muted">
              {connected ? 'Live' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-dt-border">
        <button
          type="button"
          onClick={() => setActiveTab('stream')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'stream'
              ? 'border-dt-primary text-dt-text'
              : 'border-transparent text-dt-muted hover:text-dt-text'
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          Live Stream
          {events.length > 0 && (
            <span className="rounded-full bg-dt-primary/15 px-2 py-0.5 text-xs text-dt-primary">
              {events.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('handlers')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'handlers'
              ? 'border-dt-primary text-dt-text'
              : 'border-transparent text-dt-muted hover:text-dt-text'
          }`}
        >
          <List className="h-3.5 w-3.5" />
          Handler Registry
        </button>
      </div>

      {/* Content */}
      {activeTab === 'stream' ? (
        <div className="rounded-xl border border-dt-border bg-dt-card overflow-hidden">
          {/* Stream toolbar */}
          <div className="flex items-center justify-between border-b border-dt-border px-4 py-2.5">
            <span className="text-xs text-dt-muted">
              {events.length} event{events.length !== 1 ? 's' : ''} captured
            </span>
            <button
              type="button"
              onClick={onClear}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-dt-muted hover:text-dt-error hover:bg-dt-error/10 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </button>
          </div>

          {/* Events */}
          <div className="max-h-[calc(100vh-20rem)] overflow-y-auto divide-y divide-dt-border">
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-dt-muted">
                <Radio className="h-8 w-8 mb-3 opacity-30" />
                <p className="text-sm">Waiting for events...</p>
              </div>
            ) : (
              events.map((event) => {
                const isExpanded = expandedEvent === event.id;
                return (
                  <div key={event.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedEvent(isExpanded ? null : event.id)
                      }
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-dt-card-hover transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-dt-muted flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-dt-muted flex-shrink-0" />
                      )}
                      <span className="h-1.5 w-1.5 rounded-full bg-dt-primary flex-shrink-0" />
                      <span className="text-sm font-medium text-dt-text truncate flex-1">
                        {event.type}
                      </span>
                      <span className="text-xs text-dt-muted font-mono flex-shrink-0">
                        {formatTime(event.timestamp)}
                      </span>
                    </button>

                    {isExpanded && event.data != null && (
                      <div className="px-12 pb-4">
                        <div className="rounded-lg border border-dt-border bg-dt-bg p-3 text-xs font-mono">
                          <JsonView data={event.data} collapsed={false} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dt-border bg-dt-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-dt-primary border-t-transparent" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dt-border bg-dt-bg/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-dt-muted">
                    Event
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dt-muted">
                    Handlers
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dt-border">
                {handlerData?.handlers.map((h) => (
                  <tr key={h.eventName} className="hover:bg-dt-card-hover transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-dt-primary">
                      {h.eventName}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {h.handlers.map((handler) => (
                          <span
                            key={handler}
                            className="rounded border border-dt-border bg-dt-bg px-2 py-0.5 text-xs font-mono text-dt-muted"
                          >
                            {handler}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}

                {(!handlerData?.handlers || handlerData.handlers.length === 0) && (
                  <tr>
                    <td colSpan={2} className="px-4 py-12 text-center text-dt-muted">
                      No event handlers registered
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
