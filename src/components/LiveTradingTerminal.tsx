import React, { useState, useEffect, useMemo } from 'react';
import { 
  TradingPair, TradeOrder, UserPortfolio, OrderType, OrderSide, OrderBookEntry 
} from '../types/token';
import { TRADING_PAIRS } from '../data/tokens';
import { 
  TrendingUp, TrendingDown, ArrowDownUp, RefreshCw, Zap, Clock, 
  CheckCircle2, XCircle, AlertCircle, Sparkles, Download, Layers, ShieldCheck, ExternalLink, Settings2 
} from 'lucide-react';

interface LiveTradingTerminalProps {
  currentBlock: number;
  portfolio: UserPortfolio;
  onExecuteTrade: (order: Omit<TradeOrder, 'id' | 'timestamp' | 'txHash' | 'blockNumber'>) => { success: boolean; message: string };
  openOrders: TradeOrder[];
  onCancelOrder: (orderId: string) => void;
  tradeHistory: TradeOrder[];
  onOpenWalletModal: () => void;
}

export const LiveTradingTerminal: React.FC<LiveTradingTerminalProps> = ({
  currentBlock,
  portfolio,
  onExecuteTrade,
  openOrders,
  onCancelOrder,
  tradeHistory,
  onOpenWalletModal
}) => {
  const [selectedPairId, setSelectedPairId] = useState<string>('CT/ETH');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [orderSide, setOrderSide] = useState<OrderSide>('BUY');
  const [payAmount, setPayAmount] = useState<string>('');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [slippage, setSlippage] = useState<number>(0.5); // 0.5%
  const [activeBottomTab, setActiveBottomTab] = useState<'open_orders' | 'history' | 'portfolio'>('open_orders');
  const [executionMessage, setExecutionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const selectedPair = useMemo(() => {
    return TRADING_PAIRS.find((p) => p.id === selectedPairId) || TRADING_PAIRS[0];
  }, [selectedPairId]);

  // Set default limit price when pair changes or user toggles limit order
  useEffect(() => {
    if (orderType === 'LIMIT') {
      setLimitPrice(String(selectedPair.currentPrice));
    }
  }, [selectedPair, orderType]);

  // Available balance for current trade side
  const availableBalance = useMemo(() => {
    if (orderSide === 'BUY') {
      // Buying base token with quote token
      if (selectedPair.quoteSymbol === 'ETH') return portfolio.demoEthBalance;
      if (selectedPair.quoteSymbol === 'USDT') return portfolio.demoUsdtBalance;
      return 0;
    } else {
      // Selling base token
      if (selectedPair.baseSymbol === 'CT') return portfolio.demoCtBalance;
      if (selectedPair.baseSymbol === 'ETH') return portfolio.demoEthBalance;
      return portfolio.otherTokenBalances[selectedPair.baseSymbol] || 0;
    }
  }, [orderSide, selectedPair, portfolio]);

  // Calculated receive amount
  const payNum = parseFloat(payAmount) || 0;
  const executionPrice = orderType === 'LIMIT' && parseFloat(limitPrice) > 0 ? parseFloat(limitPrice) : selectedPair.currentPrice;

  const receiveAmount = useMemo(() => {
    if (!payNum || payNum <= 0 || executionPrice <= 0) return 0;
    if (orderSide === 'BUY') {
      // Paying quote (ETH/USDT) to receive base (CT/UNI/etc)
      return payNum / executionPrice;
    } else {
      // Selling base to receive quote
      return payNum * executionPrice;
    }
  }, [payNum, executionPrice, orderSide]);

  // Fee calculation (with 25% CoreToken discount)
  const isCtFeeDiscountActive = portfolio.demoCtBalance >= 500;
  const feeDiscountPct = isCtFeeDiscountActive ? 25 : 0;
  const standardFeeRate = selectedPair.feeTierPercent / 100; // e.g. 0.003
  const effectiveFeeRate = standardFeeRate * (1 - feeDiscountPct / 100);
  const estimatedFee = payNum * effectiveFeeRate;

  // Generate synthetic dynamic order book around current price
  const orderBook = useMemo(() => {
    const cp = selectedPair.currentPrice;
    const isSmall = cp < 0.01;
    const spreadPct = 0.0015; // 0.15%

    const asks: OrderBookEntry[] = [];
    const bids: OrderBookEntry[] = [];

    // Asks (Sell orders above market price)
    for (let i = 5; i >= 1; i--) {
      const price = cp * (1 + (spreadPct * i));
      const size = Math.round((500 + i * 420) * (selectedPair.baseSymbol === 'PEPE' ? 500000 : 1));
      asks.push({ price, size, total: size * price, side: 'ASK' });
    }

    // Bids (Buy orders below market price)
    for (let i = 1; i <= 5; i++) {
      const price = cp * (1 - (spreadPct * i));
      const size = Math.round((600 + i * 380) * (selectedPair.baseSymbol === 'PEPE' ? 500000 : 1));
      bids.push({ price, size, total: size * price, side: 'BID' });
    }

    return { asks, bids, spread: cp * spreadPct * 2 };
  }, [selectedPair]);

  // Quick percentage buttons
  const handleQuickPercent = (pct: number) => {
    const calculated = (availableBalance * pct) / 100;
    setPayAmount(calculated > 0 ? calculated.toFixed(orderSide === 'BUY' && selectedPair.quoteSymbol === 'ETH' ? 4 : 2) : '');
    setExecutionMessage(null);
  };

  // Submit Order
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setExecutionMessage(null);

    if (payNum <= 0) {
      setExecutionMessage({ text: 'Please enter a valid trade amount greater than 0.', type: 'error' });
      return;
    }

    if (payNum > availableBalance) {
      setExecutionMessage({ 
        text: `Insufficient balance. Available: ${availableBalance.toLocaleString()} ${orderSide === 'BUY' ? selectedPair.quoteSymbol : selectedPair.baseSymbol}.`, 
        type: 'error' 
      });
      return;
    }

    if (orderType === 'LIMIT' && (!parseFloat(limitPrice) || parseFloat(limitPrice) <= 0)) {
      setExecutionMessage({ text: 'Please specify a valid limit trigger price.', type: 'error' });
      return;
    }

    const tradeOrderPayload: Omit<TradeOrder, 'id' | 'timestamp' | 'txHash' | 'blockNumber'> = {
      pair: selectedPair.id,
      type: orderType,
      side: orderSide,
      price: executionPrice,
      targetPrice: orderType === 'LIMIT' ? parseFloat(limitPrice) : undefined,
      amount: orderSide === 'BUY' ? receiveAmount : payNum,
      totalCostEth: orderSide === 'BUY' && selectedPair.quoteSymbol === 'ETH' ? payNum : payNum * executionPrice,
      totalCostUsd: (orderSide === 'BUY' && selectedPair.quoteSymbol === 'ETH' ? payNum : payNum * executionPrice) * 3142.5,
      feeDiscountPercent: feeDiscountPct,
      feeAmount: estimatedFee,
      status: orderType === 'MARKET' ? 'FILLED' : 'OPEN',
      slippageTolerancePercent: slippage
    };

    const result = onExecuteTrade(tradeOrderPayload);
    if (result.success) {
      setExecutionMessage({ text: result.message, type: 'success' });
      setPayAmount('');
    } else {
      setExecutionMessage({ text: result.message, type: 'error' });
    }
  };

  const exportTradeHistoryCsv = () => {
    const header = 'id,timestamp,pair,type,side,price,amount,totalCostEth,status,txHash\n';
    const rows = tradeHistory.map((t) => 
      `${t.id},${new Date(t.timestamp).toISOString()},${t.pair},${t.type},${t.side},${t.price},${t.amount},${t.totalCostEth},${t.status},${t.txHash}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EtherPulse_Trade_Ledger_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Trading Pair Strip & Ticker Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Pair selector pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 lg:pb-0">
            {TRADING_PAIRS.map((pair) => {
              const isSelected = pair.id === selectedPair.id;
              return (
                <button
                  key={pair.id}
                  onClick={() => {
                    setSelectedPairId(pair.id);
                    setExecutionMessage(null);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold whitespace-nowrap transition-colors border ${
                    isSelected
                      ? 'bg-indigo-600/30 text-white border-indigo-500/60 shadow-xs'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span className="font-bold text-white">{pair.id}</span>
                  <span className={pair.priceChange24h >= 0 ? 'text-emerald-400 text-[11px]' : 'text-rose-400 text-[11px]'}>
                    {pair.priceChange24h >= 0 ? '+' : ''}{pair.priceChange24h}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* CoreToken Utility Badge & Wallet trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-950/50 border border-indigo-500/30 text-xs font-mono text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>CT Fee Discount: -25% Active</span>
            </div>

            <button
              onClick={onOpenWalletModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg transition-colors border border-slate-700"
            >
              <span>Demo Portfolio</span>
            </button>
          </div>
        </div>

        {/* Selected Pair Detail Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs font-mono">
          <div>
            <span className="text-[11px] text-slate-500 block">Current Market Price</span>
            <span className="text-base font-bold text-white tabular-nums mt-0.5 block">
              {selectedPair.currentPrice < 0.001 ? selectedPair.currentPrice.toFixed(9) : selectedPair.currentPrice.toFixed(6)} {selectedPair.quoteSymbol}
            </span>
            <span className="text-[10px] text-slate-400">≈ ${selectedPair.currentPriceUsd.toFixed(2)} USD</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 block">24h Price Change</span>
            <span className={`text-base font-bold tabular-nums mt-0.5 block ${selectedPair.priceChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {selectedPair.priceChange24h >= 0 ? '+' : ''}{selectedPair.priceChange24h}%
            </span>
            <span className="text-[10px] text-slate-400">Ethereum Mainnet</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 block">24h High</span>
            <span className="text-sm font-semibold text-slate-200 tabular-nums mt-0.5 block">
              {selectedPair.high24h < 0.001 ? selectedPair.high24h.toFixed(9) : selectedPair.high24h.toFixed(6)} {selectedPair.quoteSymbol}
            </span>
            <span className="text-[10px] text-slate-500">Peak execution</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 block">24h Low</span>
            <span className="text-sm font-semibold text-slate-200 tabular-nums mt-0.5 block">
              {selectedPair.low24h < 0.001 ? selectedPair.low24h.toFixed(9) : selectedPair.low24h.toFixed(6)} {selectedPair.quoteSymbol}
            </span>
            <span className="text-[10px] text-slate-500">Trough execution</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 block">24h Trading Volume</span>
            <span className="text-sm font-semibold text-indigo-300 tabular-nums mt-0.5 block">
              ${(selectedPair.volume24hUsd / 1e6).toFixed(1)}M USD
            </span>
            <span className="text-[10px] text-slate-500">Uniswap V3 Pool</span>
          </div>
        </div>
      </div>

      {/* Main Terminal Grid: Chart & Order Placement & Order Book */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Order Placement Terminal Panel (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-sm font-semibold text-white">Live DEX Order Placement</span>
            <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => {
                  setOrderType('MARKET');
                  setExecutionMessage(null);
                }}
                className={`px-2.5 py-1 rounded transition-colors ${
                  orderType === 'MARKET' ? 'bg-indigo-600/30 text-indigo-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Market
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrderType('LIMIT');
                  setExecutionMessage(null);
                }}
                className={`px-2.5 py-1 rounded transition-colors ${
                  orderType === 'LIMIT' ? 'bg-indigo-600/30 text-indigo-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Limit
              </button>
            </div>
          </div>

          {/* Buy / Sell Tabs */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono font-semibold">
            <button
              type="button"
              onClick={() => {
                setOrderSide('BUY');
                setExecutionMessage(null);
              }}
              className={`py-2 rounded-lg transition-colors border ${
                orderSide === 'BUY'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Buy {selectedPair.baseSymbol}
            </button>
            <button
              type="button"
              onClick={() => {
                setOrderSide('SELL');
                setExecutionMessage(null);
              }}
              className={`py-2 rounded-lg transition-colors border ${
                orderSide === 'SELL'
                  ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Sell {selectedPair.baseSymbol}
            </button>
          </div>

          <form onSubmit={handleSubmitOrder} className="space-y-4 text-xs font-mono">
            {/* Limit Price Input if Limit Order */}
            {orderType === 'LIMIT' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-400">Limit Trigger Price:</label>
                  <button
                    type="button"
                    onClick={() => setLimitPrice(String(selectedPair.currentPrice))}
                    className="text-[10px] text-indigo-400 hover:underline"
                  >
                    Current Market Price
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    placeholder="0.0"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono placeholder-slate-600 focus:outline-hidden focus:border-indigo-500"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 text-xs">
                    {selectedPair.quoteSymbol}
                  </span>
                </div>
              </div>
            )}

            {/* Pay Amount Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-400">
                  {orderSide === 'BUY' ? `Pay with ${selectedPair.quoteSymbol}:` : `Sell ${selectedPair.baseSymbol}:`}
                </label>
                <span className="text-[11px] text-slate-400">
                  Balance: <strong className="text-white tabular-nums">{availableBalance.toLocaleString()} {orderSide === 'BUY' ? selectedPair.quoteSymbol : selectedPair.baseSymbol}</strong>
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={payAmount}
                  onChange={(e) => {
                    setPayAmount(e.target.value);
                    setExecutionMessage(null);
                  }}
                  placeholder="0.0"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono placeholder-slate-600 focus:outline-hidden focus:border-indigo-500"
                />
                <span className="absolute right-3 top-2 text-slate-500 text-xs">
                  {orderSide === 'BUY' ? selectedPair.quoteSymbol : selectedPair.baseSymbol}
                </span>
              </div>

              {/* Quick % buttons */}
              <div className="flex gap-1.5 mt-2">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    type="button"
                    key={pct}
                    onClick={() => handleQuickPercent(pct)}
                    className="flex-1 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-400 hover:text-white transition-colors"
                  >
                    {pct === 100 ? 'MAX' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Receive Amount preview */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-400">
                  {orderSide === 'BUY' ? `Estimated Receive (${selectedPair.baseSymbol}):` : `Estimated Receive (${selectedPair.quoteSymbol}):`}
                </label>
              </div>
              <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-sm font-bold text-white flex justify-between items-center">
                <span className="tabular-nums">
                  {receiveAmount > 0 
                    ? (receiveAmount < 0.0001 ? receiveAmount.toFixed(8) : receiveAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })) 
                    : '0.00'}
                </span>
                <span className="text-xs text-indigo-400">
                  {orderSide === 'BUY' ? selectedPair.baseSymbol : selectedPair.quoteSymbol}
                </span>
              </div>
            </div>

            {/* Execution Parameter Details */}
            <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/80 space-y-1.5 text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>Execution Rate:</span>
                <span className="text-slate-200 tabular-nums">
                  1 {selectedPair.baseSymbol} ≈ {selectedPair.currentPrice < 0.001 ? selectedPair.currentPrice.toFixed(9) : selectedPair.currentPrice.toFixed(6)} {selectedPair.quoteSymbol}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>Slippage Tolerance:</span>
                <div className="flex gap-1">
                  {[0.1, 0.5, 1.0].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setSlippage(s)}
                      className={`px-1.5 py-0.2 rounded text-[10px] ${
                        slippage === s ? 'bg-indigo-600/40 text-white font-semibold' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {s}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <span>Price Impact:</span>
                <span className="text-emerald-400">&lt; 0.05%</span>
              </div>

              <div className="flex justify-between">
                <span>Protocol Fee:</span>
                <span className="text-slate-200 tabular-nums">
                  {estimatedFee.toFixed(5)} {orderSide === 'BUY' ? selectedPair.quoteSymbol : selectedPair.baseSymbol}{' '}
                  <span className="text-cyan-400 font-semibold">(-25% CT Discount)</span>
                </span>
              </div>

              <div className="flex justify-between">
                <span>Simulated Network Gas:</span>
                <span className="text-slate-300">~115,000 gas (0.0018 ETH)</span>
              </div>
            </div>

            {/* Messages */}
            {executionMessage && (
              <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                executionMessage.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}>
                {executionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{executionMessage.text}</span>
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              className={`w-full py-2.5 rounded-lg text-xs font-semibold font-mono transition-colors shadow-xs ${
                orderSide === 'BUY'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
            >
              {orderType === 'MARKET' ? `Execute Market ${orderSide}` : `Place Limit ${orderSide} Order`}
            </button>
          </form>

          {/* Non-Custodial Disclaimer */}
          <div className="text-[10px] text-slate-500 text-center leading-relaxed">
            Non-custodial demo execution environment. Trades simulate Uniswap V3 concentrated liquidity routers.
          </div>
        </div>

        {/* Live Order Book & Trade Depth (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-sm font-semibold text-white">Live AMM Order Book</span>
              <span className="text-xs font-mono text-slate-400">Spread: {orderBook.spread < 0.001 ? orderBook.spread.toFixed(8) : orderBook.spread.toFixed(5)}</span>
            </div>

            {/* Asks (Sell orders) */}
            <div className="space-y-1 mt-3 text-xs font-mono">
              <div className="flex justify-between text-[10px] text-slate-500 uppercase px-1">
                <span>Price ({selectedPair.quoteSymbol})</span>
                <span>Size ({selectedPair.baseSymbol})</span>
                <span>Total</span>
              </div>

              {orderBook.asks.map((ask, idx) => (
                <div key={idx} className="relative flex justify-between py-1 px-1.5 rounded overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-rose-500/10" 
                    style={{ width: `${(ask.size / 3000) * 100}%` }} 
                  />
                  <span className="relative text-rose-400 font-semibold tabular-nums">
                    {ask.price < 0.001 ? ask.price.toFixed(8) : ask.price.toFixed(5)}
                  </span>
                  <span className="relative text-slate-300 tabular-nums">
                    {ask.size.toLocaleString()}
                  </span>
                  <span className="relative text-slate-500 tabular-nums">
                    {ask.total < 10 ? ask.total.toFixed(4) : ask.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Current Market Price Midline */}
            <div className="my-2.5 py-1.5 px-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center text-xs font-mono">
              <span className="text-white font-bold tabular-nums">
                {selectedPair.currentPrice < 0.001 ? selectedPair.currentPrice.toFixed(8) : selectedPair.currentPrice.toFixed(5)} {selectedPair.quoteSymbol}
              </span>
              <span className="text-[11px] text-slate-400">
                ≈ ${selectedPair.currentPriceUsd.toFixed(2)}
              </span>
            </div>

            {/* Bids (Buy orders) */}
            <div className="space-y-1 text-xs font-mono">
              {orderBook.bids.map((bid, idx) => (
                <div key={idx} className="relative flex justify-between py-1 px-1.5 rounded overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-emerald-500/10" 
                    style={{ width: `${(bid.size / 3000) * 100}%` }} 
                  />
                  <span className="relative text-emerald-400 font-semibold tabular-nums">
                    {bid.price < 0.001 ? bid.price.toFixed(8) : bid.price.toFixed(5)}
                  </span>
                  <span className="relative text-slate-300 tabular-nums">
                    {bid.size.toLocaleString()}
                  </span>
                  <span className="relative text-slate-500 tabular-nums">
                    {bid.total < 10 ? bid.total.toFixed(4) : bid.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
            Liquidity Vault: {selectedPair.poolAddress.slice(0, 8)}...{selectedPair.poolAddress.slice(-6)}
          </div>
        </div>

        {/* Live Recent Market Swaps Stream (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-sm font-semibold text-white">Live DEX Trade Stream</span>
              <span className="text-xs font-mono text-emerald-400 animate-pulse">● Live Mainnet</span>
            </div>

            <div className="space-y-2 mt-3 max-h-[340px] overflow-y-auto pr-1">
              {tradeHistory.slice(0, 7).map((trade, i) => (
                <div key={trade.id} className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 text-xs font-mono flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold ${trade.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trade.side}
                      </span>
                      <span className="text-white font-semibold">{trade.pair}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {new Date(trade.timestamp).toLocaleTimeString()} · #{trade.blockNumber}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-200 block tabular-nums">
                      {trade.amount.toLocaleString()} {trade.pair.split('/')[0]}
                    </span>
                    <span className="text-[11px] text-slate-400 tabular-nums block">
                      @{trade.price < 0.001 ? trade.price.toFixed(7) : trade.price.toFixed(4)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-500 font-mono">
            <span>Aggregated Swaps</span>
            <span>Block #{currentBlock.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Bottom Panel: Open Limit Orders, Trade History, and User Portfolio Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/40 px-4">
          <div className="flex">
            <button
              onClick={() => setActiveBottomTab('open_orders')}
              className={`px-4 py-3 text-xs font-semibold font-mono border-b-2 transition-colors ${
                activeBottomTab === 'open_orders'
                  ? 'border-indigo-500 text-white bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Open Limit Orders ({openOrders.length})
            </button>
            <button
              onClick={() => setActiveBottomTab('history')}
              className={`px-4 py-3 text-xs font-semibold font-mono border-b-2 transition-colors ${
                activeBottomTab === 'history'
                  ? 'border-indigo-500 text-white bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Filled Trade Ledger ({tradeHistory.length})
            </button>
            <button
              onClick={() => setActiveBottomTab('portfolio')}
              className={`px-4 py-3 text-xs font-semibold font-mono border-b-2 transition-colors ${
                activeBottomTab === 'portfolio'
                  ? 'border-indigo-500 text-white bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Demo Portfolio Assets
            </button>
          </div>

          {activeBottomTab === 'history' && (
            <button
              onClick={exportTradeHistoryCsv}
              className="flex items-center gap-1.5 px-2.5 py-1 text-slate-400 hover:text-white text-xs font-mono rounded hover:bg-slate-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>

        {/* Tab 1: Open Orders */}
        {activeBottomTab === 'open_orders' && (
          <div className="overflow-x-auto">
            {openOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-mono">
                No active limit orders. Place a Limit Buy or Sell above to trigger automated execution when market prices hit your target.
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Order ID</th>
                    <th className="py-2.5 px-4">Side & Pair</th>
                    <th className="py-2.5 px-4 text-right">Target Limit Price</th>
                    <th className="py-2.5 px-4 text-right">Current Market Price</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                    <th className="py-2.5 px-4 text-right">Status</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {openOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 text-slate-400">#{ord.id.slice(-6)}</td>
                      <td className="py-2.5 px-4">
                        <span className={`font-semibold mr-1.5 ${ord.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {ord.side}
                        </span>
                        <span className="text-white font-medium">{ord.pair}</span>
                      </td>
                      <td className="py-2.5 px-4 text-right text-indigo-300 font-semibold tabular-nums">
                        {ord.targetPrice}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-200 tabular-nums">
                        {selectedPair.currentPrice}
                      </td>
                      <td className="py-2.5 px-4 text-right text-white tabular-nums">
                        {ord.amount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="text-amber-400 text-[11px] font-semibold">PENDING TRIGGER</span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => onCancelOrder(ord.id)}
                          className="px-2 py-1 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-[10px] rounded transition-colors"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Filled Trade History */}
        {activeBottomTab === 'history' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Timestamp & Tx</th>
                  <th className="py-2.5 px-4">Action & Pair</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4 text-right">Execution Price</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4 text-right">Total Cost</th>
                  <th className="py-2.5 px-4 text-right">Fee Discount</th>
                  <th className="py-2.5 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {tradeHistory.map((trade) => (
                  <tr key={trade.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4">
                      <span className="text-white block">{new Date(trade.timestamp).toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{trade.txHash.slice(0, 10)}...</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`font-semibold mr-1.5 ${trade.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trade.side}
                      </span>
                      <span className="text-white font-medium">{trade.pair}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-[11px] text-slate-400">{trade.type}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-white tabular-nums">
                      {trade.price < 0.001 ? trade.price.toFixed(8) : trade.price.toFixed(5)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-200 tabular-nums">
                      {trade.amount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right text-emerald-400 font-semibold tabular-nums">
                      {trade.totalCostEth.toFixed(4)} ETH (${trade.totalCostUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                    </td>
                    <td className="py-2.5 px-4 text-right text-cyan-400 font-semibold tabular-nums">
                      -{trade.feeDiscountPercent}% CT
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <a
                        href={`https://etherscan.io/tx/${trade.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-white"
                        title="View on Etherscan"
                      >
                        <ExternalLink className="w-3.5 h-3.5 inline" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Demo Portfolio */}
        {activeBottomTab === 'portfolio' && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-500 block">Total Portfolio USD</span>
                <span className="text-base font-bold text-white mt-0.5 block tabular-nums">
                  ${(portfolio.demoEthBalance * 3142.5 + portfolio.demoCtBalance * 2.48 + portfolio.demoUsdtBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-500 block">Realized Trading PnL</span>
                <span className="text-base font-bold text-emerald-400 mt-0.5 block tabular-nums">
                  +${portfolio.realizedPnlUsd.toFixed(2)} (+{portfolio.realizedPnlPercent}%)
                </span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-500 block">Total Trades Executed</span>
                <span className="text-base font-bold text-indigo-300 mt-0.5 block tabular-nums">
                  {portfolio.totalTradeCount} Swaps
                </span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-500 block">Total Trade Volume</span>
                <span className="text-base font-bold text-slate-200 mt-0.5 block tabular-nums">
                  ${portfolio.totalVolumeUsd.toLocaleString()} USD
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={onOpenWalletModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors"
              >
                Open Full Asset Ledger & Send/Receive
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
