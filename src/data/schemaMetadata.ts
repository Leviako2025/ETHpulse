import { SchemaTableMetadata, MissingDataSourceRecommendation } from '../types/token';

export const SCHEMA_TABLES: SchemaTableMetadata[] = [
  {
    tableName: 'tokens',
    description: 'Registry of tracked ERC-20 token contracts on Ethereum with static configuration and deployment metadata.',
    primaryKey: ['address'],
    updateCadence: 'On Deployment',
    columns: [
      { name: 'address', type: 'VARCHAR(42)', isPrimary: true, isIndex: true, nullable: false, description: 'Checksummed Ethereum smart contract address (0x...)', source: 'Ethereum RPC (State)' },
      { name: 'name', type: 'VARCHAR(128)', nullable: false, description: 'ERC-20 token name from name() view function', source: 'Ethereum RPC (State)' },
      { name: 'symbol', type: 'VARCHAR(32)', nullable: false, description: 'ERC-20 token ticker symbol from symbol() function', source: 'Ethereum RPC (State)' },
      { name: 'decimals', type: 'SMALLINT', nullable: false, description: 'Token decimal precision (usually 18, 6 for USDT/USDC)', source: 'Ethereum RPC (State)' },
      { name: 'total_supply_raw', type: 'NUMERIC(78, 0)', nullable: false, description: 'Unscaled total supply in wei/smallest unit', source: 'Ethereum RPC (State)' },
      { name: 'deployer_address', type: 'VARCHAR(42)', isIndex: true, nullable: false, description: 'Origin wallet or contract that created the token', source: 'Ethereum RPC (Logs)' },
      { name: 'deployment_block', type: 'BIGINT', isIndex: true, nullable: false, description: 'Block number in which the contract creation transaction was mined', source: 'Ethereum RPC (Logs)' },
      { name: 'deployment_timestamp', type: 'TIMESTAMP WITH TIME ZONE', nullable: false, description: 'Block timestamp of creation', source: 'Ethereum RPC (Logs)' },
      { name: 'is_erc20_verified', type: 'BOOLEAN', nullable: false, description: 'Flag whether contract bytecode matches ERC-20 standard interface', source: 'Calculated / Enriched' },
      { name: 'has_permit_eip2612', type: 'BOOLEAN', nullable: false, description: 'Supports gasless approval via permit() signature', source: 'Ethereum RPC (State)' },
      { name: 'is_proxy', type: 'BOOLEAN', nullable: false, description: 'EIP-1967 or OpenZeppelin upgradeable proxy pattern', source: 'Ethereum RPC (State)' },
      { name: 'proxy_implementation', type: 'VARCHAR(42)', nullable: true, description: 'Target logic contract address read from EIP-1967 slot', source: 'Ethereum RPC (State)' }
    ],
    suggestedIndexes: [
      'CREATE UNIQUE INDEX idx_tokens_address ON tokens(address);',
      'CREATE INDEX idx_tokens_symbol ON tokens(symbol);',
      'CREATE INDEX idx_tokens_deployer ON tokens(deployer_address);'
    ]
  },
  {
    tableName: 'token_transfers',
    description: 'Append-only ledger of every Transfer(address indexed from, address indexed to, uint256 value) event log emitted on Ethereum.',
    primaryKey: ['transaction_hash', 'log_index'],
    partitionKey: 'block_timestamp (Monthly/Daily partitioned)',
    updateCadence: 'Per Block (~12s)',
    columns: [
      { name: 'token_address', type: 'VARCHAR(42)', isIndex: true, nullable: false, description: 'Contract emitting the transfer event (topic contract)', source: 'Ethereum RPC (Logs)' },
      { name: 'from_address', type: 'VARCHAR(42)', isIndex: true, nullable: false, description: 'Sender address decoded from topic[1]', source: 'Ethereum RPC (Logs)' },
      { name: 'to_address', type: 'VARCHAR(42)', isIndex: true, nullable: false, description: 'Recipient address decoded from topic[2]', source: 'Ethereum RPC (Logs)' },
      { name: 'value_raw', type: 'NUMERIC(78, 0)', nullable: false, description: 'Raw transfer amount in base units from log data', source: 'Ethereum RPC (Logs)' },
      { name: 'value_scaled', type: 'NUMERIC(38, 18)', nullable: false, description: 'Scaled token amount = value_raw / 10^decimals', source: 'Calculated / Enriched' },
      { name: 'transaction_hash', type: 'VARCHAR(66)', isPrimary: true, isIndex: true, nullable: false, description: '32-byte Ethereum transaction hash', source: 'Ethereum RPC (Logs)' },
      { name: 'log_index', type: 'INTEGER', isPrimary: true, nullable: false, description: 'Position of log within the transaction receipt', source: 'Ethereum RPC (Logs)' },
      { name: 'block_number', type: 'BIGINT', isIndex: true, nullable: false, description: 'Height of the block containing the transfer', source: 'Ethereum RPC (Logs)' },
      { name: 'block_timestamp', type: 'TIMESTAMP WITH TIME ZONE', isIndex: true, nullable: false, description: 'Canonical block timestamp (UTC)', source: 'Ethereum RPC (Logs)' },
      { name: 'gas_price_wei', type: 'NUMERIC(78, 0)', nullable: false, description: 'Effective gas price paid for transaction', source: 'Ethereum RPC (Logs)' },
      { name: 'gas_used', type: 'BIGINT', nullable: false, description: 'Gas units consumed by the transaction', source: 'Ethereum RPC (Logs)' },
      { name: 'usd_price_at_timestamp', type: 'NUMERIC(18, 6)', nullable: true, description: 'Historical USD price at the exact minute of the block', source: 'Missing - Needs API / Oracle' }
    ],
    suggestedIndexes: [
      'CREATE INDEX idx_transfers_token_time ON token_transfers(token_address, block_timestamp DESC);',
      'CREATE INDEX idx_transfers_from ON token_transfers(token_address, from_address, block_number DESC);',
      'CREATE INDEX idx_transfers_to ON token_transfers(token_address, to_address, block_number DESC);',
      'CREATE INDEX idx_transfers_whale_filter ON token_transfers(token_address, value_scaled) WHERE value_scaled > 10000;'
    ]
  },
  {
    tableName: 'token_balances_current',
    description: 'Current on-chain wallet balance state maintained via cumulative materialized view or state indexer.',
    primaryKey: ['token_address', 'wallet_address'],
    updateCadence: 'Per Transaction',
    columns: [
      { name: 'token_address', type: 'VARCHAR(42)', isPrimary: true, isIndex: true, nullable: false, description: 'Token contract address', source: 'Ethereum RPC (State)' },
      { name: 'wallet_address', type: 'VARCHAR(42)', isPrimary: true, isIndex: true, nullable: false, description: 'Wallet holding the balance', source: 'Ethereum RPC (State)' },
      { name: 'balance_raw', type: 'NUMERIC(78, 0)', nullable: false, description: 'Balance in wei units', source: 'Ethereum RPC (State)' },
      { name: 'balance_scaled', type: 'NUMERIC(38, 18)', isIndex: true, nullable: false, description: 'Formatted balance (balance_raw / 10^decimals)', source: 'Calculated / Enriched' },
      { name: 'share_of_supply_pct', type: 'NUMERIC(8, 4)', nullable: false, description: 'Percentage of total supply held by this wallet', source: 'Calculated / Enriched' },
      { name: 'first_seen_block', type: 'BIGINT', nullable: false, description: 'First block where this wallet received this token', source: 'Calculated / Enriched' },
      { name: 'last_transfer_block', type: 'BIGINT', isIndex: true, nullable: false, description: 'Most recent block in which a balance change occurred', source: 'Calculated / Enriched' },
      { name: 'tx_count_total', type: 'INTEGER', nullable: false, description: 'Total incoming and outgoing token transactions', source: 'Calculated / Enriched' },
      { name: 'wallet_tag_label', type: 'VARCHAR(128)', nullable: true, description: 'Identified entity name (e.g. Binance 14, vitalik.eth)', source: 'Missing - Needs API / Oracle' },
      { name: 'wallet_category', type: 'VARCHAR(32)', nullable: true, description: 'CEX, Liquidity Pool, Whale, Treasury, Bot', source: 'Missing - Needs API / Oracle' }
    ],
    suggestedIndexes: [
      'CREATE UNIQUE INDEX idx_token_wallet ON token_balances_current(token_address, wallet_address);',
      'CREATE INDEX idx_whale_rankings ON token_balances_current(token_address, balance_scaled DESC);',
      'CREATE INDEX idx_active_wallets ON token_balances_current(token_address, last_transfer_block DESC);'
    ]
  },
  {
    tableName: 'dex_swaps',
    description: 'Decoded trades executed on automated market makers (Uniswap V2/V3, Sushi, Curve, Balancer) involving the token.',
    primaryKey: ['transaction_hash', 'log_index'],
    partitionKey: 'block_timestamp',
    updateCadence: 'Per Transaction',
    columns: [
      { name: 'pool_address', type: 'VARCHAR(42)', isIndex: true, nullable: false, description: 'AMM pool contract address where the swap was fulfilled', source: 'DEX Event' },
      { name: 'token_address', type: 'VARCHAR(42)', isIndex: true, nullable: false, description: 'The token being bought or sold', source: 'DEX Event' },
      { name: 'sender', type: 'VARCHAR(42)', nullable: false, description: 'Address that initiated the swap (msg.sender or router)', source: 'DEX Event' },
      { name: 'recipient', type: 'VARCHAR(42)', nullable: false, description: 'Beneficiary receiving swap proceeds', source: 'DEX Event' },
      { name: 'trade_direction', type: 'VARCHAR(4)', nullable: false, description: 'BUY (ETH/stable -> Token) or SELL (Token -> ETH/stable)', source: 'Calculated / Enriched' },
      { name: 'token_amount', type: 'NUMERIC(38, 18)', nullable: false, description: 'Volume of target token swapped', source: 'DEX Event' },
      { name: 'paired_amount', type: 'NUMERIC(38, 18)', nullable: false, description: 'Volume of counter-asset (WETH, USDC, USDT)', source: 'DEX Event' },
      { name: 'execution_price_usd', type: 'NUMERIC(18, 8)', nullable: false, description: 'Effective price per token achieved in this swap', source: 'Calculated / Enriched' },
      { name: 'router_address', type: 'VARCHAR(42)', isIndex: true, nullable: true, description: 'Aggregator or router used (Universal Router, 1inch)', source: 'Ethereum RPC (Logs)' },
      { name: 'is_mev_sandwich', type: 'BOOLEAN', nullable: true, description: 'Flag whether trade was sandwiched by a block builder/searcher', source: 'Missing - Needs API / Oracle' }
    ],
    suggestedIndexes: [
      'CREATE INDEX idx_dex_token_time ON dex_swaps(token_address, block_timestamp DESC);',
      'CREATE INDEX idx_dex_pool_time ON dex_swaps(pool_address, block_timestamp DESC);',
      'CREATE INDEX idx_dex_large_trades ON dex_swaps(token_address, execution_price_usd, token_amount DESC);'
    ]
  },
  {
    tableName: 'dex_liquidity_pools',
    description: 'Live liquidity pools and reserve states across decentralized exchanges.',
    primaryKey: ['pool_address'],
    updateCadence: 'Per Block (~12s)',
    columns: [
      { name: 'pool_address', type: 'VARCHAR(42)', isPrimary: true, nullable: false, description: 'Pool smart contract address', source: 'Ethereum RPC (State)' },
      { name: 'dex_name', type: 'VARCHAR(64)', nullable: false, description: 'Protocol name (Uniswap V3, Uniswap V2, Curve)', source: 'Calculated / Enriched' },
      { name: 'token0_address', type: 'VARCHAR(42)', nullable: false, description: 'Address of first token in pair', source: 'Ethereum RPC (State)' },
      { name: 'token1_address', type: 'VARCHAR(42)', nullable: false, description: 'Address of second token in pair', source: 'Ethereum RPC (State)' },
      { name: 'fee_tier_bps', type: 'INTEGER', nullable: false, description: 'Pool fee tier in basis points (e.g. 500 for 0.05%, 3000 for 0.3%)', source: 'Ethereum RPC (State)' },
      { name: 'liquidity_usd', type: 'NUMERIC(18, 2)', nullable: false, description: 'Total Value Locked (TVL) in USD', source: 'Calculated / Enriched' },
      { name: 'volume_24h_usd', type: 'NUMERIC(18, 2)', nullable: false, description: 'Rolling 24-hour trading volume', source: 'Calculated / Enriched' },
      { name: 'token_reserve', type: 'NUMERIC(38, 18)', nullable: false, description: 'Quantity of target token in pool vault', source: 'Ethereum RPC (State)' },
      { name: 'paired_reserve', type: 'NUMERIC(38, 18)', nullable: false, description: 'Quantity of paired token (ETH/USDC) in pool vault', source: 'Ethereum RPC (State)' },
      { name: 'last_updated_block', type: 'BIGINT', nullable: false, description: 'Latest block index sync', source: 'Ethereum RPC (Logs)' }
    ],
    suggestedIndexes: [
      'CREATE INDEX idx_pools_token0 ON dex_liquidity_pools(token0_address);',
      'CREATE INDEX idx_pools_token1 ON dex_liquidity_pools(token1_address);'
    ]
  },
  {
    tableName: 'contract_events',
    description: 'Security & lifecycle event logs emitted by the smart contract (Approval, OwnershipTransferred, Paused, Blacklist).',
    primaryKey: ['transaction_hash', 'log_index'],
    partitionKey: 'block_timestamp',
    updateCadence: 'Per Transaction',
    columns: [
      { name: 'contract_address', type: 'VARCHAR(42)', isIndex: true, nullable: false, description: 'Target token contract address', source: 'Ethereum RPC (Logs)' },
      { name: 'event_signature', type: 'VARCHAR(66)', isIndex: true, nullable: false, description: 'keccak256 topic[0] of event declaration', source: 'Ethereum RPC (Logs)' },
      { name: 'event_name', type: 'VARCHAR(64)', nullable: false, description: 'Decoded event name (Approval, OwnershipTransferred, Mint)', source: 'Calculated / Enriched' },
      { name: 'param_1', type: 'VARCHAR(128)', nullable: true, description: 'First indexed parameter (e.g. owner address)', source: 'Ethereum RPC (Logs)' },
      { name: 'param_2', type: 'VARCHAR(128)', nullable: true, description: 'Second indexed parameter (e.g. spender or new owner)', source: 'Ethereum RPC (Logs)' },
      { name: 'param_value', type: 'NUMERIC(78, 0)', nullable: true, description: 'Unindexed parameter (e.g. allowance amount)', source: 'Ethereum RPC (Logs)' },
      { name: 'transaction_hash', type: 'VARCHAR(66)', isPrimary: true, nullable: false, description: 'Tx hash that emitted event', source: 'Ethereum RPC (Logs)' },
      { name: 'block_number', type: 'BIGINT', isIndex: true, nullable: false, description: 'Block height', source: 'Ethereum RPC (Logs)' },
      { name: 'block_timestamp', type: 'TIMESTAMP WITH TIME ZONE', nullable: false, description: 'Event time', source: 'Ethereum RPC (Logs)' }
    ],
    suggestedIndexes: [
      'CREATE INDEX idx_contract_events_sig ON contract_events(contract_address, event_signature);',
      'CREATE INDEX idx_contract_events_time ON contract_events(contract_address, block_timestamp DESC);'
    ]
  }
];

export const MISSING_DATA_SOURCES: MissingDataSourceRecommendation[] = [
  {
    dataPoint: 'Real-time USD Fiat Price & Historical Pricing',
    businessImpact: 'Crucial for portfolio valuation, market cap, and USD transfer volume. Raw Ethereum logs only store token wei amounts without dollar values.',
    currentState: 'Missing from raw on-chain events',
    recommendedSource: 'Chainlink Price Feeds OR Uniswap V3 TWAP Oracle + CoinGecko / DEXScreener Pro API',
    implementationStrategy: 'For on-chain real-time verification, query Chainlink AggregatorV3Interface.latestRoundData() on Ethereum mainnet. For indexer ingestion, join swap timestamps against an hourly fiat price table populated via DEXScreener API or Binance/Coinbase public tickers.',
    exampleCallOrEndpoint: 'eth_call to Chainlink ETH/USD (0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419) -> latestRoundData()'
  },
  {
    dataPoint: 'ENS Name Resolution & Entity Identity Tags',
    businessImpact: 'Hexadecimal addresses (0x28c6...1d60) are unreadable to human analysts. Identifying CEX hot wallets (Binance, Coinbase), market makers (Wintermute, Jump), and prominent figures (vitalik.eth) provides actionable whale intelligence.',
    currentState: 'Missing from raw on-chain events',
    recommendedSource: 'Ethereum ENS Reverse Registrar + Dune / Arkham Intelligence / Etherscan Label API',
    implementationStrategy: 'Perform reverse ENS lookups by querying addr.reverse via node RPC. For entity labeling, ingest community curations (Dune labels schema or Etherscan Labels) into a wallet_metadata reference table.',
    exampleCallOrEndpoint: 'eth_call to ENS Universal Resolver (0x8cab227b3604dc4665ec97165223a0b869733419) -> reverse(address)'
  },
  {
    dataPoint: 'Contract Source Code & Bytecode Verification',
    businessImpact: 'Required to audit security flags: buy/sell tax, honeypot locks, ownership status, and proxy implementations. Raw blockchain only contains compiled EVM runtime bytecode.',
    currentState: 'Partially Available',
    recommendedSource: 'Etherscan API / Sourcify / Blockscout API',
    implementationStrategy: 'Call Etherscan getsourcecode module to fetch verified Solidity code, compiler version, and ABI. If unverified, run an automated EVM decompiler (Panoramix / Heimdall) or inspect standard ERC-20 method selectors via eth_getCode.',
    exampleCallOrEndpoint: 'GET https://api.etherscan.io/api?module=contract&action=getsourcecode&address={token_address}'
  },
  {
    dataPoint: 'DEX Liquidity Pool Reserves & Concentrated Tick Liquidity',
    businessImpact: 'Total supply divided by price gives FDV, but slippage and market depth require tracking active pool tick distributions and token reserves.',
    currentState: 'Available in RPC logs',
    recommendedSource: 'Ethereum RPC eth_call directly to pool contracts OR The Graph Uniswap Subgraph',
    implementationStrategy: 'For Uniswap V2, call getReserves() on IUniswapV2Pair. For Uniswap V3, call slot0() on IUniswapV3Pool to read sqrtPriceX96 and tick, and query liquidity() to obtain active in-range depth.',
    exampleCallOrEndpoint: 'eth_call -> UniswapV3Pool.slot0() returns (sqrtPriceX96, tick, observationIndex, ...)'
  },
  {
    dataPoint: 'MEV Bot & Sandwich Attack Classification',
    businessImpact: 'Differentiates organic retail buy/sell pressure from frontrunning arbitrage bots extracting value from traders.',
    currentState: 'Missing from raw on-chain events',
    recommendedSource: 'Flashbots MEV-Inspect / EigenPhi API / Block Builder Flashbots Bundles',
    implementationStrategy: 'Correlate consecutive transactions within the same block where an identical token pair has a BUY immediately before a user swap and a SELL immediately following it with the same beneficiary.',
    exampleCallOrEndpoint: 'Query block transactions sorted by tx_index; check for back-to-back sandwich arbitrage signatures'
  }
];
