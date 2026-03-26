import React, { useMemo, useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useApi } from '../hooks/use-api';
import { Package, Globe, Cpu, Shield, Zap, ArrowUpRight, ArrowDownLeft, Play } from 'lucide-react';

/* ── Types for raw API response ─────────────────────────── */

interface RawProvider {
  token: string;
  scope: string;
  type: string;
}

interface RawGraphNode {
  id: string;
  label: string;
  type: 'pack' | 'provider' | 'controller';
  group?: string;
}

interface RawGraphEdge {
  source: string;
  target: string;
  type: 'import' | 'provides';
}

interface RawGraphData {
  nodes: RawGraphNode[];
  edges: RawGraphEdge[];
}

interface RawPackInfo {
  name: string;
  providers: RawProvider[];
  exports: string[];
  imports: string[];
  controllers: string[];
  hasOnInit: boolean;
  hasOnDestroy: boolean;
}

/* ── Aggregated pack data for display ───────────────────── */

interface PackDisplayData {
  id: string;
  name: string;
  providers: RawProvider[];
  controllers: string[];
  exports: string[];
  imports: string[];
  hasOnInit: boolean;
  hasOnDestroy: boolean;
  category: 'core' | 'framework' | 'app';
}

function categorize(name: string): 'core' | 'framework' | 'app' {
  if (name.startsWith('@ambrosia/')) return 'core';
  if (['devtools', 'auth'].includes(name)) return 'framework';
  return 'app';
}

const categoryStyles: Record<string, { border: string; borderHover: string; headerBg: string; dot: string }> = {
  core: {
    border: 'oklch(0.72 0.14 200 / 15%)',
    borderHover: 'oklch(0.72 0.14 200 / 35%)',
    headerBg: 'linear-gradient(135deg, oklch(0.72 0.14 200 / 25%), oklch(0.696 0.17 162.48 / 15%))',
    dot: 'oklch(0.72 0.14 200)',
  },
  framework: {
    border: 'oklch(0.627 0.265 303.9 / 15%)',
    borderHover: 'oklch(0.627 0.265 303.9 / 35%)',
    headerBg: 'linear-gradient(135deg, oklch(0.627 0.265 303.9 / 20%), oklch(0.696 0.17 162.48 / 12%))',
    dot: 'oklch(0.627 0.265 303.9)',
  },
  app: {
    border: 'oklch(1 0 0 / 8%)',
    borderHover: 'oklch(1 0 0 / 18%)',
    headerBg: 'linear-gradient(135deg, oklch(1 0 0 / 4%), oklch(1 0 0 / 2%))',
    dot: 'oklch(0.55 0.01 260)',
  },
};

/* ── Custom Pack Node ───────────────────────────────────── */

type PackNodeData = {
  label: string;
  providers: RawProvider[];
  controllers: string[];
  exports: string[];
  imports: string[];
  hasOnInit: boolean;
  hasOnDestroy: boolean;
  category: 'core' | 'framework' | 'app';
};

type PackNodeType = Node<PackNodeData>;

function PackNode({ data }: NodeProps<PackNodeType>) {
  const style = categoryStyles[data.category] ?? categoryStyles.app;
  const [hovered, setHovered] = useState(false);

  const singletonCount = data.providers.filter((p) => p.scope === 'SINGLETON').length;
  const requestCount = data.providers.filter((p) => p.scope === 'REQUEST').length;
  const transientCount = data.providers.filter((p) => p.scope === 'TRANSIENT').length;

  return (
    <div
      className="rounded-xl overflow-hidden min-w-[220px] max-w-[260px] transition-all duration-200"
      style={{
        background: 'oklch(0.15 0.005 260)',
        border: `1px solid ${hovered ? style.borderHover : style.border}`,
        boxShadow: hovered
          ? `0 4px 24px oklch(0 0 0 / 40%), 0 0 12px ${style.dot}15`
          : '0 2px 12px oklch(0 0 0 / 20%)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Handle type="target" position={Position.Top} className="!bg-dt-primary !w-2 !h-2 !border-0" />

      {/* Header — muted gradient */}
      <div className="px-3.5 py-2.5 flex items-center gap-2" style={{ background: style.headerBg }}>
        <span className="h-2 w-2 rounded-full" style={{ background: style.dot }} />
        <span className="text-[12px] font-semibold text-dt-fg truncate">{data.label}</span>

        {/* Lifecycle badges */}
        <div className="ml-auto flex gap-1">
          {data.hasOnInit && (
            <span className="rounded bg-dt-success/10 px-1 py-0.5 text-[8px] font-mono text-dt-success" title="onInit">init</span>
          )}
          {data.hasOnDestroy && (
            <span className="rounded bg-dt-error/10 px-1 py-0.5 text-[8px] font-mono text-dt-error" title="onDestroy">destroy</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-3.5 py-2.5 space-y-2">
        {/* Providers with scope breakdown */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] uppercase tracking-wider text-dt-text-dim">Providers</span>
            <span className="text-[11px] font-mono font-bold text-dt-fg">{data.providers.length}</span>
          </div>

          {/* Scope badges */}
          {data.providers.length > 0 && (
            <div className="flex gap-1 mb-1.5">
              {singletonCount > 0 && (
                <span className="rounded bg-dt-primary/8 border border-dt-primary/10 px-1.5 py-0.5 text-[8px] font-mono text-dt-primary">
                  {singletonCount} singleton
                </span>
              )}
              {requestCount > 0 && (
                <span className="rounded bg-dt-warning/8 border border-dt-warning/10 px-1.5 py-0.5 text-[8px] font-mono text-dt-warning">
                  {requestCount} request
                </span>
              )}
              {transientCount > 0 && (
                <span className="rounded bg-dt-accent/8 border border-dt-accent/10 px-1.5 py-0.5 text-[8px] font-mono text-dt-accent">
                  {transientCount} transient
                </span>
              )}
            </div>
          )}

          {/* Provider names */}
          {data.providers.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {data.providers.slice(0, 3).map((p) => (
                <span
                  key={p.token}
                  className="inline-block rounded bg-dt-bg/60 px-1.5 py-0.5 text-[9px] font-mono text-dt-text-dim truncate max-w-[90px]"
                  title={`${p.token} (${p.scope.toLowerCase()})`}
                >
                  {p.token.replace('InjectionToken(', '').replace(')', '')}
                </span>
              ))}
              {data.providers.length > 3 && (
                <span className="inline-block rounded bg-dt-bg/40 px-1.5 py-0.5 text-[9px] font-mono text-dt-muted">
                  +{data.providers.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Controllers */}
        {data.controllers.length > 0 && (
          <div className="pt-1.5 border-t border-dt-border/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] uppercase tracking-wider text-dt-text-dim">Controllers</span>
              <span className="text-[11px] font-mono font-bold text-dt-accent">{data.controllers.length}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {data.controllers.map((c) => (
                <span
                  key={c}
                  className="inline-block rounded bg-dt-accent/8 border border-dt-accent/10 px-1.5 py-0.5 text-[9px] font-mono text-dt-accent truncate max-w-[90px]"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Imports/Exports count */}
        {(data.imports.length > 0 || data.exports.length > 0) && (
          <div className="pt-1.5 border-t border-dt-border/50 flex gap-3">
            {data.imports.length > 0 && (
              <span className="flex items-center gap-1 text-[9px] text-dt-text-dim" title={`Imports: ${data.imports.join(', ')}`}>
                <ArrowDownLeft className="h-2.5 w-2.5" />
                {data.imports.length} imports
              </span>
            )}
            {data.exports.length > 0 && (
              <span className="flex items-center gap-1 text-[9px] text-dt-text-dim" title={`Exports: ${data.exports.join(', ')}`}>
                <ArrowUpRight className="h-2.5 w-2.5" />
                {data.exports.length} exports
              </span>
            )}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-dt-accent !w-2 !h-2 !border-0" />
    </div>
  );
}

const nodeTypes = { packNode: PackNode };

/* ── Layout algorithm ───────────────────────────────────── */

function buildLayout(
  raw: RawGraphData,
  packDetails: Map<string, RawPackInfo>,
): { nodes: Node<PackNodeData>[]; edges: Edge[] } {
  const packMap = new Map<string, PackDisplayData>();

  for (const n of raw.nodes) {
    if (n.type === 'pack') {
      const detail = packDetails.get(n.label);
      packMap.set(n.id, {
        id: n.id,
        name: n.label,
        providers: detail?.providers ?? [],
        controllers: detail?.controllers ?? [],
        exports: detail?.exports ?? [],
        imports: detail?.imports ?? [],
        hasOnInit: detail?.hasOnInit ?? false,
        hasOnDestroy: detail?.hasOnDestroy ?? false,
        category: categorize(n.label),
      });
    }
  }

  // Fill providers/controllers from graph nodes if not in pack details
  for (const n of raw.nodes) {
    if (n.type === 'provider' && n.group) {
      const pack = packMap.get(`pack:${n.group}`);
      if (pack && !pack.providers.find((p) => p.token === n.label)) {
        pack.providers.push({ token: n.label, scope: 'SINGLETON', type: 'class' });
      }
    }
    if (n.type === 'controller' && n.group) {
      const pack = packMap.get(`pack:${n.group}`);
      if (pack && !pack.controllers.includes(n.label)) {
        pack.controllers.push(n.label);
      }
    }
  }

  const importEdges = raw.edges.filter((e) => e.type === 'import');

  // Topological sort
  const packIds = [...packMap.keys()];
  const inDegree = new Map<string, number>();
  const children = new Map<string, string[]>();

  for (const id of packIds) {
    inDegree.set(id, 0);
    children.set(id, []);
  }
  for (const e of importEdges) {
    if (packMap.has(e.source) && packMap.has(e.target)) {
      inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
      children.get(e.source)?.push(e.target);
    }
  }

  const layers: string[][] = [];
  let queue = packIds.filter((id) => (inDegree.get(id) ?? 0) === 0);
  const visited = new Set<string>();

  while (queue.length > 0) {
    layers.push([...queue]);
    const next: string[] = [];
    for (const id of queue) {
      visited.add(id);
      for (const child of children.get(id) ?? []) {
        const deg = (inDegree.get(child) ?? 1) - 1;
        inDegree.set(child, deg);
        if (deg === 0 && !visited.has(child)) next.push(child);
      }
    }
    queue = next;
  }

  const remaining = packIds.filter((id) => !visited.has(id));
  if (remaining.length > 0) layers.push(remaining);

  const NODE_WIDTH = 240;
  const NODE_HEIGHT = 180;
  const H_GAP = 32;
  const V_GAP = 60;

  const nodes: Node<PackNodeData>[] = [];
  for (let li = 0; li < layers.length; li++) {
    const layer = layers[li]!;
    const totalWidth = layer.length * NODE_WIDTH + (layer.length - 1) * H_GAP;
    const startX = -totalWidth / 2;

    for (let i = 0; i < layer.length; i++) {
      const pack = packMap.get(layer[i]!);
      if (!pack) continue;

      nodes.push({
        id: pack.id,
        type: 'packNode',
        position: { x: startX + i * (NODE_WIDTH + H_GAP), y: li * (NODE_HEIGHT + V_GAP) },
        data: {
          label: pack.name,
          providers: pack.providers,
          controllers: pack.controllers,
          exports: pack.exports,
          imports: pack.imports,
          hasOnInit: pack.hasOnInit,
          hasOnDestroy: pack.hasOnDestroy,
          category: pack.category,
        },
      });
    }
  }

  const edges: Edge[] = importEdges
    .filter((e) => packMap.has(e.source) && packMap.has(e.target))
    .map((e, i) => ({
      id: `e-${i}`,
      source: e.source,
      target: e.target,
      type: 'smoothstep',
      animated: false,
      style: { stroke: 'oklch(1 0 0 / 12%)', strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'oklch(1 0 0 / 25%)', width: 10, height: 10 },
    }));

  return { nodes, edges };
}

/* ── Main Component ─────────────────────────────────────── */

export const DependencyGraph: React.FC = () => {
  const { data: graphData, loading: gLoading } = useApi<RawGraphData>('graph');
  const { data: packsData, loading: pLoading } = useApi<{ packs: RawPackInfo[] }>('packs');
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<PackNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [baseEdges, setBaseEdges] = useState<Edge[]>([]);

  const packDetails = useMemo(() => {
    const map = new Map<string, RawPackInfo>();
    if (packsData?.packs) {
      for (const p of packsData.packs) map.set(p.name, p);
    }
    return map;
  }, [packsData]);

  useEffect(() => {
    if (!graphData) return;
    const layout = buildLayout(graphData, packDetails);
    setNodes(layout.nodes);
    setEdges(layout.edges);
    setBaseEdges(layout.edges);
  }, [graphData, packDetails, setNodes, setEdges]);

  // Highlight connected edges on node hover
  useEffect(() => {
    if (!hoveredNode) {
      setEdges(baseEdges);
      return;
    }
    setEdges(
      baseEdges.map((edge) => {
        const isConnected = edge.source === hoveredNode || edge.target === hoveredNode;
        return {
          ...edge,
          animated: isConnected,
          style: {
            ...edge.style,
            stroke: isConnected ? 'oklch(0.72 0.14 200 / 60%)' : 'oklch(1 0 0 / 5%)',
            strokeWidth: isConnected ? 2.5 : 1,
          },
          markerEnd: isConnected
            ? { type: MarkerType.ArrowClosed, color: 'oklch(0.72 0.14 200 / 70%)', width: 12, height: 12 }
            : { type: MarkerType.ArrowClosed, color: 'oklch(1 0 0 / 8%)', width: 10, height: 10 },
          zIndex: isConnected ? 10 : 0,
        };
      }),
    );
  }, [hoveredNode, baseEdges, setEdges]);

  const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
    setHoveredNode(node.id);
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNode(null);
  }, []);

  const defaultViewport = useMemo(() => ({ x: 500, y: 40, zoom: 0.75 }), []);

  if (gLoading || pLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dt-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Dependency Graph</h1>
          <p className="text-[13px] text-dt-text-dim mt-0.5">
            Hover a pack to highlight its connections
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Legend color="oklch(0.72 0.14 200)" label="Core" />
          <Legend color="oklch(0.627 0.265 303.9)" label="Framework" />
          <Legend color="oklch(0.55 0.01 260)" label="App" />
        </div>
      </div>

      <div className="h-[calc(100vh-12rem)] rounded-xl border border-dt-border bg-dt-bg overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          nodeTypes={nodeTypes}
          defaultViewport={defaultViewport}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.15}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="oklch(1 0 0 / 3%)" />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(node) => {
              const cat = (node.data as PackNodeData)?.category;
              if (cat === 'core') return 'oklch(0.72 0.14 200 / 60%)';
              if (cat === 'framework') return 'oklch(0.627 0.265 303.9 / 60%)';
              return 'oklch(0.55 0.01 260 / 60%)';
            }}
            maskColor="oklch(0.13 0.004 260 / 80%)"
            style={{ background: 'oklch(0.15 0.005 260)', border: '1px solid oklch(1 0 0 / 8%)', borderRadius: 8 }}
          />
        </ReactFlow>
      </div>
    </div>
  );
};

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="text-[11px] text-dt-text-dim">{label}</span>
    </div>
  );
}
