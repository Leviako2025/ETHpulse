import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, ArrowUpRight, ArrowDownLeft, ShieldCheck, Wallet, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { UserPortfolio } from '../types/token';

interface UserWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  isMetaMaskConnected: boolean;
  onConnectMetaMask: () => void;
  portfolio: UserPortfolio;
  onRefillFaucet: () => void;
  onSendTokens: (asset: string, recipient: string, amount: number) => { success: boolean; message: string };
}

export const UserWalletModal: React.FC<UserWalletModalProps> = ({
  isOpen,
  onClose,
  walletAddress,
  isMetaMaskConnected,
  onConnectMetaMask,
  portfolio,
  onRefillFaucet,
  onSendTokens
}) => {
  const [activeTab, setActiveTab] = useState<'balances' | 'send' | 'receive'>('balances');
  const [copied, setCopied] = useState(false);
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetSuccess, setFaucetSuccess] = useState(false);

  // Send form state
  const [sendAsset, setSendAsset] = useState<'ETH' | 'CT' | 'USDT'>('ETH');
  const [sendRecipient, setSendRecipient] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFaucetClick = () => {
    setFaucetLoading(true);
    setTimeout(() => {
      onRefillFaucet();
      setFaucetLoading(false);
      setFaucetSuccess(true);
      setTimeout(() => setFaucetSuccess(false), 3000);
    }, 600);
  };

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSendError(null);
    setSendSuccess(null);

    const amountNum = parseFloat(sendAmount);
    if (!amountNum || amountNum <= 0) {
      setSendError('Please enter a valid transfer amount greater than 0.');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(sendRecipient.trim())) {
      setSendError('Invalid Ethereum address format (must start with 0x and be 42 characters).');
      return;
    }

    // Check balance
    let currentBalance = 0;
    if (sendAsset === 'ETH') currentBalance = portfolio.demoEthBalance;
    else if (sendAsset === 'CT') currentBalance = portfolio.demoCtBalance;
    else if (sendAsset === 'USDT') currentBalance = portfolio.demoUsdtBalance;

    if (amountNum > currentBalance) {
      setSendError(`Insufficient balance. You have ${currentBalance.toLocaleString()} ${sendAsset}.`);
      return;
    }

    const res = onSendTokens(sendAsset, sendRecipient.trim(), amountNum);
    if (res.success) {
      setSendSuccess(res.message);
      setSendAmount('');
      setSendRecipient('');
    } else {
      setSendError(res.message);
    }
  };

  const getAvailableBalance = (asset: 'ETH' | 'CT' | 'USDT') => {
    if (asset === 'ETH') return portfolio.demoEthBalance;
    if (asset === 'CT') return portfolio.demoCtBalance;
    return portfolio.demoUsdtBalance;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">EtherPulse User Wallet</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                  {isMetaMaskConnected ? 'MetaMask' : 'Simulated Web3'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">Ethereum Mainnet / Sepolia</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Address Card & Faucet Action */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-slate-500 font-mono block">Connected Address:</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-200 font-mono font-medium">
                {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
              </span>
              <button
                onClick={copyAddress}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                title="Copy Address"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={`https://etherscan.io/address/${walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                title="View on Etherscan"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Testnet Faucet Button */}
          <button
            onClick={handleFaucetClick}
            disabled={faucetLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${faucetLoading ? 'animate-spin' : ''}`} />
            <span>{faucetSuccess ? 'Tokens Added!' : 'Request Faucet Tokens'}</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30">
          <button
            onClick={() => setActiveTab('balances')}
            className={`flex-1 py-2.5 text-xs font-semibold font-mono border-b-2 transition-colors ${
              activeTab === 'balances' ? 'border-indigo-500 text-white bg-slate-900' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Portfolio Balances
          </button>
          <button
            onClick={() => setActiveTab('send')}
            className={`flex-1 py-2.5 text-xs font-semibold font-mono border-b-2 transition-colors ${
              activeTab === 'send' ? 'border-indigo-500 text-white bg-slate-900' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Send Assets
          </button>
          <button
            onClick={() => setActiveTab('receive')}
            className={`flex-1 py-2.5 text-xs font-semibold font-mono border-b-2 transition-colors ${
              activeTab === 'receive' ? 'border-indigo-500 text-white bg-slate-900' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Receive Address
          </button>
        </div>

        {/* Tab 1: Balances */}
        {activeTab === 'balances' && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-500 font-mono block">Demo ETH</span>
                <span className="text-base font-bold font-mono text-white mt-0.5 block tabular-nums">
                  {portfolio.demoEthBalance.toFixed(4)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                  ≈ ${(portfolio.demoEthBalance * 3142.5).toFixed(2)}
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-500 font-mono block">CoreToken (CT)</span>
                <span className="text-base font-bold font-mono text-cyan-400 mt-0.5 block tabular-nums">
                  {portfolio.demoCtBalance.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                  ≈ ${(portfolio.demoCtBalance * 2.48).toFixed(2)}
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-500 font-mono block">Demo USDT</span>
                <span className="text-base font-bold font-mono text-emerald-400 mt-0.5 block tabular-nums">
                  {portfolio.demoUsdtBalance.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                  ≈ ${portfolio.demoUsdtBalance.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Other Tokens */}
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-slate-950/40 text-[11px] font-mono text-slate-400 border-b border-slate-800">
                Holding Assets (Testnet)
              </div>
              <div className="divide-y divide-slate-800/60 text-xs font-mono">
                {Object.entries(portfolio.otherTokenBalances).map(([sym, bal]) => (
                  <div key={sym} className="flex justify-between p-3 hover:bg-slate-800/30">
                    <span className="text-white font-medium">{sym}</span>
                    <span className="text-slate-300 tabular-nums">{bal.toLocaleString()} {sym}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-lg text-xs text-indigo-300">
              <div className="flex items-center gap-1.5 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>CoreToken (CT) Utility Perks:</span>
              </div>
              <p className="mt-1 text-[11px] text-indigo-200/80 leading-relaxed">
                Holding CT grants a 25% discount on all DEX trade execution fees and unlocks automated limit order execution.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Send */}
        {activeTab === 'send' && (
          <form onSubmit={handleSendSubmit} className="p-5 space-y-4 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">Select Asset to Send:</label>
              <div className="flex gap-2">
                {(['ETH', 'CT', 'USDT'] as const).map((ast) => (
                  <button
                    type="button"
                    key={ast}
                    onClick={() => {
                      setSendAsset(ast);
                      setSendError(null);
                    }}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                      sendAsset === ast
                        ? 'bg-indigo-600/30 border-indigo-500/50 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ast}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-400">Recipient Address (0x...):</label>
                <button
                  type="button"
                  onClick={() => setSendRecipient('0x1a9C8182C09F50C8318d769245beA52c32BE35BC')}
                  className="text-[10px] text-indigo-400 hover:underline"
                >
                  Use Timelock Vault
                </button>
              </div>
              <input
                type="text"
                value={sendRecipient}
                onChange={(e) => {
                  setSendRecipient(e.target.value);
                  setSendError(null);
                }}
                placeholder="0x..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs placeholder-slate-600 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-400">Amount:</label>
                <span className="text-[11px] text-slate-400">
                  Available: <strong className="text-white tabular-nums">{getAvailableBalance(sendAsset).toLocaleString()} {sendAsset}</strong>
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={sendAmount}
                  onChange={(e) => {
                    setSendAmount(e.target.value);
                    setSendError(null);
                  }}
                  placeholder="0.0"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs placeholder-slate-600 focus:outline-hidden focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setSendAmount(String(getAvailableBalance(sendAsset)))}
                  className="absolute right-2 top-2 px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-indigo-300 rounded font-semibold"
                >
                  MAX
                </button>
              </div>
            </div>

            {sendError && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{sendError}</span>
              </div>
            )}

            {sendSuccess && (
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{sendSuccess}</span>
              </div>
            )}

            <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 flex justify-between">
              <span>Estimated Network Gas:</span>
              <span className="text-slate-300">~21,000 gas (0.00042 ETH)</span>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
            >
              Sign & Broadcast Demo Transfer
            </button>
          </form>
        )}

        {/* Tab 3: Receive */}
        {activeTab === 'receive' && (
          <div className="p-5 text-center space-y-4">
            <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 inline-block mx-auto">
              {/* QR visual mockup */}
              <div className="w-36 h-36 bg-white p-2 rounded-lg mx-auto flex items-center justify-center">
                <div className="w-full h-full border-4 border-slate-900 border-dashed rounded flex items-center justify-center text-slate-900 text-xs font-mono font-bold">
                  [ETH QR]
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-mono mt-3 block">
                Scan to receive ETH, CT, & ERC-20
              </span>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs font-mono select-all">
              {walletAddress}
            </div>

            <button
              onClick={copyAddress}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Address Copied' : 'Copy Wallet Address'}</span>
            </button>
          </div>
        )}

        {/* Safety Disclaimer */}
        <div className="px-6 py-3 bg-slate-950/90 border-t border-slate-800 text-[11px] text-slate-500 font-mono text-center">
          Notice: EtherPulse operates on simulated demo testnet balances. No real funds or blockchain gas required.
        </div>
      </div>
    </div>
  );
};
