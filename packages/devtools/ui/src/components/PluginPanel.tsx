import React from 'react';
import { useApi } from '../hooks/use-api';
import type { PluginInfo } from '../types';
import { StatusBadge } from './StatusBadge';
import { Puzzle, ExternalLink } from 'lucide-react';

export const PluginPanel: React.FC = () => {
  const { data: raw, loading, error } = useApi<{ plugins: PluginInfo[]; tabs: string[]; totalPlugins: number }>('plugins');

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
        <p className="text-dt-error font-medium">Failed to load plugins</p>
        <p className="text-sm text-dt-muted mt-1">{error}</p>
      </div>
    );
  }

  const plugins = raw?.plugins ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Plugins</h1>
        <p className="text-sm text-dt-muted mt-0.5">
          Registered DevTools plugins
        </p>
      </div>

      {plugins.length === 0 ? (
        <div className="rounded-xl border border-dt-border bg-dt-card/40 flex flex-col items-center justify-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-dt-primary/10 mb-5">
            <Puzzle className="h-8 w-8 text-dt-primary/40" />
          </div>
          <p className="text-sm font-medium text-dt-fg mb-1">No plugins installed</p>
          <p className="text-[12px] text-dt-text-dim max-w-xs text-center">
            Plugins extend DevTools with custom tabs, data collectors, and API endpoints for protocols like gRPC, GraphQL, and more.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plugins.map((plugin) => (
            <PluginCard key={plugin.name} plugin={plugin} />
          ))}
        </div>
      )}
    </div>
  );
};

const PluginCard: React.FC<{ plugin: PluginInfo }> = ({ plugin }) => {
  return (
    <div className="rounded-xl border border-dt-border bg-dt-card p-5 transition-colors hover:bg-dt-card-hover">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-dt-primary/15 to-dt-accent/15">
            <Puzzle className="h-5 w-5 text-dt-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{plugin.name}</h3>
            <p className="text-xs text-dt-muted">v{plugin.version}</p>
          </div>
        </div>
        <StatusBadge
          label={plugin.status}
          variant={
            plugin.status === 'active'
              ? 'success'
              : plugin.status === 'error'
                ? 'error'
                : 'muted'
          }
        />
      </div>

      <p className="text-xs text-dt-muted leading-relaxed mb-4">
        {plugin.description}
      </p>

      {plugin.tabs.length > 0 && (
        <div>
          <p className="text-xs font-medium text-dt-muted mb-1.5">
            Tabs provided:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {plugin.tabs.map((tab) => (
              <span
                key={tab}
                className="inline-flex items-center gap-1 rounded-md border border-dt-border bg-dt-bg px-2 py-0.5 text-xs text-dt-muted"
              >
                <ExternalLink className="h-2.5 w-2.5" />
                {tab}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
