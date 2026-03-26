import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface JsonViewProps {
  data: unknown;
  collapsed?: boolean;
  level?: number;
  name?: string;
}

export const JsonView: React.FC<JsonViewProps> = ({
  data,
  collapsed: initialCollapsed = true,
  level = 0,
  name,
}) => {
  const [collapsed, setCollapsed] = useState(initialCollapsed && level > 0);

  if (data === null) {
    return (
      <span className="text-dt-muted">
        {name && <span className="text-dt-primary mr-1">{name}:</span>}
        <span className="italic">null</span>
      </span>
    );
  }

  if (data === undefined) {
    return (
      <span className="text-dt-muted">
        {name && <span className="text-dt-primary mr-1">{name}:</span>}
        <span className="italic">undefined</span>
      </span>
    );
  }

  if (typeof data === 'string') {
    return (
      <span>
        {name && <span className="text-dt-primary mr-1">{name}:</span>}
        <span className="text-dt-success">"{data}"</span>
      </span>
    );
  }

  if (typeof data === 'number') {
    return (
      <span>
        {name && <span className="text-dt-primary mr-1">{name}:</span>}
        <span className="text-dt-warning">{data}</span>
      </span>
    );
  }

  if (typeof data === 'boolean') {
    return (
      <span>
        {name && <span className="text-dt-primary mr-1">{name}:</span>}
        <span className="text-dt-accent">{String(data)}</span>
      </span>
    );
  }

  const isArray = Array.isArray(data);
  const entries = isArray
    ? (data as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(data as Record<string, unknown>);
  const isEmpty = entries.length === 0;

  if (isEmpty) {
    return (
      <span>
        {name && <span className="text-dt-primary mr-1">{name}:</span>}
        <span className="text-dt-muted">{isArray ? '[]' : '{}'}</span>
      </span>
    );
  }

  const bracket = isArray ? ['[', ']'] : ['{', '}'];
  const summary = isArray
    ? `${entries.length} item${entries.length === 1 ? '' : 's'}`
    : `${entries.length} key${entries.length === 1 ? '' : 's'}`;

  return (
    <div className="leading-relaxed">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="inline-flex items-center gap-0.5 text-left hover:text-dt-primary transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 text-dt-muted flex-shrink-0" />
        ) : (
          <ChevronDown className="h-3 w-3 text-dt-muted flex-shrink-0" />
        )}
        {name && <span className="text-dt-primary mr-1">{name}:</span>}
        <span className="text-dt-muted">
          {bracket[0]}
          {collapsed && <span className="mx-1 text-xs italic">{summary}</span>}
          {collapsed && bracket[1]}
        </span>
      </button>

      {!collapsed && (
        <div className="ml-4 border-l border-dt-border pl-3">
          {entries.map(([key, value]) => (
            <div key={key} className="py-0.5">
              <JsonView
                data={value}
                name={isArray ? undefined : key}
                level={level + 1}
                collapsed={level > 1}
              />
            </div>
          ))}
          <span className="text-dt-muted">{bracket[1]}</span>
        </div>
      )}
    </div>
  );
};
