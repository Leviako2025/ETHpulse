import React from 'react';
import { X, ExternalLink, ArrowDownLeft, ArrowUpRight, Copy, Check, ShieldCheck } from 'lucide-react';
import { WhaleHolder, TokenProfile } from '../types/token';

interface WalletInspectorModalProps {
  holder: WhaleHolder | null;
  token: TokenProfile;
  onClose: () => void;
}

export const WalletInspectorModal: React.FC<WalletInspectorModalProps> = ({
  holder,
  token,
  onClose
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!holder) return null;

  const copy = () => {
    navigator.clipboard.writeText(holder.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500">Rank #{holder.rank}</span>
              <h3 className="text-base font-semibold text-white">{holder.label || holder.ens || 'Ethereum Wallet'}</h3>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
              <span>{holder.address}</span>
              <button onClick={copy} className="text-slate-400 hover:text-white">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={`https://etherscan.io/address/${holder.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Metrics */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-500 block font-mono">Token Balance</span>
              <span className="text-sm font-semibold font-mono text-white block mt-0.5 tabular-nums">
                {holder.balanceFormatted}
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-500 block font-mono">USD Valuation</span>
              <span className="text-sm font-semibold font-mono text-emerald-400 block mt-0.5 tabular-nums">
                ${(holder.valueUsd / 1e6).toFixed(2)}M
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-500 block font-mono">Supply Share</span>
              <span className="text-sm font-semibold font-mono text-indigo-400 block mt-0.5 tabular-nums">
                {holder.sharePercent}%
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-500 block font-mono">Entity Category</span>
              <span className="text-xs font-semibold text-slate-300 block mt-1">
                {holder.category}
              </span>
            </div>
          </div>

          {/* On-chain Details */}
          <div className="border border-slate-800 rounded-lg divide-y divide-slate-800 bg-slate-950/40 text-xs font-mono">
            <div className="flex justify-between p-3">
              <span className="text-slate-400">First Acquired Block:</span>
              <span className="text-white">#{holder.firstSeenBlock.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-slate-400">Total Lifecycle Transfers:</span>
              <span className="text-white">{holder.txCount.toLocaleString()} on-chain transactions</span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-slate-400">24-Hour Net Inflow / Outflow:</span>
              <span className={holder.change24hPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {holder.change24hPercent >= 0 ? '+' : ''}{holder.change24hPercent}%
              </span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-slate-400">Last Active Timestamp:</span>
              <span className="text-slate-300">{new Date(holder.lastActiveTimestamp).toUTCString()}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-300">
            <strong>Analyst Note:</strong> This address is indexed in the real-time whale radar table. Movements above 50,000 {token.symbol} trigger automated on-chain alerts.
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
