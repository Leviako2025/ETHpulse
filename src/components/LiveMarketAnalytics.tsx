import React, { useState } from 'react';
import { TokenProfile, PriceCandle } from '../types/token';
import { TrendingUp, TrendingDown, BarChart2, Activity, Droplets, Layers, ArrowUpRight } from 'lucide-react';

interface LiveMarketAnalyticsProps {
  token: TokenProfile;
  currentPrice: number;
  candles: PriceCandle[];
  buyVolume24h: number;
  sellVolume24h: number;
}

export const LiveMarketAnalytics: React.FC<LiveMarketAnalyticsProps> = ({
  token,
  currentPrice,
  candles,
  buyVolume24h,
  sellVolume24h
}) => {
  const [timeframe, setTimeframe] = useState<'15m' | '1h' | '4h' | '1D' | '1W'>('15m');
  const [chartType, setChartType] = useState<'candles' | 'area'>('candles');
  const [hoveredCandle, setHoveredCandle] = useState<PriceCandle | null>(null);

  const totalVolume = buyVolume24h + sellVolume24h;
  const buyRatio = totalVolume > 0 ? (buyVolume24h / totalVolume) * 100 : 50;
  const sellRatio = 100 - buyRatio;

  // Chart coordinate calculations
  const chartHeight = 240;
  const chartWidth = 720;
  const paddingY = 24;

  const minPrice = Math.min(...candles.map((c) => c.low));
  const maxPrice = Math.max(...candles.map((c) => c.high));
  const priceRange = maxPrice - minPrice || 1;

  const getY = (val: number) => {
    return chartHeight - paddingY - ((val - minPrice) / priceRange) * (chartHeight - paddingY * 2);
  };

  const candleWidth = Math.max(4, Math.floor((chartWidth - 40) / candles.length));

  // Area path
  const areaPoints = candles.map((c, i) => {
    const x = 20 + i * candleWidth + candleWidth / 2;
    const y = getY(c.close);
    return `${x},${y}`;
  });

  const areaSvgPath = areaPoints.length > 0 
    ? `M ${areaPoints[0]} L ${areaPoints.join(' L ')} L ${20 + (candles.length - 1) * candleWidth + candleWidth / 2},${chartHeight - 10} L 20,${chartHeight - 10} Z`
    : '';

  const lineSvgPath = areaPoints.length > 0 ? `M ${areaPoints.join(' L ')}` : '';

  return (
    <div className="space-y-6">
      {/* Chart & Market Pressure Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Price Chart Viewport (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          {/* Chart Header Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Live Price Chart</span>
                <span className="text-xs text-slate-400 font-mono">Uniswap V3 Pair</span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {hoveredCandle ? (
                  <span>
                    Time: {hoveredCandle.timeLabel} · O: ${hoveredCandle.open} · H: ${hoveredCandle.high} · L: ${hoveredCandle.low} · C: ${hoveredCandle.close} · Vol: ${(hoveredCandle.volumeUsd / 1e3).toFixed(1)}k
                  </span>
                ) : (
                  <span>Hover candlestick to inspect OHLCV interval bar</span>
                )}
              </p>
            </div>

            {/* Timeframe & Chart Style Segmented Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800">
                {(['15m', '1h', '4h', '1D', '1W'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                      timeframe === tf
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  onClick={() => setChartType('candles')}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                    chartType === 'candles' ? 'bg-indigo-600/30 text-indigo-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Candles
                </button>
                <button
                  onClick={() => setChartType('area')}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                    chartType === 'area' ? 'bg-indigo-600/30 text-indigo-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Area
                </button>
              </div>
            </div>
          </div>

          {/* SVG Chart Canvas */}
          <div className="relative mt-4 w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-64 select-none"
              onMouseLeave={() => setHoveredCandle(null)}
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Price Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const y = paddingY + pct * (chartHeight - paddingY * 2);
                const pVal = maxPrice - pct * priceRange;
                return (
                  <g key={idx}>
                    <line x1="20" y1={y} x2={chartWidth - 20} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                    <text x={chartWidth - 16} y={y + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
                      ${pVal < 0.01 ? pVal.toFixed(6) : pVal.toFixed(3)}
                    </text>
                  </g>
                );
              })}

              {chartType === 'area' ? (
                <>
                  <path d={areaSvgPath} fill="url(#areaGradient)" />
                  <path d={lineSvgPath} fill="none" stroke="#818cf8" strokeWidth="2" />
                </>
              ) : (
                candles.map((c, i) => {
                  const x = 20 + i * candleWidth + candleWidth / 2;
                  const isBull = c.close >= c.open;
                  const highY = getY(c.high);
                  const lowY = getY(c.low);
                  const openY = getY(c.open);
                  const closeY = getY(c.close);
                  const bodyY = Math.min(openY, closeY);
                  const bodyHeight = Math.max(2, Math.abs(closeY - openY));
                  const strokeColor = isBull ? '#10b981' : '#f43f5e';
                  const fillColor = isBull ? '#10b981' : '#f43f5e';

                  return (
                    <g
                      key={c.timestamp}
                      onMouseEnter={() => setHoveredCandle(c)}
                      className="cursor-crosshair transition-opacity hover:opacity-80"
                    >
                      {/* High-Low Wick */}
                      <line x1={x} y1={highY} x2={x} y2={lowY} stroke={strokeColor} strokeWidth="1.2" />
                      {/* Candle Body */}
                      <rect
                        x={x - candleWidth * 0.4}
                        y={bodyY}
                        width={candleWidth * 0.8}
                        height={bodyHeight}
                        fill={fillColor}
                        rx="1"
                      />
                    </g>
                  );
                })
              )}
            </svg>
          </div>

          {/* Time axis footer */}
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800">
            <span>{candles[0]?.timeLabel || 'T-24h'}</span>
            <span>{candles[Math.floor(candles.length / 2)]?.timeLabel || 'T-12h'}</span>
            <span>Live Block #{candles[candles.length - 1]?.timeLabel || 'Current'}</span>
          </div>
        </div>

        {/* Live Orderflow & Buy/Sell Pressure Gauge (1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-sm font-semibold text-white">Buy vs Sell Pressure</span>
              <span className="text-xs font-mono text-slate-400">24h DEX Volume</span>
            </div>

            {/* Visual ratio bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs font-mono mb-1.5 tabular-nums">
                <span className="text-emerald-400 font-semibold">{buyRatio.toFixed(1)}% Buys</span>
                <span className="text-rose-400 font-semibold">{sellRatio.toFixed(1)}% Sells</span>
              </div>
              <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                <div style={{ width: `${buyRatio}%` }} className="bg-emerald-500 h-full transition-all duration-500" />
                <div style={{ width: `${sellRatio}%` }} className="bg-rose-500 h-full transition-all duration-500" />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-1.5 tabular-nums">
                <span>${(buyVolume24h / 1e6).toFixed(2)}M Taker Buy</span>
                <span>${(sellVolume24h / 1e6).toFixed(2)}M Taker Sell</span>
              </div>
            </div>

            {/* Market Indicators */}
            <div className="space-y-3 mt-6">
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-400 font-medium">Net Orderflow Inflow</span>
                <span className={`text-xs font-mono font-semibold tabular-nums ${buyVolume24h >= sellVolume24h ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {buyVolume24h >= sellVolume24h ? '+' : '-'}${Math.abs((buyVolume24h - sellVolume24h) / 1e6).toFixed(2)}M
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-400 font-medium">Volume / Market Cap Ratio</span>
                <span className="text-xs font-mono text-slate-200 tabular-nums">
                  {((token.volume24hUsd / token.marketCapUsd) * 100).toFixed(2)}%
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-400 font-medium">Liquidity to FDV Depth</span>
                <span className="text-xs font-mono text-slate-200 tabular-nums">
                  {((token.liquidityUsd / token.fdvUsd) * 100).toFixed(2)}%
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-400 font-medium">Implied Volatility (24h)</span>
                <span className="text-xs font-mono text-amber-400 font-semibold tabular-nums">
                  {((token.high24h - token.low24h) / token.low24h * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4 text-[11px] text-slate-500">
            Orderflow aggregated from Uniswap V3, Uniswap V2, SushiSwap pools and MEV block builder bundles.
          </div>
        </div>
      </div>

      {/* Liquidity Pools Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Automated Market Maker (AMM) Liquidity Pools</h3>
            <p className="text-xs text-slate-400">On-chain decentralized exchange vaults supporting live token trades</p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Total TVL: ${(token.liquidityUsd / 1e6).toFixed(1)}M
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-mono border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-6">DEX & Pool</th>
                <th className="py-3 px-6">Pair / Fee</th>
                <th className="py-3 px-6 text-right">Liquidity (TVL)</th>
                <th className="py-3 px-6 text-right">24h Volume</th>
                <th className="py-3 px-6 text-right">Token Reserve</th>
                <th className="py-3 px-6 text-right">Paired Reserve</th>
                <th className="py-3 px-6 text-center">Contract</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {token.pools.map((pool, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-6">
                    <span className="font-sans font-semibold text-white block">{pool.dexName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{pool.poolAddress.slice(0, 8)}...{pool.poolAddress.slice(-6)}</span>
                  </td>
                  <td className="py-3 px-6">
                    <span className="text-slate-200">{pool.pairSymbol}</span>
                    <span className="text-slate-500 text-[10px] block">Fee: {pool.feeTierPercent}%</span>
                  </td>
                  <td className="py-3 px-6 text-right text-white font-semibold tabular-nums">
                    ${(pool.liquidityUsd / 1e6).toFixed(2)}M
                  </td>
                  <td className="py-3 px-6 text-right text-slate-200 tabular-nums">
                    ${(pool.volume24hUsd / 1e6).toFixed(2)}M
                  </td>
                  <td className="py-3 px-6 text-right text-slate-300 tabular-nums">
                    {pool.tokenReserve}
                  </td>
                  <td className="py-3 px-6 text-right text-slate-300 tabular-nums">
                    {pool.ethReserve}
                  </td>
                  <td className="py-3 px-6 text-center">
                    <a
                      href={`https://etherscan.io/address/${pool.poolAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
