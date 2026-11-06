import React, { useState, useEffect, useRef } from 'react';
import { TokenProfile, OnChainNode, OnChainLink } from '../types/token';
import { getOnChainRelationships } from '../data/tokens';
import { Network, ExternalLink, ArrowRight, Layers, Info } from 'lucide-react';

interface OnChainRelationshipsProps {
  token: TokenProfile;
}

export const OnChainRelationships: React.FC<OnChainRelationshipsProps> = ({ token }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<OnChainNode | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');

  const { nodes: initialNodes, links: initialLinks } = getOnChainRelationships(token.symbol);

  // Position nodes nicely in a circular / force layout
  const [nodes, setNodes] = useState<OnChainNode[]>(() => {
    const width = 800;
    const height = 460;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 170;

    return initialNodes.map((node, i) => {
      // Place pool & router near center
      if (node.type === 'POOL') {
        return { ...node, x: centerX - 60, y: centerY, vx: 0, vy: 0 };
      }
      if (node.type === 'ROUTER') {
        return { ...node, x: centerX + 70, y: centerY, vx: 0, vy: 0 };
      }
      const angle = (i / (initialNodes.length - 2)) * Math.PI * 2;
      return {
        ...node,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0,
        vy: 0
      };
    });
  });

  const [links] = useState<OnChainLink[]>(initialLinks);

  // Render network on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw subtle grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Links
      links.forEach((link) => {
        const sourceNode = nodes.find((n) => n.id === link.source);
        const targetNode = nodes.find((n) => n.id === link.target);
        if (!sourceNode || !targetNode || sourceNode.x === undefined || sourceNode.y === undefined || targetNode.x === undefined || targetNode.y === undefined) return;

        const isHighlighted = selectedNode && (selectedNode.id === link.source || selectedNode.id === link.target);
        
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);

        if (isHighlighted) {
          ctx.strokeStyle = '#818cf8';
          ctx.lineWidth = 2.5;
        } else {
          ctx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
          ctx.lineWidth = 1.2;
        }
        ctx.stroke();

        // Draw animated flow pulse or arrow midpoint
        const midX = (sourceNode.x + targetNode.x) / 2;
        const midY = (sourceNode.y + targetNode.y) / 2;
        ctx.fillStyle = isHighlighted ? '#a5b4fc' : 'rgba(148, 163, 184, 0.6)';
        ctx.beginPath();
        ctx.arc(midX, midY, isHighlighted ? 3 : 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Nodes
      nodes.forEach((node) => {
        if (node.x === undefined || node.y === undefined) return;

        const isSelected = selectedNode?.id === node.id;
        let nodeColor = '#6366f1'; // Default
        let radius = 16;

        switch (node.type) {
          case 'POOL':
            nodeColor = '#10b981';
            radius = 24;
            break;
          case 'ROUTER':
            nodeColor = '#3b82f6';
            radius = 22;
            break;
          case 'CEX':
            nodeColor = '#f59e0b';
            radius = 20;
            break;
          case 'WHALE':
            nodeColor = '#8b5cf6';
            radius = 18;
            break;
          case 'TREASURY':
            nodeColor = '#ec4899';
            radius = 20;
            break;
          case 'TRADER':
            nodeColor = '#06b6d4';
            radius = 16;
            break;
        }

        // Outer glow if selected
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.strokeStyle = nodeColor;
        ctx.stroke();

        // Label below node
        ctx.fillStyle = isSelected ? '#ffffff' : '#cbd5e1';
        ctx.font = isSelected ? 'bold 11px Plus Jakarta Sans, sans-serif' : '10px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + radius + 14);

        // Sublabel type
        ctx.fillStyle = '#64748b';
        ctx.font = '9px monospace';
        ctx.fillText(node.type, node.x, node.y + radius + 25);
      });
    };

    render();
  }, [nodes, links, selectedNode]);

  // Click detection on canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const clicked = nodes.find((n) => {
      if (n.x === undefined || n.y === undefined) return false;
      const dist = Math.hypot(n.x - clickX, n.y - clickY);
      return dist <= 28;
    });

    setSelectedNode(clicked || null);
  };

  // Connected links for selected node
  const activeLinks = selectedNode
    ? links.filter((l) => l.source === selectedNode.id || l.target === selectedNode.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Visual Canvas Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-white">On-chain Flow & Relationship Topology</span>
              <span className="text-xs text-slate-400 font-mono">Graph Visualizer</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any node in the graph below to inspect wallet counter-parties, liquidity bridges, and volume flows.
            </p>
          </div>

          {/* Node Legend */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Pool
            </span>
            <span className="flex items-center gap-1 text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Router
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> CEX
            </span>
            <span className="flex items-center gap-1 text-purple-400">
              <span className="w-2 h-2 rounded-full bg-purple-500" /> Whale
            </span>
            <span className="flex items-center gap-1 text-pink-400">
              <span className="w-2 h-2 rounded-full bg-pink-500" /> Treasury
            </span>
          </div>
        </div>

        {/* Interactive Canvas Viewport */}
        <div className="relative mt-4 bg-slate-950 rounded-lg border border-slate-800/80 overflow-hidden flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={840}
            height={460}
            onClick={handleCanvasClick}
            className="w-full h-auto cursor-pointer max-w-full"
          />
        </div>
      </div>

      {/* Selected Node Details & Connected Edges Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-white">
              {selectedNode ? `Entity Inspector: ${selectedNode.label}` : 'Select an Entity in the Graph Above'}
            </span>
          </div>
          {selectedNode && (
            <a
              href={`https://etherscan.io/address/${selectedNode.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-mono"
            >
              <span>{selectedNode.address.slice(0, 8)}...{selectedNode.address.slice(-6)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {selectedNode ? (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Entity Type</span>
                <span className="text-white font-semibold mt-0.5 block">{selectedNode.type}</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Holding Valuation</span>
                <span className="text-emerald-400 font-semibold mt-0.5 block tabular-nums">
                  ${(selectedNode.balanceUsd / 1e6).toFixed(2)}M
                </span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[11px]">24h Flow Volume</span>
                <span className="text-indigo-400 font-semibold mt-0.5 block tabular-nums">
                  ${(selectedNode.activityVolume24h / 1e6).toFixed(2)}M
                </span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Connected Nodes</span>
                <span className="text-white font-semibold mt-0.5 block">{activeLinks.length} paths</span>
              </div>
            </div>

            {/* Inflow / Outflow list */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-2 font-mono">
                Direct On-chain Connections & Volume:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {activeLinks.map((link, idx) => {
                  const otherId = link.source === selectedNode.id ? link.target : link.source;
                  const otherNode = nodes.find((n) => n.id === otherId);
                  const isOutflow = link.source === selectedNode.id;
                  return (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold ${isOutflow ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {isOutflow ? 'OUTFLOW' : 'INFLOW'}
                        </span>
                        <span className="text-white font-sans">{otherNode?.label || otherId}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-200 tabular-nums">${(link.volumeUsd / 1e6).toFixed(2)}M</span>
                        <span className="text-[10px] text-slate-500 block">{link.txCount.toLocaleString()} txs</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            Click on any circle in the relationship topology above (Uniswap V3 Pool, Universal Router, Binance, Vitalik, or Whales) to analyze its token routing connections.
          </div>
        )}
      </div>
    </div>
  );
};
