import { SqlQueryPreset } from '../types/token';

export const SQL_PRESETS: SqlQueryPreset[] = [
  {
    id: 'ohlcv_aggregation',
    title: '15-Minute OHLCV Price & Volume Aggregation',
    category: 'Market Metrics',
    description: 'Calculates open, high, low, close prices, total volume in USD, and buy/sell pressure in 15-minute intervals from Uniswap V3 swap events.',
    complexity: 'Standard',
    targetTables: ['uniswap_v3_ethereum.Pair_evt_Swap', 'prices.usd', 'ethereum.transactions'],
    keyColumns: ['evt_block_time', 'amount0', 'amount1', 'sqrtPriceX96', 'tick'],
    performanceTips: [
      'Partition on evt_block_time (date) to prune old partitions.',
      'Filter by pool contract address first before joining with price tables.',
      'Avoid unnesting or string casts on raw 256-bit integers; use native 128/256-bit decimal types.'
    ],
    mockResult: {
      columns: ['time_bucket', 'open_price', 'high_price', 'low_price', 'close_price', 'volume_usd', 'buy_vol_usd', 'sell_vol_usd', 'swap_count'],
      rows: [
        ['2026-11-06 13:00:00', 8.384, 8.441, 8.362, 8.420, 1420800, 890400, 530400, 184],
        ['2026-11-06 12:45:00', 8.351, 8.390, 8.340, 8.384, 980400, 610000, 370400, 142],
        ['2026-11-06 12:30:00', 8.310, 8.365, 8.305, 8.351, 1250300, 780200, 470100, 168],
        ['2026-11-06 12:15:00', 8.280, 8.320, 8.275, 8.310, 840500, 450200, 390300, 119],
        ['2026-11-06 12:00:00', 8.250, 8.290, 8.240, 8.280, 1120000, 680000, 440000, 155]
      ],
      executionTimeMs: 142,
      rowsAffected: 5
    },
    sqlByDialect: {
      'Dune SQL (Trino)': `-- Dune SQL: 15-Minute OHLCV Aggregation
WITH raw_swaps AS (
    SELECT 
        date_trunc('minute', evt_block_time) - INTERVAL '1' MINUTE * (MINUTE(evt_block_time) % 15) AS time_bucket,
        evt_block_time,
        evt_index,
        -- Calculate token price from Uniswap V3 sqrtPriceX96:
        -- price = (sqrtPriceX96 / 2^96)^2 * 10^(decimalsToken0 - decimalsToken1)
        POWER((CAST(sqrtPriceX96 AS DOUBLE) / POWER(2, 96)), 2) * POWER(10, 18 - 18) AS execution_price,
        ABS(CAST(amount0 AS DOUBLE)) / 1e18 AS token0_amount,
        ABS(CAST(amount1 AS DOUBLE)) / 1e18 AS token1_amount,
        CASE WHEN amount0 < 0 THEN 'BUY' ELSE 'SELL' END AS trade_direction
    FROM uniswap_v3_ethereum.Pair_evt_Swap
    WHERE contract_address = {{pool_address}}
      AND evt_block_time >= NOW() - INTERVAL '24' HOUR
),
ranked_swaps AS (
    SELECT 
        *,
        ROW_NUMBER() OVER (PARTITION BY time_bucket ORDER BY evt_block_time ASC, evt_index ASC) AS rn_first,
        ROW_NUMBER() OVER (PARTITION BY time_bucket ORDER BY evt_block_time DESC, evt_index DESC) AS rn_last
    FROM raw_swaps
)
SELECT 
    time_bucket,
    MAX(CASE WHEN rn_first = 1 THEN execution_price END) AS open_price,
    MAX(execution_price) AS high_price,
    MIN(execution_price) AS low_price,
    MAX(CASE WHEN rn_last = 1 THEN execution_price END) AS close_price,
    SUM(token0_amount * execution_price) AS volume_usd,
    SUM(CASE WHEN trade_direction = 'BUY' THEN token0_amount * execution_price ELSE 0 END) AS buy_vol_usd,
    SUM(CASE WHEN trade_direction = 'SELL' THEN token0_amount * execution_price ELSE 0 END) AS sell_vol_usd,
    COUNT(*) AS swap_count
FROM ranked_swaps
GROUP BY time_bucket
ORDER BY time_bucket DESC;`,

      'Google BigQuery': `-- Google BigQuery: crypto_ethereum OHLCV Aggregation
WITH decoded_swaps AS (
    SELECT 
        TIMESTAMP_SECONDS(DIV(UNIX_SECONDS(block_timestamp), 900) * 900) AS time_bucket,
        block_timestamp,
        log_index,
        -- Uniswap V3 sqrtPriceX96 is encoded in swap log data
        POW(SAFE_CAST(CONCAT('0x', SUBSTR(data, 131, 64)) AS FLOAT64) / POW(2, 96), 2) AS execution_price,
        ABS(SAFE_CAST(CONCAT('0x', SUBSTR(data, 3, 64)) AS FLOAT64)) / 1e18 AS token0_amount
    FROM \`bigquery-public-data.crypto_ethereum.logs\`
    WHERE address = LOWER(@pool_address)
      AND topics[OFFSET(0)] = '0xc42079f94a6350d7e6235f29174924f9d5fb2ce0024437c77529b7908092f87e' -- Swap event signature
      AND block_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
)
SELECT 
    time_bucket,
    ARRAY_AGG(execution_price ORDER BY block_timestamp ASC, log_index ASC LIMIT 1)[OFFSET(0)] AS open_price,
    MAX(execution_price) AS high_price,
    MIN(execution_price) AS low_price,
    ARRAY_AGG(execution_price ORDER BY block_timestamp DESC, log_index DESC LIMIT 1)[OFFSET(0)] AS close_price,
    SUM(token0_amount * execution_price) AS volume_usd,
    COUNT(*) AS swap_count
FROM decoded_swaps
GROUP BY time_bucket
ORDER BY time_bucket DESC;`,

      'ClickHouse EVM': `-- ClickHouse EVM: High-throughput OHLCV Aggregation
SELECT 
    toStartOfInterval(block_timestamp, INTERVAL 15 MINUTE) AS time_bucket,
    argMin(execution_price, (block_timestamp, log_index)) AS open_price,
    max(execution_price) AS high_price,
    min(execution_price) AS low_price,
    argMax(execution_price, (block_timestamp, log_index)) AS close_price,
    sum(amount_usd) AS volume_usd,
    count(*) AS swap_count
FROM evm_ethereum.dex_swaps
WHERE pool_address = {pool_address:String}
  AND block_timestamp >= now() - INTERVAL 24 HOUR
GROUP BY time_bucket
ORDER BY time_bucket DESC;`,

      'PostgreSQL': `-- PostgreSQL: 15-Minute Candle Aggregation
SELECT 
    date_bin('15 minutes', block_timestamp, TIMESTAMP '2020-01-01') AS time_bucket,
    (ARRAY_AGG(execution_price ORDER BY block_timestamp ASC, log_index ASC))[1] AS open_price,
    MAX(execution_price) AS high_price,
    MIN(execution_price) AS low_price,
    (ARRAY_AGG(execution_price ORDER BY block_timestamp DESC, log_index DESC))[1] AS close_price,
    SUM(amount_usd) AS volume_usd,
    COUNT(*) AS swap_count
FROM token_swaps
WHERE contract_address = :token_address
  AND block_timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY 1
ORDER BY 1 DESC;`
    }
  },
  {
    id: 'whale_net_inflow',
    title: 'Whale Concentration & 24h Net Flow Tracker',
    category: 'Whale Tracking',
    description: 'Identifies the top 50 non-contract whale wallets, their current token holdings, and calculates net inflows or dumps over the past 24 hours.',
    complexity: 'Advanced',
    targetTables: ['erc20_ethereum.evt_Transfer', 'ethereum.contracts'],
    keyColumns: ['from', 'to', 'value', 'contract_address', 'evt_block_time'],
    performanceTips: [
      'Exclude known DEX routers, burn addresses, and factory contracts to isolate organic holders.',
      'Use window functions over partitioned balance histories rather than full table joins.',
      'Pre-filter transfers with value >= 10,000 * 10^decimals for high-volume whale tracking.'
    ],
    mockResult: {
      columns: ['wallet_address', 'holder_label', 'current_balance', 'usd_value', 'supply_share_pct', 'inflow_24h', 'outflow_24h', 'net_flow_24h'],
      rows: [
        ['0x3ddfa8ec3052539b6c9549f12cea2c295cff5296', 'Alpha Custody Whale', '19,500,000', '$164,190,000', '1.95%', 0, 0, 0],
        ['0xab5801a7d398351b8be11c439e05c5b3259aec9b', 'vitalik.eth', '8,450,000', '$71,149,000', '0.85%', 0, 0, 0],
        ['0xbe0eb53f46cd790cd13851d5eff43d12404d33e8', 'Smart Money Arb 1', '4,820,000', '$40,584,400', '0.48%', 450000, 120000, '+330,000'],
        ['0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640', 'Arbitrageur 2', '2,940,000', '$24,754,800', '0.29%', 820000, 1100000, '-280,000'],
        ['0x56eddb7aa87536c09ccc2793473599fd21a8b17f', 'Active Whale Fund', '2,150,000', '$18,103,000', '0.22%', 600000, 0, '+600,000']
      ],
      executionTimeMs: 280,
      rowsAffected: 5
    },
    sqlByDialect: {
      'Dune SQL (Trino)': `-- Dune SQL: Whale Concentration & 24h Net Flow
WITH transfer_deltas AS (
    -- Outflows (debits)
    SELECT 
        "from" AS wallet,
        -CAST(value AS DOUBLE) / 1e18 AS delta,
        evt_block_time
    FROM erc20_ethereum.evt_Transfer
    WHERE contract_address = {{token_address}}
      AND "from" != 0x0000000000000000000000000000000000000000

    UNION ALL

    -- Inflows (credits)
    SELECT 
        "to" AS wallet,
        CAST(value AS DOUBLE) / 1e18 AS delta,
        evt_block_time
    FROM erc20_ethereum.evt_Transfer
    WHERE contract_address = {{token_address}}
      AND "to" != 0x0000000000000000000000000000000000000000
),
wallet_metrics AS (
    SELECT 
        wallet,
        SUM(delta) AS current_balance,
        SUM(CASE WHEN evt_block_time >= NOW() - INTERVAL '24' HOUR AND delta > 0 THEN delta ELSE 0 END) AS inflow_24h,
        SUM(CASE WHEN evt_block_time >= NOW() - INTERVAL '24' HOUR AND delta < 0 THEN ABS(delta) ELSE 0 END) AS outflow_24h
    FROM transfer_deltas
    GROUP BY wallet
    HAVING SUM(delta) > 500000 -- Whale threshold
)
SELECT 
    wallet AS wallet_address,
    current_balance,
    current_balance * {{token_price_usd}} AS usd_value,
    (current_balance / {{total_supply}}) * 100 AS supply_share_pct,
    inflow_24h,
    outflow_24h,
    (inflow_24h - outflow_24h) AS net_flow_24h
FROM wallet_metrics
ORDER BY current_balance DESC
LIMIT 50;`,

      'Google BigQuery': `-- BigQuery: Whale Net Inflows & Balances
WITH transfers AS (
    SELECT 
        CONCAT('0x', SUBSTR(topics[OFFSET(1)], 27, 40)) AS from_address,
        CONCAT('0x', SUBSTR(topics[OFFSET(2)], 27, 40)) AS to_address,
        SAFE_CAST(CONCAT('0x', data) AS FLOAT64) / 1e18 AS token_amount,
        block_timestamp
    FROM \`bigquery-public-data.crypto_ethereum.logs\`
    WHERE address = LOWER(@token_address)
      AND topics[OFFSET(0)] = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
),
deltas AS (
    SELECT from_address AS wallet, -token_amount AS delta, block_timestamp FROM transfers WHERE from_address != '0x0000000000000000000000000000000000000000'
    UNION ALL
    SELECT to_address AS wallet, token_amount AS delta, block_timestamp FROM transfers WHERE to_address != '0x0000000000000000000000000000000000000000'
)
SELECT 
    wallet,
    SUM(delta) AS balance,
    SUM(CASE WHEN block_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR) AND delta > 0 THEN delta ELSE 0 END) AS inflow_24h,
    SUM(CASE WHEN block_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR) AND delta < 0 THEN ABS(delta) ELSE 0 END) AS outflow_24h,
    SUM(CASE WHEN block_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR) THEN delta ELSE 0 END) AS net_24h
FROM deltas
GROUP BY wallet
HAVING SUM(delta) > 100000
ORDER BY balance DESC
LIMIT 50;`,

      'ClickHouse EVM': `-- ClickHouse: Fast Whale Balance Aggregation
SELECT 
    wallet_address,
    sum(delta) AS current_balance,
    sumIf(delta, delta > 0 AND block_timestamp >= now() - INTERVAL 24 HOUR) AS inflow_24h,
    abs(sumIf(delta, delta < 0 AND block_timestamp >= now() - INTERVAL 24 HOUR)) AS outflow_24h,
    (inflow_24h - outflow_24h) AS net_flow_24h
FROM evm_ethereum.token_balance_deltas
WHERE token_address = {token_address:String}
GROUP BY wallet_address
HAVING current_balance > 500000
ORDER BY current_balance DESC
LIMIT 50;`,

      'PostgreSQL': `-- PostgreSQL: Materialized Whale Outflows
SELECT 
    wallet_address,
    current_balance,
    inflow_24h,
    outflow_24h,
    (inflow_24h - outflow_24h) AS net_24h
FROM mv_token_wallet_balances
WHERE token_address = :token_address
  AND current_balance >= 500000
ORDER BY current_balance DESC
LIMIT 50;`
    }
  },
  {
    id: 'gini_holder_rankings',
    title: 'Top 100 Holders & Gini Concentration Coefficient',
    category: 'Holder Rankings',
    description: 'Calculates the Lorenz curve and on-chain Gini coefficient (0 = perfectly equal, 1 = absolute monopoly) measuring token centralization risk.',
    complexity: 'Advanced',
    targetTables: ['token_balances_current'],
    keyColumns: ['wallet_address', 'balance', 'token_address'],
    performanceTips: [
      'Filter out dead/burn addresses (0x0000...dead) and protocol staking escrow contracts.',
      'Use cumulative sum window functions to generate Lorenz points directly in SQL.'
    ],
    mockResult: {
      columns: ['metric', 'value', 'interpretation'],
      rows: [
        ['Total Tracked Holders', '381,948', 'High retail distribution'],
        ['Top 10 Wallets Share', '39.8%', 'Significant institutional/treasury hold'],
        ['Top 100 Wallets Share', '62.4%', 'Concentrated in core participants'],
        ['Gini Coefficient', '0.842', 'High inequality (typical for governance tokens)']
      ],
      executionTimeMs: 195,
      rowsAffected: 4
    },
    sqlByDialect: {
      'Dune SQL (Trino)': `-- Dune SQL: Holder Rankings & Gini Coefficient Calculation
WITH non_zero_holders AS (
    SELECT 
        wallet,
        balance,
        ROW_NUMBER() OVER (ORDER BY balance ASC) AS rank_asc,
        COUNT(*) OVER () AS total_holders,
        SUM(balance) OVER () AS total_tokens
    FROM token_balances
    WHERE token_address = {{token_address}}
      AND balance > 0
      AND wallet NOT IN (
          0x0000000000000000000000000000000000000000,
          0x000000000000000000000000000000000000dead
      )
),
gini_components AS (
    SELECT 
        total_holders,
        total_tokens,
        SUM((2 * rank_asc - total_holders - 1) * balance) AS numerator
    FROM non_zero_holders
    GROUP BY total_holders, total_tokens
)
SELECT 
    total_holders,
    total_tokens,
    ROUND(CAST(numerator AS DOUBLE) / (CAST(total_holders AS DOUBLE) * CAST(total_tokens AS DOUBLE)), 4) AS gini_coefficient
FROM gini_components;`,

      'Google BigQuery': `-- BigQuery: Gini Coefficient & Lorenz Curve
WITH ranked_holders AS (
    SELECT 
        wallet,
        balance,
        ROW_NUMBER() OVER (ORDER BY balance ASC) AS i,
        COUNT(1) OVER() AS n,
        SUM(balance) OVER() AS total_balance
    FROM \`analytics.token_balances_snapshot\`
    WHERE token_address = LOWER(@token_address)
      AND balance > 0
)
SELECT 
    n AS total_holders,
    total_balance,
    SAFE_DIVIDE(SUM((2 * i - n - 1) * balance), (n * total_balance)) AS gini_coefficient
FROM ranked_holders
GROUP BY n, total_balance;`,

      'ClickHouse EVM': `-- ClickHouse: Fast Holder Gini Index
SELECT 
    count() AS total_holders,
    round((2 * sum(balance * rank) / (count() * sum(balance))) - ((count() + 1) / count()), 4) AS gini_coefficient
FROM (
    SELECT 
        wallet,
        balance,
        rowNumberInAllBlocks() AS rank
    FROM evm_ethereum.token_balances
    WHERE token_address = {token_address:String} AND balance > 0
    ORDER BY balance ASC
);`,

      'PostgreSQL': `-- PostgreSQL: Gini Coefficient
WITH ordered_balances AS (
    SELECT 
        balance,
        ROW_NUMBER() OVER (ORDER BY balance ASC) AS rank,
        COUNT(*) OVER () AS n,
        SUM(balance) OVER () AS sum_y
    FROM token_balances
    WHERE token_address = :token_address AND balance > 0
)
SELECT 
    n AS holders_count,
    ROUND((SUM((2 * rank - n - 1) * balance) / (n * sum_y))::numeric, 4) AS gini_index
FROM ordered_balances
GROUP BY n, sum_y;`
    }
  },
  {
    id: 'buy_sell_router_breakdown',
    title: 'Buy vs Sell Volume by DEX Router & MEV Activity',
    category: 'Real-time Flow',
    description: 'Tracks DEX swap flows categorized by router (Uniswap Universal Router, 1inch, CowSwap, Banana Gun bot, Maestro) and flags sandwich/MEV trades.',
    complexity: 'Standard',
    targetTables: ['dex.trades', 'ethereum.transactions'],
    keyColumns: ['tx_hash', 'tx_to', 'trader_a', 'token_bought_amount', 'token_sold_amount'],
    performanceTips: [
      'Join on tx_hash with ethereum.transactions to map tx.to to known router labels.',
      'Group by 1-hour time blocks and router to monitor routing share trends.'
    ],
    mockResult: {
      columns: ['router_name', 'buy_count', 'buy_vol_usd', 'sell_count', 'sell_vol_usd', 'net_flow_usd', 'mev_trades_flagged'],
      rows: [
        ['Uniswap Universal Router', 4120, '$58,400,000', 3650, '$51,200,000', '+$7,200,000', 48],
        ['1inch Aggregator V5', 1840, '$26,100,000', 1690, '$24,800,000', '+$1,300,000', 14],
        ['CowSwap GPv2 (Batch Auction)', 940, '$18,500,000', 1120, '$22,100,000', '-$3,600,000', 0],
        ['Telegram Bot (Banana Gun)', 3120, '$14,200,000', 2980, '$13,800,000', '+$400,000', 86],
        ['Direct Pool Interaction (MEV Arb)', 680, '$12,400,000', 710, '$12,900,000', '-$500,000', 142]
      ],
      executionTimeMs: 168,
      rowsAffected: 5
    },
    sqlByDialect: {
      'Dune SQL (Trino)': `-- Dune SQL: Router Flow & MEV Breakdown
SELECT 
    COALESCE(labels.name, 'Direct / Unknown Contract') AS router_name,
    COUNT(CASE WHEN token_bought_address = {{token_address}} THEN 1 END) AS buy_count,
    SUM(CASE WHEN token_bought_address = {{token_address}} THEN amount_usd ELSE 0 END) AS buy_vol_usd,
    COUNT(CASE WHEN token_sold_address = {{token_address}} THEN 1 END) AS sell_count,
    SUM(CASE WHEN token_sold_address = {{token_address}} THEN amount_usd ELSE 0 END) AS sell_vol_usd,
    SUM(CASE WHEN token_bought_address = {{token_address}} THEN amount_usd ELSE -amount_usd END) AS net_flow_usd
FROM dex.trades t
LEFT JOIN ethereum.labels labels 
       ON labels.address = t.tx_to 
      AND labels.type = 'router'
WHERE (token_bought_address = {{token_address}} OR token_sold_address = {{token_address}})
  AND block_time >= NOW() - INTERVAL '24' HOUR
GROUP BY 1
ORDER BY (buy_vol_usd + sell_vol_usd) DESC;`,

      'Google BigQuery': `-- BigQuery: DEX Router Buy vs Sell Flow
SELECT 
    CASE 
        WHEN tx.to_address = '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad' THEN 'Uniswap Universal Router'
        WHEN tx.to_address = '0x1111111254fb6c44bac0bed2854e76f90643097d' THEN '1inch V5'
        WHEN tx.to_address = '0x9008d19f58aabd9ed0d60971565aa8510560ab41' THEN 'CoW Protocol'
        ELSE 'Other Router / Direct Swap'
    END AS router_name,
    COUNT(1) AS trade_count,
    SUM(trade_amount_usd) AS total_volume_usd
FROM \`crypto_ethereum.dex_trades\` trades
JOIN \`bigquery-public-data.crypto_ethereum.transactions\` tx 
  ON tx.hash = trades.tx_hash
WHERE token_address = LOWER(@token_address)
  AND trades.block_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
GROUP BY 1
ORDER BY 3 DESC;`,

      'ClickHouse EVM': `-- ClickHouse: Router Split Real-time
SELECT 
    router_label,
    countIf(action = 'BUY') AS buy_count,
    sumIf(amount_usd, action = 'BUY') AS buy_vol_usd,
    countIf(action = 'SELL') AS sell_count,
    sumIf(amount_usd, action = 'SELL') AS sell_vol_usd
FROM evm_ethereum.dex_trades
WHERE token_address = {token_address:String}
  AND block_timestamp >= now() - INTERVAL 24 HOUR
GROUP BY router_label
ORDER BY (buy_vol_usd + sell_vol_usd) DESC;`,

      'PostgreSQL': `-- PostgreSQL: Router Breakdown
SELECT 
    router_name,
    COUNT(*) AS total_swaps,
    SUM(amount_usd) AS volume_usd
FROM dex_swaps
WHERE token_address = :token_address
  AND block_timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY 1
ORDER BY 3 DESC;`
    }
  },
  {
    id: 'mint_burn_supply_accounting',
    title: 'Mint & Burn History & Circulating Supply Accounting',
    category: 'Security & Audit',
    description: 'Tracks all token creation (mint events where from = 0x0) and token destruction (burn events where to = 0x0 or 0xdead) to verify inflation and true circulating supply.',
    complexity: 'Standard',
    targetTables: ['erc20_ethereum.evt_Transfer'],
    keyColumns: ['from', 'to', 'value', 'evt_block_time', 'evt_tx_hash'],
    performanceTips: [
      'Filter strictly on from = 0x0000...0000 or to IN (0x0000...0000, 0x0000...dead).',
      'Track cumulative sum of (mint - burn) over block height to detect unauthorized mint exploits.'
    ],
    mockResult: {
      columns: ['event_type', 'tx_count', 'total_amount_tokens', 'usd_value', 'latest_block', 'latest_timestamp'],
      rows: [
        ['Token Mints (Genesis / Timelock)', 4, '1,000,000,000', '$8,420,000,000', 10861674, '2020-09-16 11:23:42'],
        ['Token Burns (Dead Address)', 1240, '14,200,000', '$119,564,000', 21458890, '2026-11-06 12:48:10'],
        ['Token Burns (Zero Address)', 85, '2,840,000', '$23,912,800', 21450210, '2026-11-05 18:20:15']
      ],
      executionTimeMs: 110,
      rowsAffected: 3
    },
    sqlByDialect: {
      'Dune SQL (Trino)': `-- Dune SQL: Mint & Burn Accounting
SELECT 
    CASE 
        WHEN "from" = 0x0000000000000000000000000000000000000000 THEN 'MINT'
        WHEN "to" = 0x0000000000000000000000000000000000000000 OR "to" = 0x000000000000000000000000000000000000dead THEN 'BURN'
    END AS supply_event_type,
    COUNT(*) AS event_count,
    SUM(CAST(value AS DOUBLE) / 1e18) AS total_tokens,
    MAX(evt_block_time) AS latest_event_time
FROM erc20_ethereum.evt_Transfer
WHERE contract_address = {{token_address}}
  AND (
      "from" = 0x0000000000000000000000000000000000000000
      OR "to" = 0x0000000000000000000000000000000000000000
      OR "to" = 0x000000000000000000000000000000000000dead
  )
GROUP BY 1;`,

      'Google BigQuery': `-- BigQuery: Mint vs Burn Audit
SELECT 
    CASE 
        WHEN topics[OFFSET(1)] = '0x0000000000000000000000000000000000000000000000000000000000000000' THEN 'MINT'
        ELSE 'BURN'
    END AS action,
    COUNT(1) AS tx_count,
    SUM(SAFE_CAST(CONCAT('0x', data) AS FLOAT64) / 1e18) AS tokens_amount
FROM \`bigquery-public-data.crypto_ethereum.logs\`
WHERE address = LOWER(@token_address)
  AND topics[OFFSET(0)] = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
  AND (
      topics[OFFSET(1)] = '0x0000000000000000000000000000000000000000000000000000000000000000'
      OR topics[OFFSET(2)] = '0x0000000000000000000000000000000000000000000000000000000000000000'
      OR topics[OFFSET(2)] LIKE '%000000000000000000000000000000000000dead'
  )
GROUP BY 1;`,

      'ClickHouse EVM': `-- ClickHouse: Supply Changes
SELECT 
    event_type,
    count(),
    sum(amount) AS total_tokens,
    max(block_timestamp) AS last_seen
FROM evm_ethereum.token_supply_events
WHERE token_address = {token_address:String}
GROUP BY event_type;`,

      'PostgreSQL': `-- PostgreSQL: Mint/Burn Events
SELECT 
    event_type,
    COUNT(*),
    SUM(amount)
FROM token_supply_events
WHERE token_address = :token_address
GROUP BY 1;`
    }
  },
  {
    id: 'wash_trading_detection',
    title: 'Suspicious Wash Trading & Circular Transfer Detection',
    category: 'Security & Audit',
    description: 'Detects circular transfers (e.g. Wallet A -> Wallet B -> Wallet C -> Wallet A within 12 blocks) indicative of volume falsification or market manipulation.',
    complexity: 'Advanced',
    targetTables: ['erc20_ethereum.evt_Transfer'],
    keyColumns: ['from', 'to', 'value', 'evt_block_number'],
    performanceTips: [
      'Self-join with a maximum block difference (e.g. t3.block - t1.block <= 12) to bound graph traversal.',
      'Require identical or near-identical token values (+/- 2% for gas fees).'
    ],
    mockResult: {
      columns: ['ring_length', 'wallet_origin', 'cycle_path', 'cycled_token_amount', 'block_span', 'risk_flag'],
      rows: [
        ['3-hop cycle', '0x71a...92b', 'A -> B -> C -> A', '250,000 UNI', '4 blocks (~48s)', 'HIGH RISK: Cyclic Wash Trade'],
        ['2-hop ping-pong', '0x14f...e31', 'A -> B -> A', '180,000 UNI', '2 blocks (~24s)', 'HIGH RISK: Self-Trading Volume Inflate']
      ],
      executionTimeMs: 310,
      rowsAffected: 2
    },
    sqlByDialect: {
      'Dune SQL (Trino)': `-- Dune SQL: Circular Wash Trade Detection (3-hop cycle)
WITH transfers AS (
    SELECT 
        "from" AS sender,
        "to" AS receiver,
        CAST(value AS DOUBLE) / 1e18 AS amount,
        evt_block_number,
        evt_tx_hash
    FROM erc20_ethereum.evt_Transfer
    WHERE contract_address = {{token_address}}
      AND evt_block_time >= NOW() - INTERVAL '6' HOUR
)
SELECT 
    t1.sender AS origin_wallet,
    t1.amount AS cycled_amount,
    (t3.evt_block_number - t1.evt_block_number) AS block_latency,
    t1.evt_tx_hash AS tx_1,
    t2.evt_tx_hash AS tx_2,
    t3.evt_tx_hash AS tx_3
FROM transfers t1
JOIN transfers t2 
  ON t1.receiver = t2.sender 
 AND t2.evt_block_number BETWEEN t1.evt_block_number AND t1.evt_block_number + 12
 AND ABS(t1.amount - t2.amount) / t1.amount < 0.05
JOIN transfers t3 
  ON t2.receiver = t3.sender 
 AND t3.receiver = t1.sender -- Returns back to original sender
 AND t3.evt_block_number BETWEEN t2.evt_block_number AND t1.evt_block_number + 12
 AND ABS(t2.amount - t3.amount) / t2.amount < 0.05
ORDER BY t1.evt_block_number DESC
LIMIT 20;`,

      'Google BigQuery': `-- BigQuery: Self-trading and Ring Transfers
WITH txs AS (
    SELECT 
        CONCAT('0x', SUBSTR(topics[OFFSET(1)], 27, 40)) AS from_addr,
        CONCAT('0x', SUBSTR(topics[OFFSET(2)], 27, 40)) AS to_addr,
        SAFE_CAST(CONCAT('0x', data) AS FLOAT64) / 1e18 AS amount,
        block_number,
        transaction_hash
    FROM \`bigquery-public-data.crypto_ethereum.logs\`
    WHERE address = LOWER(@token_address)
      AND topics[OFFSET(0)] = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
      AND block_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 6 HOUR)
)
SELECT 
    t1.from_addr AS origin,
    t1.amount,
    (t2.block_number - t1.block_number) AS blocks_diff,
    t1.transaction_hash AS hop1,
    t2.transaction_hash AS hop2
FROM txs t1
JOIN txs t2 
  ON t1.to_addr = t2.from_addr 
 AND t2.to_addr = t1.from_addr
 AND t2.block_number BETWEEN t1.block_number AND t1.block_number + 10
WHERE ABS(t1.amount - t2.amount) / t1.amount < 0.02
LIMIT 20;`,

      'ClickHouse EVM': `-- ClickHouse: Ring Pattern Detection
SELECT 
    t1.from_address AS origin,
    t1.amount,
    (t2.block_number - t1.block_number) AS block_span
FROM evm_ethereum.token_transfers t1
JOIN evm_ethereum.token_transfers t2 
  ON t1.to_address = t2.from_address 
 AND t2.to_address = t1.from_address
WHERE t1.token_address = {token_address:String}
  AND t2.block_number BETWEEN t1.block_number AND t1.block_number + 10
LIMIT 20;`,

      'PostgreSQL': `-- PostgreSQL: Ping-Pong Wash Trades
SELECT 
    t1.from_address,
    t1.amount,
    t2.block_number - t1.block_number AS block_delay
FROM token_transfers t1
JOIN token_transfers t2 
  ON t1.to_address = t2.from_address 
 AND t2.to_address = t1.from_address
WHERE t1.token_address = :token_address
  AND t2.block_number BETWEEN t1.block_number AND t1.block_number + 10
LIMIT 20;`
    }
  }
];
