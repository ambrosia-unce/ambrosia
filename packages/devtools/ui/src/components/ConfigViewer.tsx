import React, { useState, useMemo } from 'react';
import { useApi } from '../hooks/use-api';
import type { ConfigData } from '../types';
import { JsonView } from './JsonView';
import { Search, Settings } from 'lucide-react';

export const ConfigViewer: React.FC = () => {
  const { data, loading, error } = useApi<ConfigData>('config');
  const [search, setSearch] = useState('');

  const filteredEntries = useMemo(() => {
    if (!data?.entries) return [];
    if (!search) return data.entries;
    const q = search.toLowerCase();
    return data.entries.filter(
      (e) =>
        e.key.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q) ||
        String(e.value).toLowerCase().includes(q),
    );
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
        <p className="text-dt-error font-medium">Failed to load config</p>
        <p className="text-sm text-dt-muted mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Configuration</h1>
        <p className="text-sm text-dt-muted mt-0.5">
          Application configuration values
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dt-muted" />
        <input
          type="text"
          placeholder="Search config..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-dt-border bg-dt-card pl-9 pr-3 py-2 text-sm text-dt-text placeholder:text-dt-muted/50 focus:outline-none focus:border-dt-primary/50 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-dt-border bg-dt-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dt-border bg-dt-bg/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-dt-muted">
                Key
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dt-muted">
                Value
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dt-muted w-28">
                Type
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dt-border">
            {filteredEntries.map((entry) => (
              <tr key={entry.key} className="hover:bg-dt-card-hover transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-dt-primary align-top">
                  {entry.key}
                </td>
                <td className="px-4 py-3 align-top">
                  <ConfigValue value={entry.value} type={entry.type} />
                </td>
                <td className="px-4 py-3 align-top">
                  <span className="rounded border border-dt-border bg-dt-bg px-2 py-0.5 text-xs text-dt-muted">
                    {entry.type}
                  </span>
                </td>
              </tr>
            ))}

            {filteredEntries.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-dt-muted/30" />
                  <p className="text-sm text-dt-muted">No config entries found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ConfigValue: React.FC<{ value: unknown; type: string }> = ({ value, type }) => {
  if (type === 'object' || type === 'array') {
    return (
      <div className="text-xs font-mono">
        <JsonView data={value} collapsed level={0} />
      </div>
    );
  }

  if (type === 'boolean') {
    return (
      <span className={`text-xs font-mono ${value ? 'text-dt-success' : 'text-dt-error'}`}>
        {String(value)}
      </span>
    );
  }

  if (type === 'number') {
    return <span className="text-xs font-mono text-dt-warning">{String(value)}</span>;
  }

  return <span className="text-xs font-mono text-dt-text">{String(value)}</span>;
};
