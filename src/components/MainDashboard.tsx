import React from 'react';
import { UserPortfolio, TradeOrder, TokenProfile } from '../types/token';
import { TRADING_PAIRS, SUPPORTED_TOKENS } from '../data/tokens';
import { Wallet, ArrowUpRight, ArrowDownRight, TrendingUp, Sparkles, RefreshCw, Gift, Activity, Clock, Layers, ShieldCheck, ExternalLink } from 'lucide-react';

interface MainDashboardProps {
  portfolio: UserPortfolio;
  currentBlock: number;
  tradeHistory: TradeOrder[];
  onOpenTrading: () => void;
  onOpenWallet: () => void;
  onOpenRewards: () => void;
  onSelectToken: (token: TokenProfile) => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  portfolio,
  currentBlock,
  tradeHistory,
  onOpenTrading,
  onOpenWallet,
  onOpenRewards,
  onSelectToken
}) => {
  const ethPrice = 3142.5;
  const ctPrice = 2.48;
  const totalEthValUsd = portfolio.demoEthBalance * ethPrice;
  const totalCtValUsd = portfolio.demoCtBalance * ctPrice;
  const totalUsdtValUsd = portfolio.demoUsdtBalance;
  const totalPortfolioUsd = totalEthValUsd + totalCtValUsd + totalUsdtValUsd;

  return (
    <div className="space-y-6">
      {/* Executive Welcome & Portfolio Summary Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
                ETHERPULSE PORTFOLIO SUMMARY
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                Block #{currentBlock.toLocaleString()}
              </span>
            </div>
            <h2 className="text-3xl font-extrabold font-mono text-white tabular-nums tracking-tight">
              ${totalPortfolioUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-slate-400">
              Total estimated simulated portfolio valuation across testnet assets
            </p>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenTrading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Launch Live DEX</span>
            </button>
            <button
              onClick={onOpenWallet}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700 shadow-xs"
            >
              <Wallet className="w-3.5 h-3.5 text-cyan-400" />
              <span>Wallet & Faucet</span>
            </button>
            <button
              onClick={onOpenRewards}
              className="px-4 py-2 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-indigo-500/30 shadow-xs"
            >
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              <span>Rewards Center</span>
            </button>
          </div>
        </div>

        {/* Assets Breakdown Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
          <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Demo ETH Balance</span>
              <span className="text-emerald-400 text-[11px] font-sans font-medium">Native Gas</span>
            </div>
            <div className="text-xl font-bold text-white mt-1 tabular-nums">
              {portfolio.demoEthBalance.toFixed(4)} ETH
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              ≈ ${totalEthValUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>CoreToken (CT) Balance</span>
              <span className="text-cyan-400 text-[11px] font-sans font-medium">-25% Fee Discount</span>
            </div>
            <div className="text-xl font-bold text-cyan-400 mt-1 tabular-nums">
              {portfolio.demoCtBalance.toLocaleString()} CT
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              ≈ ${totalCtValUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Demo USDT Balance</span>
              <span className="text-slate-400 text-[11px] font-sans font-medium">Stablecoin</span>
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-1 tabular-nums">
              {portfolio.demoUsdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Liquidity Reserve
            </div>
          </div>
        </div>
      </div>

      {/* Market Overview & Top DEX Pairs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Live Market Overview & Concentrated Pairs</h3>
            <p className="text-xs text-slate-400">Real-time DEX quotes, 24h price changes, and Uniswap V3 liquidity depth</p>
          </div>
          <button
            onClick={onOpenTrading}
            className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>Trade All Pairs</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800 font-mono text-xs">
          {TRADING_PAIRS.slice(0, 3).map((pair) => (
            <div key={pair.id} className="p-5 space-y-3 hover:bg-slate-800/30 transition-colors">
              <div className="flex justify-between items-center">
                <span className="font-sans font-bold text-white text-sm">{pair.id}</span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    pair.priceChange24h >= 0 ? 'bg-emerald-950/60 text-emerald-400' : 'bg-rose-950/60 text-rose-400'
                  }`}
                >
                  {pair.priceChange24h >= 0 ? '+' : ''}{pair.priceChange24h}%
                </span>
              </div>

              <div className="space-y-0.5">
                <div className="text-lg font-bold text-white tabular-nums">
                  {pair.currentPrice < 0.01 ? pair.currentPrice.toFixed(6) : pair.currentPrice.toLocaleString()} {pair.id.split('/')[1]}
                </div>
                <div className="text-[11px] text-slate-400">
                  24h Vol: ${((pair.volume24hUsd || 1500000) / 1e6).toFixed(2)}M
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Pool Fee: 0.30%</span>
                <button
                  onClick={onOpenTrading}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 rounded transition-colors"
                >
                  Swap Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column: Recent DEX Transactions & Account Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Recent DEX Transactions</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">{tradeHistory.length} Recorded</span>
          </div>

          <div className="divide-y divide-slate-800/60 font-mono text-xs max-h-80 overflow-y-auto">
            {tradeHistory.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No trade history recorded yet.</div>
            ) : (
              tradeHistory.slice(0, 6).map((tx) => (
                <div key={tx.id} className="p-3.5 hover:bg-slate-800/30 transition-colors flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          tx.side === 'BUY' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                        }`}
                      >
                        {tx.side}
                      </span>
                      <span className="text-white font-medium">{tx.amount.toLocaleString()} {tx.pair.split('/')[0]}</span>
                      <span className="text-slate-500 text-[10px]">@{tx.price}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      Block #{tx.blockNumber} · {tx.txHash ? `${tx.txHash.slice(0, 8)}...` : ''}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-medium block tabular-nums">
                      ${tx.totalCostUsd ? tx.totalCostUsd.toFixed(2) : (tx.amount * tx.price).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-emerald-400">FILLED</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Account Activity & Ecosystem Health */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Account Activity & Compliance</h3>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <span className="text-slate-400">Total Executed Trades:</span>
              <span className="text-white font-semibold tabular-nums">{portfolio.totalTradeCount} trades</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <span className="text-slate-400">Accumulated Volume:</span>
              <span className="text-emerald-400 font-semibold tabular-nums">
                ${portfolio.totalVolumeUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <span className="text-slate-400">CoreToken Fee Discount:</span>
              <span className="text-cyan-400 font-semibold">-25% (Active)</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <span className="text-slate-400">KYC & Wallet Status:</span>
              <span className="text-emerald-400 font-semibold">TIER 2 VERIFIED (Testnet)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
