import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { TokenProfile, HistoricalHolderSnapshot } from '../types/token';
import { getHistoricalHolderSnapshots } from '../data/tokens';
import { TrendingDown, TrendingUp, Info, Calendar, Users, ShieldAlert, Sparkles } from 'lucide-react';

interface HistoricalWhaleDistributionChartProps {
  token: TokenProfile;
}

type TimeframeOption = '30D' | '90D' | '180D' | '1Y';
type ViewModeOption = 'stacked' | 'lines';

interface TooltipData {
  snapshot: HistoricalHolderSnapshot;
  x: number;
  y: number;
}

export const HistoricalWhaleDistributionChart: React.FC<HistoricalWhaleDistributionChartProps> = ({ token }) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('90D');
  const [viewMode, setViewMode] = useState<ViewModeOption>('stacked');
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Timeframe in days
  const days = useMemo(() => {
    switch (timeframe) {
      case '30D': return 30;
      case '90D': return 90;
      case '180D': return 180;
      case '1Y': return 365;
      default: return 90;
    }
  }, [timeframe]);

  // Generate historical data snapshots
  const data = useMemo(() => {
    return getHistoricalHolderSnapshots(token.symbol, days);
  }, [token.symbol, days]);

  // First & Latest comparisons
  const firstSnapshot = data[0];
  const latestSnapshot = data[data.length - 1];

  const top10Delta = latestSnapshot && firstSnapshot 
    ? Number((latestSnapshot.top10SharePct - firstSnapshot.top10SharePct).toFixed(2)) 
    : 0;
  const top50Delta = latestSnapshot && firstSnapshot 
    ? Number((latestSnapshot.top50SharePct - firstSnapshot.top50SharePct).toFixed(2)) 
    : 0;
  const top100Delta = latestSnapshot && firstSnapshot 
    ? Number((latestSnapshot.top100SharePct - firstSnapshot.top100SharePct).toFixed(2)) 
    : 0;
  const retailDelta = latestSnapshot && firstSnapshot 
    ? Number((latestSnapshot.retailSharePct - firstSnapshot.retailSharePct).toFixed(2)) 
    : 0;

  // D3 Render Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth || 840;
    const height = 340;
    const margin = { top: 24, right: 32, bottom: 36, left: 44 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('width', '100%')
       .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (Time)
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => new Date(d.timestamp)) as [Date, Date])
      .range([0, innerWidth]);

    // X Axis formatting
    const xAxis = d3.axisBottom<Date>(xScale)
      .ticks(Math.min(8, Math.floor(innerWidth / 90)))
      .tickFormat((d) => {
        const date = d as Date;
        return timeframe === '30D'
          ? `${date.getMonth() + 1}/${date.getDate()}`
          : `${date.toLocaleString('en-US', { month: 'short' })} '${String(date.getFullYear()).slice(2)}`;
      })
      .tickSize(-innerHeight)
      .tickPadding(10);

    const xAxisG = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisG.select('.domain').attr('stroke', '#334155');
    xAxisG.selectAll('.tick line').attr('stroke', '#1e293b').attr('stroke-dasharray', '2,2');
    xAxisG.selectAll('.tick text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'monospace');

    if (viewMode === 'stacked') {
      // Stacked Area: Top 10 + Next 11-50 + Next 51-100 + Retail = 100%
      const keys = ['top10SharePct', 'next11to50Pct', 'next51to100Pct', 'retailSharePct'] as const;
      
      const stack = d3.stack<HistoricalHolderSnapshot>()
        .keys(keys as unknown as string[])
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

      const series = stack(data);

      const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([innerHeight, 0]);

      // Y Axis
      const yAxis = d3.axisLeft(yScale)
        .ticks(5)
        .tickFormat(d => `${d}%`)
        .tickSize(-innerWidth)
        .tickPadding(8);

      const yAxisG = g.append('g').call(yAxis);
      yAxisG.select('.domain').attr('stroke', '#334155');
      yAxisG.selectAll('.tick line').attr('stroke', '#1e293b').attr('stroke-dasharray', '2,2');
      yAxisG.selectAll('.tick text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'monospace');

      // Gradients for stacked areas
      const defs = svg.append('defs');
      
      const layerColors = [
        { id: 'grad-top10', start: '#6366f1', end: '#4f46e5', stroke: '#818cf8' },   // Top 10 Whales (Indigo)
        { id: 'grad-next50', start: '#0284c7', end: '#0369a1', stroke: '#38bdf8' },  // Next 11-50 (Sky)
        { id: 'grad-next100', start: '#0d9488', end: '#0f766e', stroke: '#2dd4bf' }, // Next 51-100 (Teal)
        { id: 'grad-retail', start: '#334155', end: '#1e293b', stroke: '#64748b' }   // Retail / Float (Slate)
      ];

      layerColors.forEach(c => {
        const grad = defs.append('linearGradient')
          .attr('id', c.id)
          .attr('x1', '0').attr('y1', '0')
          .attr('x2', '0').attr('y2', '1');
        grad.append('stop').attr('offset', '0%').attr('stop-color', c.start).attr('stop-opacity', 0.85);
        grad.append('stop').attr('offset', '100%').attr('stop-color', c.end).attr('stop-opacity', 0.45);
      });

      const areaGenerator = d3.area<d3.SeriesPoint<HistoricalHolderSnapshot>>()
        .curve(d3.curveMonotoneX)
        .x(d => xScale(new Date(d.data.timestamp)))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]));

      // Render Stacked Path Layers
      series.forEach((layerSeries, idx) => {
        g.append('path')
          .datum(layerSeries)
          .attr('fill', `url(#${layerColors[idx].id})`)
          .attr('stroke', layerColors[idx].stroke)
          .attr('stroke-width', 1.2)
          .attr('opacity', 0.9)
          .attr('d', areaGenerator);
      });

    } else {
      // Lines Mode: Compare Top 10%, Top 50%, Top 100% curves
      const maxConcentration = Math.max(...data.map(d => d.top100SharePct));
      const minConcentration = Math.min(...data.map(d => d.top10SharePct));
      
      const yScale = d3.scaleLinear()
        .domain([Math.max(0, Math.floor(minConcentration - 5)), Math.min(100, Math.ceil(maxConcentration + 5))])
        .range([innerHeight, 0]);

      // Y Axis
      const yAxis = d3.axisLeft(yScale)
        .ticks(6)
        .tickFormat(d => `${d}%`)
        .tickSize(-innerWidth)
        .tickPadding(8);

      const yAxisG = g.append('g').call(yAxis);
      yAxisG.select('.domain').attr('stroke', '#334155');
      yAxisG.selectAll('.tick line').attr('stroke', '#1e293b').attr('stroke-dasharray', '2,2');
      yAxisG.selectAll('.tick text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'monospace');

      const lineConfigs = [
        { key: 'top10SharePct', color: '#818cf8', strokeWidth: 2.5, label: 'Top 10 Whales' },
        { key: 'top50SharePct', color: '#38bdf8', strokeWidth: 2.0, label: 'Top 50 Cumulative' },
        { key: 'top100SharePct', color: '#34d399', strokeWidth: 1.8, label: 'Top 100 Cumulative' },
        { key: 'retailSharePct', color: '#94a3b8', strokeWidth: 1.5, label: 'Retail Float' }
      ];

      lineConfigs.forEach(cfg => {
        const lineGen = d3.line<HistoricalHolderSnapshot>()
          .curve(d3.curveMonotoneX)
          .x(d => xScale(new Date(d.timestamp)))
          .y(d => yScale(d[cfg.key as keyof HistoricalHolderSnapshot] as number));

        g.append('path')
          .datum(data)
          .attr('fill', 'none')
          .attr('stroke', cfg.color)
          .attr('stroke-width', cfg.strokeWidth)
          .attr('d', lineGen);
      });
    }

    // Render Event Annotation Markers on Timeline
    const annotatedPoints = data.filter(d => !!d.eventAnnotation);
    annotatedPoints.forEach(pt => {
      const xPos = xScale(new Date(pt.timestamp));
      
      // Vertical dashed marker line
      g.append('line')
        .attr('x1', xPos)
        .attr('y1', 0)
        .attr('x2', xPos)
        .attr('y2', innerHeight)
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 1.2)
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', 0.7);

      // Event pin dot
      g.append('circle')
        .attr('cx', xPos)
        .attr('cy', 8)
        .attr('r', 4)
        .attr('fill', '#f59e0b')
        .attr('stroke', '#0f172a')
        .attr('stroke-width', 1.5);
    });

    // Crosshair & Interaction Overlay
    const focusLine = g.append('line')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .style('opacity', 0);

    const focusCircle = g.append('circle')
      .attr('r', 4)
      .attr('fill', '#818cf8')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .style('opacity', 0);

    const bisectDate = d3.bisector<HistoricalHolderSnapshot, Date>(d => new Date(d.timestamp)).center;

    // Overlay rect for pointer tracking
    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('mousemove', (event) => {
        const [pointerX, pointerY] = d3.pointer(event);
        const xDate = xScale.invert(pointerX);
        const idx = bisectDate(data, xDate);
        const selected = data[idx];

        if (selected) {
          const snappedX = xScale(new Date(selected.timestamp));
          focusLine.attr('x1', snappedX).attr('x2', snappedX).style('opacity', 0.8);
          focusCircle.attr('cx', snappedX).attr('cy', pointerY).style('opacity', 1);

          const svgBounds = svgRef.current?.getBoundingClientRect();
          if (svgBounds) {
            setTooltip({
              snapshot: selected,
              x: event.clientX,
              y: event.clientY
            });
          }
        }
      })
      .on('mouseleave', () => {
        focusLine.style('opacity', 0);
        focusCircle.style('opacity', 0);
        setTooltip(null);
      });

  }, [data, viewMode, timeframe]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
      {/* Chart Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-white">Historical Whale Distribution Over Time</span>
            <span className="text-xs text-indigo-400 font-mono">D3.js Visualization</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            On-chain tracking of token supply concentration across Top 10, Top 50, Top 100 whale tiers, and retail community.
          </p>
        </div>

        {/* Interactive Viewport Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('stacked')}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                viewMode === 'stacked'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Stacked (100% Supply)
            </button>
            <button
              onClick={() => setViewMode('lines')}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                viewMode === 'lines'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tier Curves
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800">
            {(['30D', '90D', '180D', '1Y'] as TimeframeOption[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                  timeframe === tf
                    ? 'bg-indigo-600/30 text-indigo-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Strips */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>Top 10 Whales</span>
            </span>
            <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${top10Delta <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {top10Delta <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              {top10Delta > 0 ? '+' : ''}{top10Delta}%
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-white tabular-nums">
              {latestSnapshot?.top10SharePct}%
            </span>
            <span className="text-[10px] text-slate-500">
              Was {firstSnapshot?.top10SharePct}%
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span>Top 50 Whales</span>
            </span>
            <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${top50Delta <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {top50Delta <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              {top50Delta > 0 ? '+' : ''}{top50Delta}%
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-white tabular-nums">
              {latestSnapshot?.top50SharePct}%
            </span>
            <span className="text-[10px] text-slate-500">
              Was {firstSnapshot?.top50SharePct}%
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <span>Top 100 Whales</span>
            </span>
            <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${top100Delta <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {top100Delta <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              {top100Delta > 0 ? '+' : ''}{top100Delta}%
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-white tabular-nums">
              {latestSnapshot?.top100SharePct}%
            </span>
            <span className="text-[10px] text-slate-500">
              Was {firstSnapshot?.top100SharePct}%
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <span>Retail & Public Float</span>
            </span>
            <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${retailDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {retailDelta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {retailDelta > 0 ? '+' : ''}{retailDelta}%
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-white tabular-nums">
              {latestSnapshot?.retailSharePct}%
            </span>
            <span className="text-[10px] text-slate-500">
              Was {firstSnapshot?.retailSharePct}%
            </span>
          </div>
        </div>
      </div>

      {/* D3 Canvas Container */}
      <div ref={containerRef} className="relative w-full overflow-hidden bg-slate-950 rounded-lg border border-slate-800/80 p-2">
        <svg ref={svgRef} className="w-full select-none" />

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 px-3 border-t border-slate-800/60 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500" /> Top 10 Whales
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-sky-500" /> Next 11 - 50 Whales
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-teal-500" /> Next 51 - 100 Whales
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-600" /> Retail & Floating Supply
            </span>
          </div>

          <div className="flex items-center gap-2 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>On-chain Key Events</span>
          </div>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none p-3.5 bg-slate-900/95 border border-slate-700 rounded-lg shadow-xl text-xs font-mono transform -translate-x-1/2 -translate-y-full mb-3 w-64 backdrop-blur-md"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-slate-300">
            <span className="font-semibold text-white">{tooltip.snapshot.date}</span>
            <span className="text-[10px] text-slate-500">Block #{tooltip.snapshot.blockNumber.toLocaleString()}</span>
          </div>

          <div className="space-y-1.5 py-2">
            <div className="flex justify-between text-indigo-300">
              <span>Top 10 Whales:</span>
              <span className="font-semibold tabular-nums">{tooltip.snapshot.top10SharePct}%</span>
            </div>
            <div className="flex justify-between text-sky-300">
              <span>Top 50 Cumulative:</span>
              <span className="font-semibold tabular-nums">{tooltip.snapshot.top50SharePct}%</span>
            </div>
            <div className="flex justify-between text-teal-300">
              <span>Top 100 Cumulative:</span>
              <span className="font-semibold tabular-nums">{tooltip.snapshot.top100SharePct}%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Retail Float:</span>
              <span className="font-semibold tabular-nums">{tooltip.snapshot.retailSharePct}%</span>
            </div>
            <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-800/60 text-[10px]">
              <span>Tracked Holders:</span>
              <span className="text-slate-300 tabular-nums">{tooltip.snapshot.totalHoldersCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[10px]">
              <span>Gini Index:</span>
              <span className="text-amber-400 font-semibold tabular-nums">{tooltip.snapshot.giniCoefficient}</span>
            </div>
          </div>

          {tooltip.snapshot.eventAnnotation && (
            <div className="mt-1 pt-1.5 border-t border-amber-500/30 text-[11px] text-amber-300 flex items-start gap-1">
              <span className="text-amber-400 font-bold">★</span>
              <span>{tooltip.snapshot.eventAnnotation}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
