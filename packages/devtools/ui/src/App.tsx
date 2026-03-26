import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Overview } from './components/Overview';
import { DependencyGraph } from './components/DependencyGraph';
import { PackInspector } from './components/PackInspector';
import { RouteMap } from './components/RouteMap';
import { EventMonitor } from './components/EventMonitor';
import { ConfigViewer } from './components/ConfigViewer';
import { PluginPanel } from './components/PluginPanel';
import { useSSE } from './hooks/use-sse';
import type { TabId } from './components/Sidebar';

const SSE_URL = '/_devtools/api/sse';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const { events, logEntries, connected, clear } = useSSE(SSE_URL);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview recentEvents={events} logEntries={logEntries} />;
      case 'graph':
        return <DependencyGraph />;
      case 'packs':
        return <PackInspector />;
      case 'routes':
        return <RouteMap />;
      case 'events':
        return (
          <EventMonitor
            events={events}
            connected={connected}
            onClear={clear}
          />
        );
      case 'config':
        return <ConfigViewer />;
      case 'plugins':
        return <PluginPanel />;
      default:
        return <Overview recentEvents={events} logEntries={logEntries} />;
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      connected={connected}
    >
      {renderContent()}
    </Layout>
  );
};
