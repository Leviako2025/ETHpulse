import React, { useState } from 'react';
import { TokenProfile, LiveTokenTransfer, TxActionType } from '../types/token';
import { 
  Play, Pause, FastForward, Filter, Radio, ExternalLink, ArrowRight, 
  ArrowUpRight, ArrowDownLeft, RefreshCw, Flame, PlusCircle, Check, Copy 
} from 'lucide-react';

interface TransactionMonitoringProps {
  token: TokenProfile;
  transfers: LiveTokenTransfer[];
  isStreaming: boolean;
  onToggleStreaming: () => void;
  speed: number;
  onSetSpeed: (speed: number) => void;
  onTriggerBlock: () => void;
  currentBlock: number;
  totalTxCount: number;
}

export const TransactionMonitoring: React.FC<TransactionMonitoringProps> = ({
  token,
  transfers,
  isStreaming,
  onToggleStreaming,
  speed,
  onSetSpeed,
  onTriggerBlock,
  currentBlock,
  totalTxCount
}) => {
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [whaleThreshold, setWhaleThreshold] = useState<number>(0); // 0, 10000, 50000, 250000
  const [copiedTx, setCopiedTx] = useState<string | null>(null);

  const copyTx = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedTx(hash);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  const filteredTransfers = transfers.filter((tx) => {
    const matchesAction = actionFilter === 'ALL' || tx.action === actionFilter;
    const matchesWhale = tx.valueUsd >= whaleThreshold;
    return matchesAction && matchesWhale;
  });

  const getActionBadge = (action: TxActionType) => {
    switch (action) {
      case 'BUY':
        return <span className="text-emerald-400 font-bold">BUY</span>;
      case 'SELL':
        return <span className="text-rose-400 font-bold">SELL</span>;
      case 'TRANSFER':
        return <span className="text-slate-300 font-medium">TRANSFER</span>;
      case 'MINT':
        return <span className="text-indigo-400 font-bold">MINT</span>;
      case 'BURN':
        return <span className="text-amber-400 font-bold">BURN</span>;
      case 'ADD_LIQUIDITY':
        return <span className="text-cyan-400 font-bold">+LIQUIDITY</span>;
      case 'REMOVE_LIQUIDITY':
        return <span className="text-purple-400 font-bold">-LIQUIDITY</span>;
      default:
        return <span className="text-slate-400">{action}</span>;
    }
  };

  const totalTransferVolumeUsd = transfers.reduce((acc, t) => acc + t.valueUsd, 0);

  return (
    <div className="space-y-6">
      {/* Stream Controls & Metrics Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-white">Live Ethereum Block Stream</span>
              <span className="text-xs text-slate-400 font-mono">Slot time ~12s</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Listening to ERC-20 <code className="text-indigo-300 font-mono">Transfer(from, to, value)</code> and Uniswap V3 swap events on mainnet
            </p>
          </div>

          {/* Interactive Stream Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Play / Pause */}
            <button
              onClick={onToggleStreaming}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-colors ${
                isStreaming
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/60'
                  : 'bg-amber-950/60 text-amber-300 border border-amber-500/30 hover:bg-amber-900/60'
              }`}
            >
              {isStreaming ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Feed</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume Feed</span>
                </>
              )}
            </button>

            {/* Speed Multiplier */}
            <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-500 font-mono px-2">Speed:</span>
              {[1, 2, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => onSetSpeed(s)}
                  className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                    speed === s ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Instant Block Mine Button */}
            <button
              onClick={onTriggerBlock}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors border border-slate-700"
              title="Force ingest next simulated block transfer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ingest Block</span>
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800">
          <div>
            <span className="text-[11px] text-slate-500 font-mono block">Current Block Height</span>
            <span className="text-sm font-semibold font-mono text-white tabular-nums">#{currentBlock.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-mono block">Recent Ingested Txs</span>
            <span className="text-sm font-semibold font-mono text-white tabular-nums">{transfers.length} transfers</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-mono block">Recent Stream Volume</span>
            <span className="text-sm font-semibold font-mono text-emerald-400 tabular-nums">
              ${(totalTransferVolumeUsd / 1e6).toFixed(2)}M USD
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-mono block">Total Tracked Transfers</span>
            <span className="text-sm font-semibold font-mono text-indigo-400 tabular-nums">{totalTxCount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Live Transaction Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Action Filter:</span>
            <div className="flex items-center p-1 bg-slate-900 rounded-lg border border-slate-800 overflow-x-auto scrollbar-none">
              {['ALL', 'BUY', 'SELL', 'TRANSFER', 'ADD_LIQUIDITY', 'BURN'].map((act) => (
                <button
                  key={act}
                  onClick={() => setActionFilter(act)}
                  className={`px-2.5 py-1 text-xs font-mono rounded whitespace-nowrap transition-colors ${
                    actionFilter === act ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {act === 'ALL' ? 'All Txs' : act}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Whale Radar:</span>
            <div className="flex items-center p-1 bg-slate-900 rounded-lg border border-slate-800">
              {[
                { label: 'All Sizes', value: 0 },
                { label: '>$10k', value: 10000 },
                { label: '>$50k', value: 50000 },
                { label: '>$250k', value: 250000 }
              ].map((tier) => (
                <button
                  key={tier.value}
                  onClick={() => setWhaleThreshold(tier.value)}
                  className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                    whaleThreshold === tier.value ? 'bg-indigo-600/30 text-indigo-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transfers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-mono border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-6">Block / Hash</th>
                <th className="py-3 px-6">Action</th>
                <th className="py-3 px-6">From Entity</th>
                <th className="py-3 px-6">To Entity</th>
                <th className="py-3 px-6 text-right">Amount ({token.symbol})</th>
                <th className="py-3 px-6 text-right">USD Value</th>
                <th className="py-3 px-6 text-right">Gas Fee</th>
                <th className="py-3 px-6 text-center">Explorer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {filteredTransfers.map((tx) => (
                <tr key={tx.txHash} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-6">
                    <span className="text-slate-400 block text-[11px]">#{tx.blockNumber}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-slate-200 font-mono text-[11px]">
                        {tx.txHash.slice(0, 8)}...{tx.txHash.slice(-6)}
                      </span>
                      <button
                        onClick={() => copyTx(tx.txHash)}
                        className="text-slate-500 hover:text-slate-300"
                        title="Copy Tx Hash"
                      >
                        {copiedTx === tx.txHash ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  <td className="py-3 px-6">
                    {getActionBadge(tx.action)}
                    {tx.dexRouter && (
                      <span className="text-[10px] text-slate-500 block truncate max-w-[120px]">
                        via {tx.dexRouter}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-6">
                    <span className="text-white font-sans font-medium block truncate max-w-[160px]">
                      {tx.fromLabel || tx.fromEns || `${tx.fromAddress.slice(0, 6)}...${tx.fromAddress.slice(-4)}`}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {tx.fromAddress.slice(0, 8)}...
                    </span>
                  </td>

                  <td className="py-3 px-6">
                    <span className="text-white font-sans font-medium block truncate max-w-[160px]">
                      {tx.toLabel || tx.toEns || `${tx.toAddress.slice(0, 6)}...${tx.toAddress.slice(-4)}`}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {tx.toAddress.slice(0, 8)}...
                    </span>
                  </td>

                  <td className="py-3 px-6 text-right font-semibold text-white tabular-nums">
                    {tx.amountFormatted}
                  </td>

                  <td className="py-3 px-6 text-right tabular-nums">
                    <span className={`font-semibold ${tx.valueUsd >= 50000 ? 'text-amber-400' : 'text-slate-200'}`}>
                      ${tx.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>

                  <td className="py-3 px-6 text-right text-slate-400 tabular-nums">
                    <span>{tx.gasPriceGwei} Gwei</span>
                    <span className="text-[10px] text-slate-500 block">({tx.gasFeeEth} ETH)</span>
                  </td>

                  <td className="py-3 px-6 text-center">
                    <a
                      href={`https://etherscan.io/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-slate-400 hover:text-white"
                      title="View transaction on Etherscan"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
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
