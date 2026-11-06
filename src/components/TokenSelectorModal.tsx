import React, { useState } from 'react';
import { X, Check, Search, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
import { TokenProfile } from '../types/token';
import { SUPPORTED_TOKENS } from '../data/tokens';

interface TokenSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedToken: TokenProfile;
  onSelectToken: (token: TokenProfile) => void;
}

export const TokenSelectorModal: React.FC<TokenSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedToken,
  onSelectToken
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

  if (!isOpen) return null;

  const popularList = Object.values(SUPPORTED_TOKENS);
  const filteredTokens = popularList.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAddr = customAddress.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(cleanAddr)) {
      setCustomError('Invalid Ethereum address. Must be a 42-character hex address starting with 0x.');
      return;
    }

    // Check if it matches existing
    const existing = popularList.find((t) => t.address.toLowerCase() === cleanAddr.toLowerCase());
    if (existing) {
      onSelectToken(existing);
      onClose();
      return;
    }

    // Generate custom token profile
    const customToken: TokenProfile = {
      address: cleanAddr,
      name: `Custom Token (${cleanAddr.slice(0, 6)}...${cleanAddr.slice(-4)})`,
      symbol: `TOK-${cleanAddr.slice(2, 6).toUpperCase()}`,
      decimals: 18,
      totalSupply: '1000000000000000000000000',
      totalSupplyFormatted: '1,000,000 TOK',
      circulatingSupply: '800000000000000000000000',
      circulatingSupplyFormatted: '800,000 TOK',
      deployerAddress: '0x71a56bc22998a44d852a3b984180801249b6b92b',
      deploymentBlock: 19800450,
      deploymentDate: '2024-03-12 14:22:00 UTC',
      verified: true,
      compilerVersion: 'v0.8.24+commit.e11b9ed9',
      license: 'MIT',
      standard: 'ERC-20',
      hasPermit: true,
      isProxy: false,
      description: `Custom tracked ERC-20 contract initialized at on-chain address ${cleanAddr}. Real-time event filters and SQL metrics active.`,
      explorerUrl: `https://etherscan.io/token/${cleanAddr}`,
      currentPriceUsd: 1.25,
      currentPriceEth: 0.000398,
      priceChange1h: 0.15,
      priceChange24h: 2.45,
      priceChange7d: 5.6,
      high24h: 1.32,
      low24h: 1.18,
      marketCapUsd: 1000000,
      fdvUsd: 1250000,
      volume24hUsd: 245000,
      liquidityUsd: 180000,
      securityAudit: {
        buyTaxPercent: 0,
        sellTaxPercent: 0,
        isOwnershipRenounced: true,
        ownerAddress: '0x0000000000000000000000000000000000000000',
        isMintable: false,
        canBlacklist: false,
        canPauseTransfers: false,
        hasMaxTxAmount: false,
        safetyScore: 92,
        riskLevel: 'LOW',
        vulnerabilitiesFound: []
      },
      pools: [
        {
          dexName: 'Uniswap V3',
          poolAddress: `0x${cleanAddr.slice(2, 10)}9425000000000000000000000000000000000000`.slice(0, 42),
          pairSymbol: 'TOK / WETH (0.3%)',
          feeTierPercent: 0.3,
          liquidityUsd: 140000,
          volume24hUsd: 180000,
          tokenReserve: '112,000 TOK',
          ethReserve: '44.5 WETH'
        }
      ]
    };

    onSelectToken(customToken);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-white">Select ERC-20 Token</h3>
            <p className="text-xs text-slate-400">Choose a verified Ethereum token or enter custom contract</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, symbol, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Token List */}
        <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60 p-2">
          {filteredTokens.map((token) => {
            const isSelected = selectedToken.address.toLowerCase() === token.address.toLowerCase();
            return (
              <button
                key={token.address}
                onClick={() => {
                  onSelectToken(token);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                  isSelected ? 'bg-indigo-950/40 border border-indigo-500/30' : 'hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-300">
                    {token.symbol.slice(0, 3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{token.name}</span>
                      <span className="text-xs text-slate-400 font-mono">({token.symbol})</span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {token.address.slice(0, 6)}...{token.address.slice(-4)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-semibold text-white font-mono tabular-nums">
                    ${token.currentPriceUsd < 0.01 ? token.currentPriceUsd.toFixed(8) : token.currentPriceUsd.toFixed(2)}
                  </div>
                  <div className={`text-[11px] font-mono tabular-nums ${token.priceChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Contract Input */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Or Track Any Custom Ethereum ERC-20 Address
          </label>
          <form onSubmit={handleCustomSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="0x..."
              value={customAddress}
              onChange={(e) => {
                setCustomAddress(e.target.value);
                setCustomError(null);
              }}
              className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              Analyze Address
            </button>
          </form>
          {customError && (
            <p className="mt-2 text-xs text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{customError}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
