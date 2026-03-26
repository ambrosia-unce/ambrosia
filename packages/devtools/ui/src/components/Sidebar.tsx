import React from 'react';
import {
  LayoutDashboard,
  GitFork,
  Package,
  Route,
  Radio,
  Settings,
  Puzzle,
} from 'lucide-react';

export type TabId =
  | 'overview'
  | 'graph'
  | 'packs'
  | 'routes'
  | 'events'
  | 'config'
  | 'plugins';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'graph', label: 'Graph', icon: GitFork },
  { id: 'packs', label: 'Packs', icon: Package },
  { id: 'routes', label: 'Routes', icon: Route },
  { id: 'events', label: 'Events', icon: Radio },
  { id: 'config', label: 'Config', icon: Settings },
  { id: 'plugins', label: 'Plugins', icon: Puzzle },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="flex flex-col gap-0.5 p-3">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 text-left ${
              isActive
                ? 'bg-dt-primary/10 text-dt-fg border border-dt-primary/20 glow-sm'
                : 'text-dt-text-dim hover:text-dt-fg hover:bg-dt-card/40 border border-transparent'
            }`}
          >
            <Icon
              className={`h-4 w-4 flex-shrink-0 transition-colors ${
                isActive ? 'text-dt-primary' : ''
              }`}
            />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
};
