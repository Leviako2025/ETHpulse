import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { TokenProfile, HistoricalHolderSnapshot } from '../types/token';
import { getHistoricalHolderDistribution } from '../data/tokens';
import { TrendingDown, TrendingUp, Layers, Activity, Calendar, Info, Sparkles, Filter } from 'lucide-react';

interface HistoricalWhaleChartD3Props {
  token: TokenProfile;
}

type TimeframeOption = '30D' | '90D' | '180D' | '1Y';
type ChartDisplayMode = 'stackedArea' | 'trendLines';

interface CohortDefinition {
  key: 'top10SharePct' | 'next11to50Pct' | 'next51to100Pct' | 'retailSharePct';
  label: string;
  color: string;
  description: string;
}

const COHORTS: CohortDefinition[] = [
  { key: 'top10SharePct', label: 'Top 1-10 Whales', color: '#6366f1', description: 'Core founders, primary LPs, protocol treasury' },
  { key: 'next11to50Pct', label: 'Top 11-50 Whales', color: '#38bdf8', description: 'Institutional funds, CEX hot wallets' },
  { key: 'next51to100Pct', label: 'Top 51-100 Whales', color: '#2dd4bf', description: 'Early angels, large liquidity providers' },
  { key: 'retailSharePct', label: 'Retail & Community (>100)', color: '#64748b', description: 'Decentralized public holder distribution' }
];

interface StackDatum {
  date: Date;
  raw: HistoricalHolderSnapshot;
  top10SharePct: number;
  next11to50Pct: number;
  next51to100Pct: number;
  retailSharePct: number;
  [key: string]: any;
}

export const HistoricalWhaleChartD3: React.FC<HistoricalWhaleChartD3Props> = ({ token }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [timeframe, setTimeframe] = useState<TimeframeOption>('90D');
  const [displayMode, setDisplayMode] = useState<ChartDisplayMode>('stackedArea');
  const [focusedCohort, setFocusedCohort] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<HistoricalHolderSnapshot | null>(null);

  const [chartWidth, setChartWidth] = useState<number>(800);

  // Responsive container observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0] && entries[0].contentRect.width > 0) {
        setChartWidth(Math.floor(entries[0].contentRect.width));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const timeframeDays = useMemo(() => {
    switch (timeframe) {
      case '30D': return 30;
      case '90D': return 90;
      case '180D': return 180;
      case '1Y': return 365;
      default: return 90;
    }
  }, [timeframe]);

  // Fetch snapshots
  const snapshots = useMemo(() => {
    return getHistoricalHolderDistribution(token.symbol, timeframeDays);
  }, [token.symbol, timeframeDays]);

  // Calculations for KPI callouts
  const firstSnapshot = snapshots[0];
  const latestSnapshot = snapshots[snapshots.length - 1];
  const top10Delta = latestSnapshot && firstSnapshot 
    ? Number((latestSnapshot.top10SharePct - firstSnapshot.top10SharePct).toFixed(2))
    : 0;
  const retailDelta = latestSnapshot && firstSnapshot
    ? Number((latestSnapshot.retailSharePct - firstSnapshot.retailSharePct).toFixed(2))
    : 0;

  // D3 Render Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || snapshots.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clean previous render

    const containerWidth = chartWidth || containerRef.current.clientWidth || 800;
    const height = 340;
    const margin = { top: 20, right: 35, bottom: 40, left: 45 };
    const width = containerWidth - margin.left - margin.right;

    svg
      .attr('viewBox', `0 0 ${containerWidth} ${height}`)
      .attr('width', '100%')
      .attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define Gradients for areas
    const defs = svg.append('defs');
    COHORTS.forEach((cohort) => {
      const gradient = defs
        .append('linearGradient')
        .attr('id', `gradient-${cohort.key}`)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');

      gradient
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', cohort.color)
        .attr('stop-opacity', 0.85);

      gradient
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', cohort.color)
        .attr('stop-opacity', 0.40);
    });

    // Parse dates
    const dataWithDates: StackDatum[] = snapshots.map((s) => ({
      date: new Date(s.timestamp),
      raw: s,
      top10SharePct: s.top10SharePct,
      next11to50Pct: s.next11to50Pct,
      next51to100Pct: s.next51to100Pct,
      retailSharePct: s.retailSharePct
    }));

    // Scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(dataWithDates, (d) => d.date) as [Date, Date])
      .range([0, width]);

    // Gridlines background
    const yGrid = g.append('g').attr('class', 'grid grid-y');

    if (displayMode === 'stackedArea') {
      // Stack generator (normalized 0 to 100%)
      const stackKeys: (keyof Pick<StackDatum, 'top10SharePct' | 'next11to50Pct' | 'next51to100Pct' | 'retailSharePct'>)[] = [
        'top10SharePct',
        'next11to50Pct',
        'next51to100Pct',
        'retailSharePct'
      ];

      const stack = d3
        .stack<StackDatum>()
        .keys(stackKeys)
        .value((d, key) => (d[key] as number) || 0);

      const series = stack(dataWithDates);

      const yScale = d3.scaleLinear().domain([0, 100]).range([height - margin.top - margin.bottom, 0]);

      // Y Grid lines
      yGrid
        .selectAll('line')
        .data([20, 40, 60, 80, 100])
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', (d) => yScale(d))
        .attr('y2', (d) => yScale(d))
        .attr('stroke', '#1e293b')
        .attr('stroke-dasharray', '3,3');

      // Area generator
      const areaGen = d3
        .area<d3.SeriesPoint<StackDatum>>()
        .x((d) => xScale(d.data.date))
        .y0((d) => yScale(d[0]))
        .y1((d) => yScale(d[1]))
        .curve(d3.curveMonotoneX);

      // Render Stacked Layers
      g.selectAll('.layer')
        .data(series)
        .enter()
        .append('path')
        .attr('class', 'layer')
        .attr('d', areaGen)
        .attr('fill', (d) => `url(#gradient-${d.key})`)
        .attr('stroke', (d) => {
          const c = COHORTS.find((item) => item.key === d.key);
          return c ? c.color : '#6366f1';
        })
        .attr('stroke-width', 1)
        .attr('opacity', (d) => {
          if (!focusedCohort) return 0.88;
          return focusedCohort === d.key ? 1 : 0.22;
        })
        .style('transition', 'opacity 0.2s ease-in-out');

      // Milestone flags
      dataWithDates.forEach((s) => {
        if (!s.raw.eventAnnotation) return;
        const x = xScale(s.date);
        g.append('line')
          .attr('x1', x)
          .attr('x2', x)
          .attr('y1', 0)
          .attr('y2', height - margin.top - margin.bottom)
          .attr('stroke', '#818cf8')
          .attr('stroke-dasharray', '2,2')
          .attr('opacity', 0.6);

        g.append('circle')
          .attr('cx', x)
          .attr('cy', 8)
          .attr('r', 3.5)
          .attr('fill', '#818cf8')
          .attr('stroke', '#0f172a')
          .attr('stroke-width', 1.5);
      });

      // Axes
      const xAxis = d3
        .axisBottom(xScale)
        .ticks(width > 600 ? 7 : 4)
        .tickFormat((d) => d3.timeFormat(timeframe === '30D' ? '%b %d' : '%b %y')(d as Date));

      const yAxis = d3
        .axisLeft(yScale)
        .ticks(5)
        .tickFormat((d) => `${d}%`);

      g.append('g')
        .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
        .call(xAxis)
        .attr('color', '#64748b')
        .selectAll('text')
        .attr('font-size', '10px')
        .attr('font-family', 'var(--font-mono)');

      g.append('g')
        .call(yAxis)
        .attr('color', '#64748b')
        .selectAll('text')
        .attr('font-size', '10px')
        .attr('font-family', 'var(--font-mono)');

    } else {
      // Trend Lines Mode
      const maxVal = d3.max(dataWithDates, (d) => Math.max(d.top10SharePct, d.raw.top50SharePct, d.retailSharePct)) || 70;
      const yScale = d3.scaleLinear().domain([0, maxVal * 1.1]).range([height - margin.top - margin.bottom, 0]);

      // Y Grid
      yGrid
        .selectAll('line')
        .data(yScale.ticks(5))
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', (d) => yScale(d))
        .attr('y2', (d) => yScale(d))
        .attr('stroke', '#1e293b')
        .attr('stroke-dasharray', '3,3');

      COHORTS.forEach((cohort) => {
        const lineGen = d3
          .line<StackDatum>()
          .x((d) => xScale(d.date))
          .y((d) => yScale(d[cohort.key]))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(dataWithDates)
          .attr('fill', 'none')
          .attr('stroke', cohort.color)
          .attr('stroke-width', focusedCohort === cohort.key ? 3 : 2)
          .attr('opacity', focusedCohort ? (focusedCohort === cohort.key ? 1 : 0.22) : 0.88)
          .attr('d', lineGen)
          .style('transition', 'all 0.2s ease-in-out');
      });

      // Axes
      const xAxis = d3
        .axisBottom(xScale)
        .ticks(width > 600 ? 7 : 4)
        .tickFormat((d) => d3.timeFormat(timeframe === '30D' ? '%b %d' : '%b %y')(d as Date));

      const yAxis = d3
        .axisLeft(yScale)
        .ticks(5)
        .tickFormat((d) => `${d}%`);

      g.append('g')
        .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
        .call(xAxis)
        .attr('color', '#64748b')
        .selectAll('text')
        .attr('font-size', '10px')
        .attr('font-family', 'var(--font-mono)');

      g.append('g')
        .call(yAxis)
        .attr('color', '#64748b')
        .selectAll('text')
        .attr('font-size', '10px')
        .attr('font-family', 'var(--font-mono)');
    }

    // Interactive Hover Overlay
    const bisect = d3.bisector<StackDatum, Date>((d) => d.date).center;
    const focusLine = g
      .append('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('y1', 0)
      .attr('y2', height - margin.top - margin.bottom)
      .style('opacity', 0);

    const overlay = g
      .append('rect')
      .attr('width', width)
      .attr('height', height - margin.top - margin.bottom)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair');

    overlay
      .on('mousemove', (event) => {
        const [xm] = d3.pointer(event);
        const xDate = xScale.invert(xm);
        const index = bisect(dataWithDates, xDate);
        const datum = dataWithDates[index];
        if (datum) {
          const posX = xScale(datum.date);
          focusLine.attr('x1', posX).attr('x2', posX).style('opacity', 0.8);
          setHoveredPoint(datum.raw);
        }
      })
      .on('mouseleave', () => {
        focusLine.style('opacity', 0);
        setHoveredPoint(null);
      });

  }, [snapshots, displayMode, focusedCohort, timeframe, chartWidth]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      {/* Header & Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-semibold text-white">Historical Whale Distribution Over Time</h3>
            <span className="text-xs text-indigo-300 font-mono">D3.js Visualization</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluates token supply centralization shifts between mega whales, funds, and retail cohorts across Ethereum blocks.
          </p>
        </div>

        {/* Timeframe & Mode Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Display Mode: Stacked Area vs Line Trends */}
          <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => setDisplayMode('stackedArea')}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                displayMode === 'stackedArea'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              100% Stacked Area
            </button>
            <button
              onClick={() => setDisplayMode('trendLines')}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                displayMode === 'trendLines'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Trend Lines
            </button>
          </div>

          {/* Timeframe Segmented Control */}
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

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1">
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <span className="text-[11px] text-slate-500 font-mono block">Top 10 Whale Concentration</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-base font-bold font-mono text-white tabular-nums">
              {latestSnapshot ? `${latestSnapshot.top10SharePct}%` : '—'}
            </span>
            <span className={`text-xs font-mono tabular-nums flex items-center ${top10Delta <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {top10Delta <= 0 ? <TrendingDown className="w-3 h-3 mr-0.5" /> : <TrendingUp className="w-3 h-3 mr-0.5" />}
              {top10Delta > 0 ? `+${top10Delta}%` : `${top10Delta}%`}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {top10Delta <= 0 ? 'Decentralizing trend' : 'Whale accumulation wave'}
          </span>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <span className="text-[11px] text-slate-500 font-mono block">Retail Holding Expansion</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
              {latestSnapshot ? `${latestSnapshot.retailSharePct}%` : '—'}
            </span>
            <span className={`text-xs font-mono tabular-nums flex items-center ${retailDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {retailDelta >= 0 ? '+' : ''}{retailDelta}%
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Held by non-top-100 wallets
          </span>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <span className="text-[11px] text-slate-500 font-mono block">On-chain Gini Coefficient</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-base font-bold font-mono text-amber-400 tabular-nums">
              {latestSnapshot ? latestSnapshot.giniCoefficient : '—'}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              (0=equal, 1=monopoly)
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Computed over active wallets
          </span>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <span className="text-[11px] text-slate-500 font-mono block">Historical Milestones Logged</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-base font-bold font-mono text-indigo-400 tabular-nums">
              {snapshots.filter((s) => s.eventAnnotation).length} events
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Linked to contract block events
          </span>
        </div>
      </div>

      {/* D3 Chart Canvas Viewport */}
      <div ref={containerRef} className="relative w-full overflow-hidden bg-slate-950/50 rounded-lg border border-slate-800/80 pt-2">
        <svg ref={svgRef} className="select-none w-full" />

        {/* Dynamic Floating Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-3 right-4 z-20 bg-slate-900/95 border border-slate-700/80 rounded-lg p-3 text-xs font-mono shadow-xl backdrop-blur-xs max-w-xs space-y-1.5 pointer-events-none">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-semibold text-white">
                {new Date(hoveredPoint.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="text-slate-400 text-[10px]">
                Block #{hoveredPoint.blockNumber.toLocaleString()}
              </span>
            </div>

            {hoveredPoint.eventAnnotation && (
              <div className="py-1 px-1.5 bg-indigo-950/60 border border-indigo-500/30 rounded text-[11px] text-indigo-300 font-sans font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 shrink-0 text-indigo-400" />
                <span>{hoveredPoint.eventAnnotation}</span>
              </div>
            )}

            <div className="space-y-1 pt-0.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COHORTS[0].color }} />
                  Top 1-10 Whales:
                </span>
                <span className="text-white font-semibold tabular-nums">{hoveredPoint.top10SharePct}%</span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COHORTS[1].color }} />
                  Top 11-50 Whales:
                </span>
                <span className="text-white font-semibold tabular-nums">{hoveredPoint.next11to50Pct}%</span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COHORTS[2].color }} />
                  Top 51-100 Whales:
                </span>
                <span className="text-white font-semibold tabular-nums">{hoveredPoint.next51to100Pct}%</span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COHORTS[3].color }} />
                  Retail Community:
                </span>
                <span className="text-emerald-400 font-semibold tabular-nums">{hoveredPoint.retailSharePct}%</span>
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
              <span>Holders: {hoveredPoint.totalHoldersCount.toLocaleString()}</span>
              <span>Gini: {hoveredPoint.giniCoefficient}</span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Legend with Cohort Isolation */}
      <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-slate-500 font-mono text-[11px]">Cohorts:</span>
          {COHORTS.map((cohort) => {
            const isFocused = focusedCohort === cohort.key;
            return (
              <button
                key={cohort.key}
                onClick={() => setFocusedCohort(isFocused ? null : cohort.key)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                  isFocused 
                    ? 'bg-slate-800 text-white font-semibold ring-1 ring-slate-700' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950'
                }`}
                title={cohort.description}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cohort.color }} />
                <span className="font-mono text-[11px]">{cohort.label}</span>
              </button>
            );
          })}
        </div>

        {focusedCohort && (
          <button
            onClick={() => setFocusedCohort(null)}
            className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 underline"
          >
            Reset highlight
          </button>
        )}
      </div>
    </div>
  );
};
