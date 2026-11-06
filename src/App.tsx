import React, { useState, useEffect, useCallback } from 'react';
import { TokenProfile, UserPortfolio, TradeOrder } from './types/token';
import { SUPPORTED_TOKENS, INITIAL_USER_PORTFOLIO, INITIAL_TRADE_HISTORY, TRADING_PAIRS } from './data/tokens';
import { useLiveBlockchainStream } from './hooks/useLiveBlockchainStream';
import { Header, ActiveTab } from './components/Header';
import { TokenOverviewBanner } from './components/TokenOverviewBanner';
import { TokenSelectorModal } from './components/TokenSelectorModal';
import { LiveTradingTerminal } from './components/LiveTradingTerminal';
import { UserWalletModal } from './components/UserWalletModal';
import { LiveMarketAnalytics } from './components/LiveMarketAnalytics';
import { WalletAnalytics } from './components/WalletAnalytics';
import { TransactionMonitoring } from './components/TransactionMonitoring';
import { SmartContractAnalytics } from './components/SmartContractAnalytics';
import { OnChainRelationships } from './components/OnChainRelationships';
import { SqlEngineStudio } from './components/SqlEngineStudio';
import { SchemaArchitectureGuide } from './components/SchemaArchitectureGuide';
import { MainDashboard } from './components/MainDashboard';
import { CTRewardsCenter } from './components/CTRewardsCenter';
import { AdminDashboard } from './components/AdminDashboard';
import { Layers, ExternalLink } from 'lucide-react';

export default function App() {
  const [selectedToken, setSelectedToken] = useState<TokenProfile>(SUPPORTED_TOKENS.CT || SUPPORTED_TOKENS.UNI);
  const [activeTab, setActiveTab] = useState<ActiveTab>('trading');
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState<boolean>(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);

  // User Web3 Demo Wallet State
  const [walletAddress, setWalletAddress] = useState<string>('0x71a56bc22998a44d852a3b984180801249b6b92b');
  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState<boolean>(false);

  // User Trading Portfolio State
  const [portfolio, setPortfolio] = useState<UserPortfolio>(INITIAL_USER_PORTFOLIO);

  // Active Open Limit Orders & Trade History
  const [openOrders, setOpenOrders] = useState<TradeOrder[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeOrder[]>(INITIAL_TRADE_HISTORY);

  // Live Blockchain Stream hook
  const {
    isStreaming,
    toggleStream,
    speed,
    setSpeed,
    currentBlock,
    currentPrice,
    priceChange24h,
    gasPriceGwei,
    transfers,
    candles,
    buyVolume24h,
    sellVolume24h,
    totalTxCount,
    triggerInstantBlock
  } = useLiveBlockchainStream({ token: selectedToken });

  // Connect MetaMask if available or simulated
  const handleConnectMetaMask = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsMetaMaskConnected(true);
        }
      } catch (err) {
        console.warn('MetaMask connection rejected, using simulated testnet wallet', err);
      }
    } else {
      setIsMetaMaskConnected(true);
    }
  };

  // Automated Limit Order Matching Engine (checks open orders against live block ticks)
  useEffect(() => {
    if (openOrders.length === 0) return;

    setOpenOrders((prevOrders) => {
      const remaining: TradeOrder[] = [];
      const executed: TradeOrder[] = [];

      prevOrders.forEach((order) => {
        const pair = TRADING_PAIRS.find((p) => p.id === order.pair);
        if (!pair || !order.targetPrice) {
          remaining.push(order);
          return;
        }

        // Buy Limit triggers if market price <= targetPrice
        // Sell Limit triggers if market price >= targetPrice
        const isTriggered =
          order.side === 'BUY'
            ? pair.currentPrice <= order.targetPrice
            : pair.currentPrice >= order.targetPrice;

        if (isTriggered) {
          executed.push({
            ...order,
            status: 'FILLED',
            price: pair.currentPrice,
            timestamp: Date.now(),
            blockNumber: currentBlock
          });
        } else {
          remaining.push(order);
        }
      });

      if (executed.length > 0) {
        // Update trade history
        setTradeHistory((prev) => [...executed, ...prev]);

        // Settle balances for executed limit orders
        executed.forEach((exec) => {
          const [baseSym, quoteSym] = exec.pair.split('/');
          setPortfolio((prev) => {
            const next = { ...prev };
            if (exec.side === 'BUY') {
              // Received base
              if (baseSym === 'CT') next.demoCtBalance += exec.amount;
              else if (baseSym === 'ETH') next.demoEthBalance += exec.amount;
              else {
                next.otherTokenBalances[baseSym] = (next.otherTokenBalances[baseSym] || 0) + exec.amount;
              }
            } else {
              // Received quote
              if (quoteSym === 'ETH') next.demoEthBalance += exec.amount * exec.price;
              else if (quoteSym === 'USDT') next.demoUsdtBalance += exec.amount * exec.price;
            }
            next.totalTradeCount += 1;
            next.totalVolumeUsd += exec.totalCostUsd;
            return next;
          });
        });
      }

      return remaining;
    });
  }, [currentBlock]);

  // Execute Market or Place Limit Order
  const handleExecuteTrade = useCallback((
    orderPayload: Omit<TradeOrder, 'id' | 'timestamp' | 'txHash' | 'blockNumber'>
  ) => {
    const newTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const newId = `order_${Date.now()}`;

    const newOrder: TradeOrder = {
      ...orderPayload,
      id: newId,
      timestamp: Date.now(),
      txHash: newTxHash,
      blockNumber: currentBlock
    };

    const [baseSym, quoteSym] = orderPayload.pair.split('/');

    if (orderPayload.type === 'MARKET') {
      // Immediate settlement
      setPortfolio((prev) => {
        const next = { ...prev };

        if (orderPayload.side === 'BUY') {
          // Deduct quote, credit base
          if (quoteSym === 'ETH') {
            next.demoEthBalance = Math.max(0, next.demoEthBalance - orderPayload.totalCostEth);
          } else if (quoteSym === 'USDT') {
            next.demoUsdtBalance = Math.max(0, next.demoUsdtBalance - orderPayload.totalCostEth);
          }

          if (baseSym === 'CT') {
            next.demoCtBalance += orderPayload.amount;
          } else if (baseSym === 'ETH') {
            next.demoEthBalance += orderPayload.amount;
          } else {
            next.otherTokenBalances[baseSym] = (next.otherTokenBalances[baseSym] || 0) + orderPayload.amount;
          }
        } else {
          // SELL: Deduct base, credit quote
          if (baseSym === 'CT') {
            next.demoCtBalance = Math.max(0, next.demoCtBalance - orderPayload.amount);
          } else if (baseSym === 'ETH') {
            next.demoEthBalance = Math.max(0, next.demoEthBalance - orderPayload.amount);
          } else {
            next.otherTokenBalances[baseSym] = Math.max(0, (next.otherTokenBalances[baseSym] || 0) - orderPayload.amount);
          }

          if (quoteSym === 'ETH') {
            next.demoEthBalance += orderPayload.amount * orderPayload.price;
          } else if (quoteSym === 'USDT') {
            next.demoUsdtBalance += orderPayload.amount * orderPayload.price;
          }
        }

        next.totalTradeCount += 1;
        next.totalVolumeUsd += orderPayload.totalCostUsd;
        next.realizedPnlUsd += Math.round((Math.random() * 40 - 8) * 100) / 100;
        return next;
      });

      setTradeHistory((prev) => [newOrder, ...prev]);

      return {
        success: true,
        message: `Market Swap Executed! ${orderPayload.side === 'BUY' ? 'Received' : 'Sold'} ${orderPayload.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${baseSym} via Uniswap V3 concentrated liquidity.`
      };
    } else {
      // Limit Order: escrow funds
      setPortfolio((prev) => {
        const next = { ...prev };
        if (orderPayload.side === 'BUY') {
          if (quoteSym === 'ETH') next.demoEthBalance = Math.max(0, next.demoEthBalance - orderPayload.totalCostEth);
          else if (quoteSym === 'USDT') next.demoUsdtBalance = Math.max(0, next.demoUsdtBalance - orderPayload.totalCostEth);
        } else {
          if (baseSym === 'CT') next.demoCtBalance = Math.max(0, next.demoCtBalance - orderPayload.amount);
          else if (baseSym === 'ETH') next.demoEthBalance = Math.max(0, next.demoEthBalance - orderPayload.amount);
          else next.otherTokenBalances[baseSym] = Math.max(0, (next.otherTokenBalances[baseSym] || 0) - orderPayload.amount);
        }
        return next;
      });

      setOpenOrders((prev) => [newOrder, ...prev]);

      return {
        success: true,
        message: `Limit Order Placed! Trigger target: ${orderPayload.targetPrice} ${quoteSym}. Automated matching active.`
      };
    }
  }, [currentBlock]);

  // Cancel an open limit order & refund escrow
  const handleCancelOrder = (orderId: string) => {
    const orderToCancel = openOrders.find((o) => o.id === orderId);
    if (!orderToCancel) return;

    const [baseSym, quoteSym] = orderToCancel.pair.split('/');

    setPortfolio((prev) => {
      const next = { ...prev };
      if (orderToCancel.side === 'BUY') {
        if (quoteSym === 'ETH') next.demoEthBalance += orderToCancel.totalCostEth;
        else if (quoteSym === 'USDT') next.demoUsdtBalance += orderToCancel.totalCostEth;
      } else {
        if (baseSym === 'CT') next.demoCtBalance += orderToCancel.amount;
        else if (baseSym === 'ETH') next.demoEthBalance += orderToCancel.amount;
        else next.otherTokenBalances[baseSym] = (next.otherTokenBalances[baseSym] || 0) + orderToCancel.amount;
      }
      return next;
    });

    setOpenOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  // Refill Faucet
  const handleRefillFaucet = () => {
    setPortfolio((prev) => ({
      ...prev,
      demoEthBalance: prev.demoEthBalance + 5.0,
      demoCtBalance: prev.demoCtBalance + 10000,
      demoUsdtBalance: prev.demoUsdtBalance + 5000
    }));
  };

  // Send tokens simulation
  const handleSendTokens = (asset: string, recipient: string, amount: number) => {
    setPortfolio((prev) => {
      const next = { ...prev };
      if (asset === 'ETH') next.demoEthBalance = Math.max(0, next.demoEthBalance - amount);
      else if (asset === 'CT') next.demoCtBalance = Math.max(0, next.demoCtBalance - amount);
      else if (asset === 'USDT') next.demoUsdtBalance = Math.max(0, next.demoUsdtBalance - amount);
      return next;
    });

    return {
      success: true,
      message: `Sent ${amount.toLocaleString()} ${asset} to ${recipient.slice(0, 8)}... Broadcast confirmed on block #${currentBlock.toLocaleString()}.`
    };
  };

  // Claim CT Rewards
  const handleClaimReward = (ctAmount: number, _points: number, _campaignTitle: string) => {
    setPortfolio((prev) => ({
      ...prev,
      demoCtBalance: prev.demoCtBalance + ctAmount
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Header with Live Trading tab & Wallet Button */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedToken={selectedToken}
        onOpenTokenSelector={() => setIsTokenSelectorOpen(true)}
        currentBlock={currentBlock}
        isStreaming={isStreaming}
        onToggleStreaming={toggleStream}
        gasPriceGwei={gasPriceGwei}
        walletAddress={walletAddress}
        onOpenWalletModal={() => setIsWalletModalOpen(true)}
      />

      {/* Main Token Overview Header Banner */}
      <TokenOverviewBanner
        token={selectedToken}
        currentPrice={currentPrice}
      />

      {/* Main Tab Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Module 1: Main Dashboard */}
        {activeTab === 'dashboard' && (
          <MainDashboard
            portfolio={portfolio}
            currentBlock={currentBlock}
            tradeHistory={tradeHistory}
            onOpenTrading={() => setActiveTab('trading')}
            onOpenWallet={() => setIsWalletModalOpen(true)}
            onOpenRewards={() => setActiveTab('rewards')}
            onSelectToken={setSelectedToken}
          />
        )}

        {/* Live User Trading Platform (DEX Terminal) */}
        {activeTab === 'trading' && (
          <LiveTradingTerminal
            currentBlock={currentBlock}
            portfolio={portfolio}
            onExecuteTrade={handleExecuteTrade}
            openOrders={openOrders}
            onCancelOrder={handleCancelOrder}
            tradeHistory={tradeHistory}
            onOpenWalletModal={() => setIsWalletModalOpen(true)}
          />
        )}

        {/* Module 3: CT Rewards Center */}
        {activeTab === 'rewards' && (
          <CTRewardsCenter
            portfolio={portfolio}
            onClaimReward={handleClaimReward}
            currentBlock={currentBlock}
          />
        )}

        {/* Module 4: Admin Dashboard */}
        {activeTab === 'admin' && (
          <AdminDashboard currentBlock={currentBlock} />
        )}

        {activeTab === 'market' && (
          <LiveMarketAnalytics
            token={selectedToken}
            currentPrice={currentPrice}
            candles={candles}
            buyVolume24h={buyVolume24h}
            sellVolume24h={sellVolume24h}
          />
        )}

        {activeTab === 'wallets' && (
          <WalletAnalytics token={selectedToken} />
        )}

        {activeTab === 'transactions' && (
          <TransactionMonitoring
            token={selectedToken}
            transfers={transfers}
            isStreaming={isStreaming}
            onToggleStreaming={toggleStream}
            speed={speed}
            onSetSpeed={setSpeed}
            onTriggerBlock={triggerInstantBlock}
            currentBlock={currentBlock}
            totalTxCount={totalTxCount}
          />
        )}

        {activeTab === 'contract' && (
          <SmartContractAnalytics token={selectedToken} />
        )}

        {activeTab === 'relationships' && (
          <OnChainRelationships token={selectedToken} />
        )}

        {activeTab === 'sql' && (
          <SqlEngineStudio token={selectedToken} />
        )}

        {activeTab === 'schema' && (
          <SchemaArchitectureGuide />
        )}
      </main>

      {/* Token Selector Modal */}
      <TokenSelectorModal
        isOpen={isTokenSelectorOpen}
        onClose={() => setIsTokenSelectorOpen(false)}
        selectedToken={selectedToken}
        onSelectToken={setSelectedToken}
      />

      {/* User Web3 Wallet & Faucet Modal */}
      <UserWalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        walletAddress={walletAddress}
        isMetaMaskConnected={isMetaMaskConnected}
        onConnectMetaMask={handleConnectMetaMask}
        portfolio={portfolio}
        onRefillFaucet={handleRefillFaucet}
        onSendTokens={handleSendTokens}
      />

      {/* Quiet, clean Footer adhering to Anti-Slop principles */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-12 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">EtherPulse DEX & Token Analytics</span>
            <span>·</span>
            <span>Ethereum Mainnet & Sepolia Testnet Architecture</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <a
              href="https://ethereum.org/en/developers/docs/standards/tokens/erc-20/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-200 transition-colors inline-flex items-center gap-1"
            >
              <span>EIP-20 Standard</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>·</span>
            <a
              href="https://eips.ethereum.org/EIPS/eip-2612"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-200 transition-colors inline-flex items-center gap-1"
            >
              <span>EIP-2612 Permit</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>·</span>
            <a
              href="https://etherscan.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-200 transition-colors inline-flex items-center gap-1"
            >
              <span>Etherscan Mainnet</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
