import React, { useState, useMemo } from 'react';
import { useApi } from '../hooks/use-api';
import type { PackTreeData, PackInfo } from '../types';
import { StatusBadge } from './StatusBadge';
import {
  Package,
  Search,
  Layers,
  ArrowRightLeft,
  ArrowDownToLine,
  Gamepad2,
  Clock,
} from 'lucide-react';

export const PackInspector: React.FC = () => {
  const { data, loading, error } = useApi<PackTreeData>('packs');
  const [search, setSearch] = useState('');
  const [selectedPack, setSelectedPack] = useState<PackInfo | null>(null);

  const filteredPacks = useMemo(() => {
    if (!data?.packs) return [];
    if (!search) return data.packs;
    const q = search.toLowerCase();
    return data.packs.filter((p) => p.name.toLowerCase().includes(q));
  }, [data, search]);

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
        <p className="text-dt-error font-medium">Failed to load packs</p>
        <p className="text-sm text-dt-muted mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Pack Inspector</h1>
        <p className="text-sm text-dt-muted mt-0.5">
          Browse and inspect registered packs
        </p>
      </div>

      <div className="flex gap-4 h-[calc(100vh-12rem)]">
        {/* Pack list */}
        <div className="w-72 flex-shrink-0 rounded-xl border border-dt-border bg-dt-card flex flex-col overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-dt-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dt-muted" />
              <input
                type="text"
                placeholder="Search packs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-dt-border bg-dt-bg pl-9 pr-3 py-2 text-sm text-dt-text placeholder:text-dt-muted/50 focus:outline-none focus:border-dt-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filteredPacks.map((pack) => (
              <button
                key={pack.name}
                type="button"
                onClick={() => setSelectedPack(pack)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-dt-border transition-colors ${
                  selectedPack?.name === pack.name
                    ? 'bg-dt-primary/10'
                    : 'hover:bg-dt-card-hover'
                }`}
              >
                <Package
                  className={`h-4 w-4 flex-shrink-0 ${
                    pack.isHttp ? 'text-dt-accent' : 'text-dt-primary'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{pack.name}</p>
                  <p className="text-xs text-dt-muted">
                    {pack.providers.length} provider{pack.providers.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <StatusBadge
                  label={pack.status}
                  variant={
                    pack.status === 'initialized'
                      ? 'success'
                      : pack.status === 'destroyed'
                        ? 'error'
                        : 'warning'
                  }
                />
              </button>
            ))}

            {filteredPacks.length === 0 && (
              <div className="flex items-center justify-center py-12 text-sm text-dt-muted">
                No packs found
              </div>
            )}
          </div>
        </div>

        {/* Pack details */}
        <div className="flex-1 rounded-xl border border-dt-border bg-dt-card overflow-y-auto">
          {selectedPack ? (
            <PackDetails pack={selectedPack} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-dt-muted">
              <Package className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Select a pack to inspect</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Pack Details Panel ───────────────────────────────────

const PackDetails: React.FC<{ pack: PackInfo }> = ({ pack }) => {
  return (
    <div className="p-5 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-dt-primary/20 to-dt-accent/20">
            <Package className="h-5 w-5 text-dt-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">{pack.name}</h2>
            <p className="text-xs text-dt-muted">
              {pack.isHttp ? 'HTTP Pack' : 'Core Pack'}
            </p>
          </div>
        </div>
        <StatusBadge
          label={pack.status}
          variant={
            pack.status === 'initialized'
              ? 'success'
              : pack.status === 'destroyed'
                ? 'error'
                : 'warning'
          }
          pulse={pack.status === 'initialized'}
        />
      </div>

      {/* Init time */}
      <div className="flex items-center gap-2 text-xs text-dt-muted">
        <Clock className="h-3.5 w-3.5" />
        Init time: <span className="font-medium text-dt-text">{pack.initTime}ms</span>
      </div>

      {/* Providers */}
      <Section title="Providers" icon={Layers} count={pack.providers.length}>
        {pack.providers.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-dt-muted border-b border-dt-border">
                <th className="pb-2 font-medium">Token</th>
                <th className="pb-2 font-medium">Scope</th>
                <th className="pb-2 font-medium">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dt-border">
              {pack.providers.map((p, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="py-2 font-mono text-xs text-dt-primary">{p.token}</td>
                  <td className="py-2">
                    <StatusBadge
                      label={p.scope}
                      variant={
                        p.scope === 'SINGLETON'
                          ? 'info'
                          : p.scope === 'REQUEST'
                            ? 'warning'
                            : 'muted'
                      }
                    />
                  </td>
                  <td className="py-2 text-xs text-dt-muted">{p.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-xs text-dt-muted">No providers</p>
        )}
      </Section>

      {/* Exports */}
      <Section title="Exports" icon={ArrowRightLeft} count={pack.exports.length}>
        <TokenList tokens={pack.exports} />
      </Section>

      {/* Imports */}
      <Section title="Imports" icon={ArrowDownToLine} count={pack.imports.length}>
        <TokenList tokens={pack.imports} />
      </Section>

      {/* Controllers */}
      {pack.controllers.length > 0 && (
        <Section title="Controllers" icon={Gamepad2} count={pack.controllers.length}>
          <TokenList tokens={pack.controllers} />
        </Section>
      )}
    </div>
  );
};

// ── Helpers ──────────────────────────────────────────────

const Section: React.FC<{
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  children: React.ReactNode;
}> = ({ title, icon: Icon, count, children }) => (
  <div>
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-dt-muted" />
      <h3 className="text-sm font-semibold">{title}</h3>
      <span className="text-xs text-dt-muted">({count})</span>
    </div>
    {children}
  </div>
);

const TokenList: React.FC<{ tokens: string[] }> = ({ tokens }) => {
  if (tokens.length === 0) {
    return <p className="text-xs text-dt-muted">None</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tokens.map((token) => (
        <span
          key={token}
          className="rounded-md border border-dt-border bg-dt-bg px-2 py-1 text-xs font-mono text-dt-muted"
        >
          {token}
        </span>
      ))}
    </div>
  );
};
