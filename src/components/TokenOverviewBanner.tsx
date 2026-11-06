import React, { useState, useMemo } from 'react';
import { Copy, Check, ExternalLink, ShieldCheck, AlertTriangle, Coins, TrendingUp, TrendingDown, Layers, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { TokenProfile } from '../types/token';
import { checkTermsCompliance } from '../utils/complianceValidator';

interface TokenOverviewBannerProps {
  token: TokenProfile;
  currentPrice: number;
}

export const TokenOverviewBanner: React.FC<TokenOverviewBannerProps> = ({
  token,
  currentPrice
}) => {
  const [copied, setCopied] = useState(false);

  const compliance = useMemo(() => {
    return checkTermsCompliance(token.name, token.symbol, token.description || '');
  }, [token.name, token.symbol, token.description]);

  const copyAddress = () => {
    navigator.clipboard.writeText(token.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPositive24h = token.priceChange24h >= 0;

  // Format currency
  const formatCurrency = (val: number) => {
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(2)}K`;
    return `$${val.toFixed(2)}`;
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Top bar with identity, contract, and actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-lg text-indigo-300">
              {token.symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-white tracking-tight">{token.name}</h1>
                <span className="text-sm font-semibold text-slate-400 font-mono">({token.symbol})</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-400 font-mono">{token.standard}</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-400 font-mono">Decimals: {token.decimals}</span>
                {token.verified && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium ml-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified Bytecode</span>
                  </span>
                )}
                <span className="text-xs text-slate-400">·</span>
                <span className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border ${
                  compliance.isCompliant
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-950/60 text-rose-400 border-rose-500/30'
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>No Reserved or Prohibited Terms: {compliance.isCompliant ? 'Verified (0 Violations)' : 'Flagged'}</span>
                </span>
              </div>

              {/* Contract address copy & Etherscan */}
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-mono">
                <span>Contract:</span>
                <span className="text-slate-300 select-all">{token.address}</span>
                <button
                  onClick={copyAddress}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                  title="Copy contract address"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={token.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                  title="View on Etherscan"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Live Price Block */}
          <div className="flex items-baseline lg:items-end flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
                ${currentPrice < 0.01 ? currentPrice.toFixed(8) : currentPrice.toFixed(4)}
              </span>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                ({token.currentPriceEth} ETH)
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs font-mono tabular-nums">
              <span className={`inline-flex items-center gap-0.5 font-semibold ${isPositive24h ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive24h ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositive24h ? '+' : ''}{token.priceChange24h}% (24h)
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">
                1h: <span className={token.priceChange1h >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {token.priceChange1h >= 0 ? '+' : ''}{token.priceChange1h}%
                </span>
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">
                7d: <span className={token.priceChange7d >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {token.priceChange7d >= 0 ? '+' : ''}{token.priceChange7d}%
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* 6 Key Token Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-4">
          {/* Market Cap */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <span className="text-xs text-slate-400 block font-medium">Market Capitalization</span>
            <span className="text-sm font-semibold font-mono text-white tabular-nums mt-0.5 block">
              {formatCurrency(token.marketCapUsd)}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Circulating Supply × Price</span>
          </div>

          {/* FDV */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <span className="text-xs text-slate-400 block font-medium">Fully Diluted (FDV)</span>
            <span className="text-sm font-semibold font-mono text-white tabular-nums mt-0.5 block">
              {formatCurrency(token.fdvUsd)}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Total Supply × Price</span>
          </div>

          {/* 24h Volume */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <span className="text-xs text-slate-400 block font-medium">24h Trading Volume</span>
            <span className="text-sm font-semibold font-mono text-white tabular-nums mt-0.5 block">
              {formatCurrency(token.volume24hUsd)}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Across Uniswap & CEXs</span>
          </div>

          {/* DEX Liquidity */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <span className="text-xs text-slate-400 block font-medium">DEX Pool Liquidity</span>
            <span className="text-sm font-semibold font-mono text-white tabular-nums mt-0.5 block">
              {formatCurrency(token.liquidityUsd)}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">V3 + V2 Total Value Locked</span>
          </div>

          {/* Circulating Supply */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <span className="text-xs text-slate-400 block font-medium">Circulating Supply</span>
            <span className="text-sm font-semibold font-mono text-white tabular-nums mt-0.5 block truncate" title={token.circulatingSupplyFormatted}>
              {token.circulatingSupplyFormatted}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Total: {token.totalSupplyFormatted}</span>
          </div>

          {/* 24h Range */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <span className="text-xs text-slate-400 block font-medium">24h High / Low</span>
            <div className="flex items-center gap-1.5 text-xs font-mono tabular-nums mt-0.5">
              <span className="text-rose-400 font-medium">${token.low24h < 0.01 ? token.low24h.toFixed(6) : token.low24h.toFixed(2)}</span>
              <span className="text-slate-600">—</span>
              <span className="text-emerald-400 font-medium">${token.high24h < 0.01 ? token.high24h.toFixed(6) : token.high24h.toFixed(2)}</span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">Execution extremes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
