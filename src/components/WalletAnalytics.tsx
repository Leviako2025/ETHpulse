import React, { useState } from 'react';
import { TokenProfile, WhaleHolder } from '../types/token';
import { getWhaleWallets, getHolderDistribution } from '../data/tokens';
import { WalletInspectorModal } from './WalletInspectorModal';
import { HistoricalWhaleChartD3 } from './HistoricalWhaleChartD3';
import { Users, Search, ExternalLink, ArrowUpRight, ShieldCheck, Filter } from 'lucide-react';


interface WalletAnalyticsProps {
  token: TokenProfile;
}

export const WalletAnalytics: React.FC<WalletAnalyticsProps> = ({ token }) => {
  const [selectedHolder, setSelectedHolder] = useState<WhaleHolder | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const whales = getWhaleWallets(token.symbol);
  const distributionTiers = getHolderDistribution(token.symbol);

  // Filter whales
  const filteredWhales = whales.filter((w) => {
    const matchesCat = categoryFilter === 'ALL' || w.category === categoryFilter;
    const matchesSearch =
      w.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.label && w.label.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (w.ens && w.ens.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Wallet KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-xs text-slate-400 block font-medium">Total Token Holders</span>
          <span className="text-2xl font-bold font-mono text-white tabular-nums mt-1 block">
            381,948
          </span>
          <span className="text-xs text-emerald-400 font-mono mt-1 block">
            +412 new wallets (24h)
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-xs text-slate-400 block font-medium">24h Active Transfer Wallets</span>
          <span className="text-2xl font-bold font-mono text-white tabular-nums mt-1 block">
            18,490
          </span>
          <span className="text-xs text-slate-400 font-mono mt-1 block">
            4.8% of total holder base
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-xs text-slate-400 block font-medium">Whale Supply Concentration</span>
          <span className="text-2xl font-bold font-mono text-indigo-400 tabular-nums mt-1 block">
            39.8%
          </span>
          <span className="text-xs text-slate-400 font-mono mt-1 block">
            Held by Top 10 non-contract wallets
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <span className="text-xs text-slate-400 block font-medium">Gini Centralization Index</span>
          <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums mt-1 block">
            0.842
          </span>
          <span className="text-xs text-slate-400 font-mono mt-1 block">
            Moderate distribution coefficient
          </span>
        </div>
      </div>

      {/* D3 Historical Whale Distribution Chart */}
      <HistoricalWhaleChartD3 token={token} />

      {/* Holder Distribution Histogram / Tiers */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-white">Wallet Balance Tier Distribution</h3>
            <p className="text-xs text-slate-400">Breakdown of token supply across holding brackets</p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Cohort Analysis: 381,948 Wallets
          </span>
        </div>

        <div className="space-y-3 mt-4">
          {distributionTiers.map((tier) => (
            <div key={tier.tierName} className="space-y-1">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 font-sans font-medium">{tier.tierName}</span>
                <span className="text-slate-400">
                  <strong className="text-white tabular-nums">{tier.holderCount.toLocaleString()}</strong> wallets ({tier.percentHolders}%) · holds <strong className="text-indigo-400 tabular-nums">{tier.percentTokens}%</strong> supply
                </span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                <div
                  style={{ width: `${tier.percentTokens}%` }}
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Whale Wallets Leaderboard */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Top Whale Wallets & Smart Money</h3>
            <p className="text-xs text-slate-400">Largest non-burn holders, exchange hot wallets, and protocol treasuries</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Filter by address or label..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800">
              {['ALL', 'Liquidity Pool', 'Exchange Hot Wallet', 'Team Treasury', 'Whale'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 text-xs font-mono rounded whitespace-nowrap transition-colors ${
                    categoryFilter === cat
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat === 'ALL' ? 'All' : cat.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Whale Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-mono border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-6">Rank & Entity</th>
                <th className="py-3 px-6">Category</th>
                <th className="py-3 px-6 text-right">Holdings</th>
                <th className="py-3 px-6 text-right">USD Valuation</th>
                <th className="py-3 px-6 text-right">% Supply</th>
                <th className="py-3 px-6 text-right">24h Net</th>
                <th className="py-3 px-6 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {filteredWhales.map((whale) => (
                <tr
                  key={whale.address}
                  onClick={() => setSelectedHolder(whale)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[11px] w-6">#{whale.rank}</span>
                      <div>
                        <span className="font-sans font-semibold text-white block">
                          {whale.label || whale.ens || 'Whale Wallet'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {whale.address.slice(0, 8)}...{whale.address.slice(-6)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-6">
                    <span className="text-slate-300 text-xs">{whale.category}</span>
                  </td>
                  <td className="py-3 px-6 text-right text-white font-semibold tabular-nums">
                    {whale.balanceFormatted}
                  </td>
                  <td className="py-3 px-6 text-right text-emerald-400 font-semibold tabular-nums">
                    ${(whale.valueUsd / 1e6).toFixed(2)}M
                  </td>
                  <td className="py-3 px-6 text-right text-indigo-400 font-semibold tabular-nums">
                    {whale.sharePercent}%
                  </td>
                  <td className="py-3 px-6 text-right tabular-nums">
                    <span className={whale.change24hPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {whale.change24hPercent >= 0 ? '+' : ''}{whale.change24hPercent}%
                    </span>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedHolder(whale);
                      }}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-mono transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wallet Inspector Modal */}
      <WalletInspectorModal
        holder={selectedHolder}
        token={token}
        onClose={() => setSelectedHolder(null)}
      />
    </div>
  );
};
