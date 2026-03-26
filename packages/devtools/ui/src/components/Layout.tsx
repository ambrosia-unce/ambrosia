import React from 'react';
import { Sidebar, type TabId } from './Sidebar';
import { StatusBadge } from './StatusBadge';
import { Hexagon } from 'lucide-react';

interface LayoutProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  connected: boolean;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  activeTab,
  onTabChange,
  connected,
  children,
}) => {
  return (
    <div className="flex h-screen w-screen flex-col bg-dt-bg text-dt-fg overflow-hidden">
      {/* Header — sticky, blurred like pack-market */}
      <header className="flex h-14 items-center justify-between border-b border-dt-border bg-dt-bg/80 backdrop-blur-xl px-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-dt-primary/20 to-dt-accent/10 border border-dt-primary/20">
            <Hexagon className="h-4 w-4 text-dt-primary" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold tracking-tight text-gradient">
            ambrosia
          </span>
          <span className="rounded-md border border-dt-border bg-dt-card/50 px-2 py-0.5 font-mono text-[11px] text-dt-muted">
            devtools
          </span>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge
            label={connected ? 'Connected' : 'Disconnected'}
            variant={connected ? 'success' : 'error'}
            pulse={connected}
          />
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-52 flex-shrink-0 border-r border-dt-border bg-dt-bg overflow-y-auto">
          <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-dt-bg">
          {children}
        </main>
      </div>
    </div>
  );
};
