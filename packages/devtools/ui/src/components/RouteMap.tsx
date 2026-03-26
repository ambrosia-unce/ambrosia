import React, { useState, useMemo, useCallback } from 'react';
import { useApi } from '../hooks/use-api';
import type { RouteData, RouteInfo, ApiTestResponse } from '../types';
import { MethodBadge } from './StatusBadge';
import { JsonView } from './JsonView';
import {
  ChevronDown,
  ChevronRight,
  Search,
  Shield,
  Layers,
  Filter,
  Cable,
  Send,
  Plus,
  Trash2,
  Clock,
  Play,
} from 'lucide-react';

export const RouteMap: React.FC = () => {
  const { data, loading, error } = useApi<RouteData>('routes');
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

  const filteredRoutes = useMemo(() => {
    if (!data?.routes) return [];
    return data.routes
      .filter((r) => !r.path.startsWith('/_devtools'))
      .filter((r) => {
        const matchesSearch =
          !search ||
          r.path.toLowerCase().includes(search.toLowerCase()) ||
          r.controller.toLowerCase().includes(search.toLowerCase()) ||
          r.handler.toLowerCase().includes(search.toLowerCase());
        const matchesMethod = methodFilter === 'ALL' || r.method === methodFilter;
        return matchesSearch && matchesMethod;
      });
  }, [data, search, methodFilter]);

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
        <p className="text-dt-error font-medium">Failed to load routes</p>
        <p className="text-sm text-dt-muted mt-1">{error}</p>
      </div>
    );
  }

  const methods = ['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Routes & API Tester</h1>
        <p className="text-[13px] text-dt-text-dim mt-0.5">
          Click any route to inspect pipeline and send test requests
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dt-muted" />
          <input
            type="text"
            placeholder="Search routes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-dt-border bg-dt-input/30 pl-9 pr-3 py-2 text-sm text-dt-fg placeholder:text-dt-muted/50 focus:outline-none focus:border-dt-primary/50 transition-colors"
          />
        </div>

        <div className="flex gap-1">
          {methods.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethodFilter(m)}
              className={`rounded-xl px-3 py-1.5 text-[12px] font-medium transition-all duration-200 ${
                methodFilter === m
                  ? 'bg-dt-primary/15 text-dt-primary border border-dt-primary/30'
                  : 'text-dt-text-dim hover:text-dt-fg border border-transparent hover:bg-dt-card/40'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <span className="text-[11px] text-dt-text-dim ml-auto">
          {filteredRoutes.length} routes
        </span>
      </div>

      {/* Routes list */}
      <div className="space-y-2">
        {filteredRoutes.map((route) => {
          const key = `${route.method}:${route.path}`;
          const isExpanded = expandedRoute === key;

          return (
            <RouteRow
              key={key}
              route={route}
              isExpanded={isExpanded}
              onToggle={() => setExpandedRoute(isExpanded ? null : key)}
            />
          );
        })}

        {filteredRoutes.length === 0 && (
          <div className="rounded-xl border border-dt-border bg-dt-card/40 py-16 text-center">
            <p className="text-sm text-dt-text-dim">No routes found</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Route Row ───────────────────────────────────────────── */

const RouteRow: React.FC<{
  route: RouteInfo;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ route, isExpanded, onToggle }) => {
  const hasPipeline =
    (route.guards?.length ?? 0) > 0 ||
    (route.interceptors?.length ?? 0) > 0 ||
    (route.pipes?.length ?? 0) > 0 ||
    (route.filters?.length ?? 0) > 0 ||
    (route.middleware?.length ?? 0) > 0;

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        isExpanded
          ? 'border-dt-primary/20 bg-dt-card/60 glow-sm'
          : 'border-dt-border bg-dt-card/40 hover:border-dt-border-hover hover:bg-dt-card/60'
      }`}
    >
      {/* Route header — always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-4 py-3 text-left"
      >
        <span className="text-dt-text-dim">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </span>

        <MethodBadge method={route.method} />

        <span className="font-mono text-[13px] text-dt-fg flex-1">{route.path}</span>

        <span className="text-[11px] text-dt-text-dim font-mono">
          {route.controller}.{route.handler}
        </span>

        {hasPipeline && (
          <div className="flex items-center gap-1">
            {(route.guards?.length ?? 0) > 0 && (
              <span className="flex items-center gap-0.5 rounded bg-dt-warning/10 px-1.5 py-0.5 text-[9px] text-dt-warning">
                <Shield className="h-2.5 w-2.5" />
                {route.guards!.length}
              </span>
            )}
            {(route.interceptors?.length ?? 0) > 0 && (
              <span className="flex items-center gap-0.5 rounded bg-dt-info/10 px-1.5 py-0.5 text-[9px] text-dt-info">
                <Layers className="h-2.5 w-2.5" />
                {route.interceptors!.length}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Expanded panel — pipeline + tester */}
      {isExpanded && (
        <div className="border-t border-dt-border">
          {/* Pipeline */}
          {hasPipeline && (
            <div className="px-5 py-4 border-b border-dt-border bg-dt-bg/30">
              <PipelineView route={route} />
            </div>
          )}

          {/* Inline API tester */}
          <InlineTester route={route} />
        </div>
      )}
    </div>
  );
};

/* ── Pipeline View ───────────────────────────────────────── */

const PipelineView: React.FC<{ route: RouteInfo }> = ({ route }) => {
  const sections = [
    { label: 'Middleware', items: route.middleware ?? [], icon: Cable, color: 'text-dt-muted' },
    { label: 'Guards', items: route.guards ?? [], icon: Shield, color: 'text-dt-warning' },
    { label: 'Interceptors', items: route.interceptors ?? [], icon: Layers, color: 'text-dt-info' },
    { label: 'Pipes', items: route.pipes ?? [], icon: Filter, color: 'text-dt-accent' },
    { label: 'Filters', items: route.filters ?? [], icon: Filter, color: 'text-dt-error' },
  ].filter((s) => s.items.length > 0);

  return (
    <div>
      <p className="text-[10px] font-semibold text-dt-text-dim uppercase tracking-wider mb-3">
        Request Pipeline
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        {sections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <React.Fragment key={section.label}>
              {idx > 0 && <span className="text-dt-text-dim text-[10px]">&rarr;</span>}
              <div className="rounded-lg border border-dt-border bg-dt-card/60 px-3 py-2 flex items-center gap-2">
                <Icon className={`h-3 w-3 ${section.color}`} />
                <span className="text-[11px] font-medium text-dt-fg">{section.label}</span>
                <div className="flex gap-1">
                  {section.items.map((item) => (
                    <span
                      key={item}
                      className="rounded bg-dt-bg px-1.5 py-0.5 text-[10px] font-mono text-dt-text-dim"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <span className="text-dt-text-dim text-[10px]">&rarr;</span>
        <div className="rounded-lg border border-dt-primary/20 bg-dt-primary/5 px-3 py-2 flex items-center gap-2">
          <Play className="h-3 w-3 text-dt-primary" />
          <span className="text-[11px] font-medium text-dt-primary">Handler</span>
        </div>
      </div>
    </div>
  );
};

/* ── Inline API Tester ───────────────────────────────────── */

interface HeaderEntry {
  id: string;
  key: string;
  value: string;
}

const InlineTester: React.FC<{ route: RouteInfo }> = ({ route }) => {
  const needsBody = route.method !== 'GET' && route.method !== 'DELETE';
  const hasParams = route.path.includes(':');

  const [url, setUrl] = useState(route.path);
  const [headers, setHeaders] = useState<HeaderEntry[]>(
    needsBody
      ? [{ id: '1', key: 'Content-Type', value: 'application/json' }]
      : [],
  );
  const [body, setBody] = useState(needsBody ? '{\n  \n}' : '');
  const [response, setResponse] = useState<ApiTestResponse | null>(null);
  const [sending, setSending] = useState(false);

  const addHeader = useCallback(() => {
    setHeaders((prev) => [...prev, { id: crypto.randomUUID(), key: '', value: '' }]);
  }, []);

  const removeHeader = useCallback((id: string) => {
    setHeaders((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const updateHeader = useCallback((id: string, field: 'key' | 'value', val: string) => {
    setHeaders((prev) => prev.map((h) => (h.id === id ? { ...h, [field]: val } : h)));
  }, []);

  const sendRequest = useCallback(async () => {
    setSending(true);
    setResponse(null);
    const start = performance.now();

    const headerObj: Record<string, string> = {};
    for (const h of headers) {
      if (h.key.trim()) headerObj[h.key] = h.value;
    }

    try {
      const opts: RequestInit = { method: route.method, headers: headerObj };
      if (needsBody && body.trim()) opts.body = body;

      const res = await fetch(url.startsWith('/') ? url : `/${url}`, opts);
      const elapsed = Math.round(performance.now() - start);

      const respHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { respHeaders[k] = v; });

      const ct = res.headers.get('content-type') ?? '';
      let respBody: string;
      if (ct.includes('json')) {
        respBody = JSON.stringify(await res.json(), null, 2);
      } else {
        respBody = await res.text();
      }

      setResponse({ status: res.status, statusText: res.statusText, headers: respHeaders, body: respBody, time: elapsed });
    } catch (err) {
      setResponse({
        status: 0, statusText: 'Network Error', headers: {},
        body: err instanceof Error ? err.message : 'Failed',
        time: Math.round(performance.now() - start),
      });
    } finally {
      setSending(false);
    }
  }, [route.method, url, headers, body, needsBody]);

  const statusColor =
    !response ? '' :
    response.status >= 200 && response.status < 300 ? 'text-dt-success' :
    response.status >= 400 ? 'text-dt-error' : 'text-dt-warning';

  return (
    <div className="px-5 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold text-dt-text-dim uppercase tracking-wider">
          Test Request
        </span>
      </div>

      {/* URL + Send */}
      <div className="flex gap-2">
        <div className="flex items-center gap-2 flex-1 rounded-lg border border-dt-border bg-dt-bg px-3 py-2">
          <MethodBadge method={route.method} />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
            className="flex-1 bg-transparent text-[13px] font-mono text-dt-fg placeholder:text-dt-muted/50 focus:outline-none"
            placeholder={route.path}
          />
        </div>
        <button
          type="button"
          onClick={sendRequest}
          disabled={sending}
          className="flex items-center gap-2 rounded-lg bg-dt-primary px-4 py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {sending ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          Send
        </button>
      </div>

      {/* Params hint */}
      {hasParams && (
        <p className="text-[11px] text-dt-warning">
          Replace URL parameters (e.g. <code className="font-mono">:id</code>) with actual values before sending.
        </p>
      )}

      <div className="flex gap-4">
        {/* Left: Headers + Body */}
        <div className="flex-1 space-y-3">
          {/* Headers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-dt-text-dim uppercase tracking-wider">Headers</span>
              <button type="button" onClick={addHeader} className="flex items-center gap-1 text-[11px] text-dt-text-dim hover:text-dt-primary transition-colors">
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
            {headers.length > 0 && (
              <div className="space-y-1">
                {headers.map((h) => (
                  <div key={h.id} className="flex items-center gap-1.5">
                    <input value={h.key} onChange={(e) => updateHeader(h.id, 'key', e.target.value)} placeholder="Key" className="flex-1 rounded border border-dt-border bg-dt-bg px-2 py-1.5 text-[11px] font-mono text-dt-fg placeholder:text-dt-muted/40 focus:outline-none focus:border-dt-primary/50" />
                    <input value={h.value} onChange={(e) => updateHeader(h.id, 'value', e.target.value)} placeholder="Value" className="flex-1 rounded border border-dt-border bg-dt-bg px-2 py-1.5 text-[11px] font-mono text-dt-fg placeholder:text-dt-muted/40 focus:outline-none focus:border-dt-primary/50" />
                    <button type="button" onClick={() => removeHeader(h.id)} className="p-1 text-dt-muted hover:text-dt-error"><Trash2 className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Body */}
          {needsBody && (
            <div>
              <span className="text-[10px] font-semibold text-dt-text-dim uppercase tracking-wider block mb-2">Body</span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full h-24 rounded-lg border border-dt-border bg-dt-bg px-3 py-2 text-[11px] font-mono text-dt-fg placeholder:text-dt-muted/30 focus:outline-none focus:border-dt-primary/50 resize-none"
                placeholder='{"key": "value"}'
              />
            </div>
          )}
        </div>

        {/* Right: Response */}
        <div className="flex-1">
          {response === null ? (
            <div className="flex flex-col items-center justify-center h-full rounded-xl border border-dt-border bg-dt-bg/30 py-10">
              <Send className="h-6 w-6 text-dt-text-dim/20 mb-2" />
              <p className="text-[11px] text-dt-text-dim">Send a request to see the response</p>
            </div>
          ) : (
            <div className="rounded-xl border border-dt-border bg-dt-bg/30 overflow-hidden">
              {/* Status */}
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-dt-border">
                <span className={`text-base font-bold ${statusColor}`}>{response.status}</span>
                <span className="text-[11px] text-dt-text-dim">{response.statusText}</span>
                <div className="ml-auto flex items-center gap-1 text-[11px] text-dt-text-dim">
                  <Clock className="h-3 w-3" /> {response.time}ms
                </div>
              </div>

              {/* Response body */}
              <div className="p-3 max-h-64 overflow-y-auto">
                <ResponseBody body={response.body} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ResponseBody: React.FC<{ body: string }> = ({ body }) => {
  try {
    const parsed = JSON.parse(body);
    return (
      <div className="text-[11px] font-mono">
        <JsonView data={parsed} collapsed={false} />
      </div>
    );
  } catch {
    return (
      <pre className="text-[11px] font-mono text-dt-fg whitespace-pre-wrap break-all">{body}</pre>
    );
  }
};
