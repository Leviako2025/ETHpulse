import React from 'react';
import { Layers, Search, Radio, Pause, Play, ChevronDown, ExternalLink, Wallet } from 'lucide-react';
import { TokenProfile } from '../types/token';

export type ActiveTab = 
  | 'trading'
  | 'dashboard'
  | 'rewards'
  | 'admin'
  | 'market' 
  | 'wallets' 
  | 'transactions' 
  | 'contract' 
  | 'relationships' 
  | 'sql' 
  | 'schema';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  selectedToken: TokenProfile;
  onOpenTokenSelector: () => void;
  currentBlock: number;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  gasPriceGwei: number;
  walletAddress: string;
  onOpenWalletModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  selectedToken,
  onOpenTokenSelector,
  currentBlock,
  isStreaming,
  onToggleStreaming,
  gasPriceGwei,
  walletAddress,
  onOpenWalletModal
}) => {
  const navTabs: { id: ActiveTab; label: string }[] = [
    { id: 'trading', label: 'Live Trading' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'rewards', label: 'CT Rewards' },
    { id: 'admin', label: 'Admin' },
    { id: 'market', label: 'Live Market' },
    { id: 'wallets', label: 'Wallets & Whales' },
    { id: 'transactions', label: 'Live Transfers' },
    { id: 'contract', label: 'Contract & Safety' },
    { id: 'relationships', label: 'On-chain Flow' },
    { id: 'sql', label: 'SQL Studio' },
    { id: 'schema', label: 'Schema' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Wordmark & Network status */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white block leading-tight">
                EtherPulse
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Ethereum Mainnet · Block #{currentBlock.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (Single line) */}
          <nav className="hidden lg:flex items-center gap-1">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Live stream control & Token Switcher */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Live stream pause/play */}
            <button
              onClick={onToggleStreaming}
              title={isStreaming ? 'Pause live block feed' : 'Resume live block feed'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors border ${
                isStreaming
                  ? 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40'
                  : 'border-amber-500/30 text-amber-400 bg-amber-950/20 hover:bg-amber-950/40'
              }`}
            >
              {isStreaming ? (
                <>
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">LIVE</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">PAUSED</span>
                </>
              )}
            </button>

            {/* Gas price */}
            <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500">Gas:</span>
              <span className="text-slate-200">{gasPriceGwei} Gwei</span>
            </div>

            {/* Wallet Button */}
            <button
              onClick={onOpenWalletModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-white bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 rounded-lg transition-colors whitespace-nowrap shadow-xs"
              title="Open Wallet & Demo Faucet"
            >
              <Wallet className="w-3.5 h-3.5 text-indigo-400" />
              <span>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
            </button>

            {/* Token Selector Button */}
            <button
              onClick={onOpenTokenSelector}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              <div className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px] font-bold">
                {selectedToken.symbol.slice(0, 1)}
              </div>
              <span>{selectedToken.symbol}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-800/80 -mx-4 px-4 scrollbar-none">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
