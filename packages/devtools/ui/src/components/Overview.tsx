import React, { useState, useEffect, useRef } from 'react';
import { useApi } from '../hooks/use-api';
import type { OverviewData, SSEEvent, LogEntry } from '../types';
import {
  Package,
  Layers,
  Route,
  Radio,
  Clock,
  Activity,
  ChevronDown,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface OverviewProps {
  recentEvents: SSEEvent[];
  logEntries: LogEntry[];
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function formatLogTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour12: false });
}

type LogLevelFilter = 'all' | 'info' | 'warn' | 'error';

const LEVEL_STYLES: Record<string, { badge: string; dot: string }> = {
  debug: {
    badge: 'bg-dt-muted/20 text-dt-muted border-dt-muted/30',
    dot: 'bg-dt-muted',
  },
  info: {
    badge: 'bg-dt-primary/20 text-dt-primary border-dt-primary/30',
    dot: 'bg-dt-primary',
  },
  warn: {
    badge: 'bg-dt-warning/20 text-dt-warning border-dt-warning/30',
    dot: 'bg-dt-warning',
  },
  error: {
    badge: 'bg-dt-error/20 text-dt-error border-dt-error/30',
    dot: 'bg-dt-error',
  },
  fatal: {
    badge: 'bg-dt-error/30 text-dt-error border-dt-error/50 font-bold',
    dot: 'bg-dt-error',
  },
};

function matchesFilter(level: string, filter: LogLevelFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'info') return level !== 'debug';
  if (filter === 'warn') return level === 'warn' || level === 'error' || level === 'fatal';
  if (filter === 'error') return level === 'error' || level === 'fatal';
  return true;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  gradient?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, gradient }) => (
  <div className="rounded-xl border border-dt-border bg-dt-card/40 p-5 transition-all duration-200 hover:border-dt-border-hover hover:bg-dt-card/70 hover:glow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-medium text-dt-text-dim uppercase tracking-wider">
          {label}
        </p>
        <p
          className={`mt-2 text-2xl font-bold ${
            gradient
              ? 'text-gradient'
              : 'text-dt-fg'
          }`}
        >
          {value}
        </p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-dt-primary/10">
        <Icon className="h-5 w-5 text-dt-primary" />
      </div>
    </div>
  </div>
);

interface LogEntryRowProps {
  entry: LogEntry;
}

const LogEntryRow: React.FC<LogEntryRowProps> = ({ entry }) => {
  const [expanded, setExpanded] = useState(false);
  const hasExtra = entry.data !== undefined || entry.error !== undefined;
  const style = LEVEL_STYLES[entry.level] || LEVEL_STYLES.debug;

  return (
    <div className="group">
      <div
        className={`flex items-start gap-2 px-4 py-2 hover:bg-dt-card-hover transition-colors ${
          hasExtra ? 'cursor-pointer' : ''
        }`}
        onClick={() => hasExtra && setExpanded(!expanded)}
      >
        {/* Expand toggle */}
        <div className="flex-shrink-0 w-4 mt-0.5">
          {hasExtra ? (
            expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-dt-muted" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-dt-muted" />
            )
          ) : (
            <div className={`h-1.5 w-1.5 rounded-full mt-1.5 ml-1 ${style.dot}`} />
          )}
        </div>

        {/* Level badge */}
        <span
          className={`flex-shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide border ${style.badge}`}
        >
          {entry.level}
        </span>

        {/* Timestamp */}
        <span className="flex-shrink-0 font-mono text-xs text-dt-muted">
          {formatLogTime(entry.timestamp)}
        </span>

        {/* Context */}
        {entry.context && (
          <span className="flex-shrink-0 font-mono text-xs text-dt-primary/80">
            [{entry.context}]
          </span>
        )}

        {/* Message */}
        <span className="text-sm text-dt-fg truncate flex-1">
          {entry.message}
        </span>

        {/* Request ID */}
        {entry.requestId && (
          <span className="flex-shrink-0 font-mono text-[10px] text-dt-muted/60">
            {entry.requestId.slice(0, 8)}
          </span>
        )}

        {/* Duration */}
        {entry.duration !== undefined && (
          <span className="flex-shrink-0 font-mono text-[10px] text-dt-muted">
            {entry.duration}ms
          </span>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && hasExtra && (
        <div className="px-4 pb-3 pl-10">
          {entry.error && (
            <div className="rounded-lg border border-dt-error/20 bg-dt-error/5 p-3 mt-1">
              <div className="font-mono text-xs text-dt-error font-semibold">
                {entry.error.name}: {entry.error.message}
              </div>
              {entry.error.code && (
                <div className="font-mono text-[10px] text-dt-muted mt-1">
                  Code: {entry.error.code}
                </div>
              )}
              {entry.error.stack && (
                <pre className="font-mono text-[10px] text-dt-muted/80 mt-2 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {entry.error.stack}
                </pre>
              )}
            </div>
          )}
          {entry.data !== undefined && (
            <pre className="rounded-lg border border-dt-border bg-dt-bg/50 p-3 mt-1 font-mono text-[11px] text-dt-muted overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
              {typeof entry.data === 'string'
                ? entry.data
                : JSON.stringify(entry.data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

const MAX_DISPLAY_LOGS = 50;

export const Overview: React.FC<OverviewProps> = ({ recentEvents, logEntries }) => {
  const { data, loading, error } = useApi<OverviewData>('overview');
  const [filter, setFilter] = useState<LogLevelFilter>('all');
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logEntries, autoScroll]);

  // Detect manual scroll to disable auto-scroll
  const handleScroll = () => {
    if (!logContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 40;
    setAutoScroll(atBottom);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dt-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-dt-error/30 bg-dt-error/10 p-6 text-center">
        <p className="text-dt-error font-medium">Failed to load overview</p>
        <p className="text-sm text-dt-muted mt-1">{error}</p>
      </div>
    );
  }

  const overview = data ?? {
    totalPacks: 0,
    totalProviders: 0,
    totalRoutes: 0,
    totalEvents: 0,
    uptime: 0,
    startedAt: new Date().toISOString(),
  };

  const filteredLogs = logEntries
    .filter((entry) => matchesFilter(entry.level, filter))
    .slice(-MAX_DISPLAY_LOGS);

  const filterButtons: { label: string; value: LogLevelFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Info+', value: 'info' },
    { label: 'Warn+', value: 'warn' },
    { label: 'Error', value: 'error' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Overview</h1>
        <p className="text-sm text-dt-muted mt-0.5">
          Application runtime dashboard
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Packs"
          value={overview.totalPacks}
          icon={Package}
          gradient
        />
        <StatCard
          label="Providers"
          value={overview.totalProviders}
          icon={Layers}
        />
        <StatCard
          label="Routes"
          value={overview.totalRoutes}
          icon={Route}
        />
        <StatCard
          label="Events"
          value={overview.totalEvents}
          icon={Radio}
        />
        <StatCard
          label="Uptime"
          value={formatUptime(overview.uptime)}
          icon={Clock}
        />
      </div>

      {/* Live Log Feed */}
      <div className="rounded-xl border border-dt-border bg-dt-card">
        <div className="flex items-center gap-2 border-b border-dt-border px-5 py-3">
          <Activity className="h-4 w-4 text-dt-primary" />
          <h2 className="text-sm font-semibold">Live Logs</h2>
          <span className="ml-1 text-xs text-dt-muted">
            {filteredLogs.length} entries
          </span>

          {/* Filter buttons */}
          <div className="ml-auto flex items-center gap-1">
            <Filter className="h-3 w-3 text-dt-muted mr-1" />
            {filterButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setFilter(btn.value)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  filter === btn.value
                    ? 'bg-dt-primary/20 text-dt-primary border border-dt-primary/30'
                    : 'text-dt-muted hover:text-dt-fg hover:bg-dt-card-hover border border-transparent'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={logContainerRef}
          onScroll={handleScroll}
          className="max-h-96 overflow-y-auto"
        >
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-dt-muted">
              No log entries yet. Waiting for activity...
            </div>
          ) : (
            <div className="divide-y divide-dt-border/50">
              {filteredLogs.map((entry, idx) => (
                <LogEntryRow key={`${entry.timestamp}-${idx}`} entry={entry} />
              ))}
            </div>
          )}
        </div>

        {/* Auto-scroll indicator */}
        {!autoScroll && filteredLogs.length > 0 && (
          <div className="border-t border-dt-border px-4 py-1.5 text-center">
            <button
              onClick={() => {
                setAutoScroll(true);
                if (logContainerRef.current) {
                  logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
                }
              }}
              className="text-[11px] text-dt-primary hover:text-dt-primary/80 transition-colors"
            >
              Scroll paused — click to resume auto-scroll
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
