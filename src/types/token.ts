/**
 * Types for Ethereum ERC-20 Token Real-time Analytics System
 */

export interface TokenProfile {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  totalSupplyFormatted: string;
  circulatingSupply: string;
  circulatingSupplyFormatted: string;
  deployerAddress: string;
  deploymentBlock: number;
  deploymentDate: string;
  verified: boolean;
  compilerVersion: string;
  license: string;
  standard: string; // 'ERC-20' | 'ERC-20 + EIP-2612' | 'ERC-777'
  hasPermit: boolean;
  isProxy: boolean;
  proxyImplementation?: string;
  description: string;
  website?: string;
  explorerUrl: string;
  
  // Market figures
  currentPriceUsd: number;
  currentPriceEth: number;
  priceChange1h: number;
  priceChange24h: number;
  priceChange7d: number;
  high24h: number;
  low24h: number;
  marketCapUsd: number;
  fdvUsd: number;
  volume24hUsd: number;
  liquidityUsd: number;
  
  // Security analysis
  securityAudit: TokenSecurityAudit;
  
  // Pools
  pools: LiquidityPoolInfo[];
}

export interface TokenSecurityAudit {
  buyTaxPercent: number;
  sellTaxPercent: number;
  isOwnershipRenounced: boolean;
  ownerAddress?: string;
  isMintable: boolean;
  canBlacklist: boolean;
  canPauseTransfers: boolean;
  hasMaxTxAmount: boolean;
  maxTxAmount?: string;
  safetyScore: number; // 0-100 score
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  vulnerabilitiesFound: string[];
}

export interface LiquidityPoolInfo {
  dexName: string; // e.g. 'Uniswap V3', 'Uniswap V2', 'SushiSwap'
  poolAddress: string;
  pairSymbol: string; // e.g. 'UNI / WETH'
  feeTierPercent: number; // e.g. 0.3%
  liquidityUsd: number;
  volume24hUsd: number;
  tokenReserve: string;
  ethReserve: string;
}

export interface PriceCandle {
  timestamp: number;
  timeLabel: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volumeUsd: number;
  buyVolumeUsd: number;
  sellVolumeUsd: number;
}

export interface WhaleHolder {
  rank: number;
  address: string;
  ens?: string;
  label?: string;
  category: 'Liquidity Pool' | 'Exchange Hot Wallet' | 'Staking / Governance' | 'Team Treasury' | 'Whale' | 'Retail Whale';
  balance: number;
  balanceFormatted: string;
  valueUsd: number;
  sharePercent: number;
  change24hPercent: number;
  firstSeenBlock: number;
  lastActiveTimestamp: number;
  txCount: number;
}

export interface HolderDistributionTier {
  tierName: string;
  rangeUsd: string;
  holderCount: number;
  totalTokens: number;
  percentHolders: number;
  percentTokens: number;
}

export interface HistoricalHolderSnapshot {
  date: string;
  dateLabel: string;
  timestamp: number;
  blockNumber: number;
  top10SharePct: number;     // Top 10 Whales %
  top50SharePct: number;     // Cumulative Top 50 Whales %
  top100SharePct: number;    // Cumulative Top 100 Whales %
  retailSharePct: number;    // Remainder (Retail / Community) %
  next11to50Pct: number;     // Top 11-50 cohort %
  next51to100Pct: number;    // Top 51-100 cohort %
  giniCoefficient: number;   // Gini score 0-1
  totalHoldersCount: number;
  eventAnnotation?: string;
}

export type TxActionType = 'BUY' | 'SELL' | 'TRANSFER' | 'MINT' | 'BURN' | 'ADD_LIQUIDITY' | 'REMOVE_LIQUIDITY';

export interface LiveTokenTransfer {
  txHash: string;
  blockNumber: number;
  timestamp: number;
  fromAddress: string;
  fromEns?: string;
  fromLabel?: string;
  toAddress: string;
  toEns?: string;
  toLabel?: string;
  action: TxActionType;
  amount: number;
  amountFormatted: string;
  valueUsd: number;
  gasPriceGwei: number;
  gasFeeEth: number;
  status: 'CONFIRMED' | 'PENDING';
  dexRouter?: string;
}

export interface OnChainNode {
  id: string;
  label: string;
  type: 'POOL' | 'ROUTER' | 'WHALE' | 'CEX' | 'TREASURY' | 'TRADER';
  address: string;
  balanceUsd: number;
  activityVolume24h: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface OnChainLink {
  source: string;
  target: string;
  volumeUsd: number;
  txCount: number;
  type: 'SWAP' | 'TRANSFER' | 'DEPOSIT' | 'WITHDRAW';
}

export type SqlDialect = 'Dune SQL (Trino)' | 'Google BigQuery' | 'ClickHouse EVM' | 'PostgreSQL';

export interface SqlQueryPreset {
  id: string;
  title: string;
  category: 'Market Metrics' | 'Whale Tracking' | 'Holder Rankings' | 'Real-time Flow' | 'Security & Audit';
  description: string;
  complexity: 'Standard' | 'Advanced' | 'Real-time / Partitioned';
  sqlByDialect: Record<SqlDialect, string>;
  targetTables: string[];
  keyColumns: string[];
  performanceTips: string[];
  mockResult: {
    columns: string[];
    rows: (string | number)[][];
    executionTimeMs: number;
    rowsAffected: number;
  };
}

export interface SchemaTableColumn {
  name: string;
  type: string;
  isPrimary?: boolean;
  isIndex?: boolean;
  nullable: boolean;
  description: string;
  source: 'Ethereum RPC (Logs)' | 'Ethereum RPC (State)' | 'DEX Event' | 'Calculated / Enriched' | 'Missing - Needs API / Oracle';
}

export interface SchemaTableMetadata {
  tableName: string;
  description: string;
  primaryKey: string[];
  partitionKey?: string;
  updateCadence: 'Per Block (~12s)' | 'Per Transaction' | 'Daily Snapshot' | 'On Deployment';
  columns: SchemaTableColumn[];
  suggestedIndexes: string[];
}

export interface MissingDataSourceRecommendation {
  dataPoint: string;
  businessImpact: string;
  currentState: 'Available in RPC logs' | 'Partially Available' | 'Missing from raw on-chain events';
  recommendedSource: string;
  implementationStrategy: string;
  exampleCallOrEndpoint: string;
}

export type OrderType = 'MARKET' | 'LIMIT';
export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'OPEN' | 'FILLED' | 'CANCELLED';

export interface TradeOrder {
  id: string;
  timestamp: number;
  pair: string;
  type: OrderType;
  side: OrderSide;
  price: number;
  targetPrice?: number; // for limit orders
  amount: number; // in base token
  totalCostEth: number;
  totalCostUsd: number;
  feeDiscountPercent: number; // e.g. 25% discount when paying in CT
  feeAmount: number;
  status: OrderStatus;
  txHash: string;
  blockNumber: number;
  slippageTolerancePercent: number;
}

export interface UserPortfolio {
  demoEthBalance: number;
  demoCtBalance: number;
  demoUsdtBalance: number;
  otherTokenBalances: Record<string, number>;
  totalTradeCount: number;
  totalVolumeUsd: number;
  realizedPnlUsd: number;
  realizedPnlPercent: number;
}

export interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
  side: 'BID' | 'ASK';
}

export interface TradingPair {
  id: string; // e.g. 'CT/ETH'
  baseSymbol: string;
  quoteSymbol: string;
  baseDecimals: number;
  quoteDecimals: number;
  currentPrice: number; // in quote units
  currentPriceUsd: number;
  priceChange24h: number;
  high24h: number;
  low24h: number;
  volume24hUsd: number;
  poolAddress: string;
  feeTierPercent: number;
}


