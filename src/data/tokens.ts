import {
  TokenProfile,
  WhaleHolder,
  HolderDistributionTier,
  HistoricalHolderSnapshot,
  LiveTokenTransfer,
  PriceCandle,
  OnChainNode,
  OnChainLink,
  TradingPair,
  UserPortfolio,
  TradeOrder
} from '../types/token';

export const SUPPORTED_TOKENS: Record<string, TokenProfile> = {
  CT: {
    address: '0x71a56bc22998a44d852a3b984180801249b6b92b',
    name: 'CoreToken',
    symbol: 'CT',
    decimals: 18,
    totalSupply: '500000000000000000000000000',
    totalSupplyFormatted: '500,000,000 CT',
    circulatingSupply: '225000000000000000000000000',
    circulatingSupplyFormatted: '225,000,000 CT',
    deployerAddress: '0x1a9C8182C09F50C8318d769245beA52c32BE35BC',
    deploymentBlock: 19450000,
    deploymentDate: '2024-01-18 10:14:00 UTC',
    verified: true,
    compilerVersion: 'v0.8.24+commit.e11b9ed9',
    license: 'MIT',
    standard: 'ERC-20 + EIP-2612 (Permit)',
    hasPermit: true,
    isProxy: false,
    description: 'EtherPulse Native Ecosystem Utility Token (CT). Grants 25% trading fee discounts, automated liquidity staking rewards, zero-gas permit swaps, and community protocol governance.',
    website: 'https://etherpulse.io',
    explorerUrl: 'https://etherscan.io/token/0x71a56bc22998a44d852a3b984180801249b6b92b',
    currentPriceUsd: 2.48,
    currentPriceEth: 0.000789,
    priceChange1h: 0.85,
    priceChange24h: 6.42,
    priceChange7d: 18.9,
    high24h: 2.62,
    low24h: 2.31,
    marketCapUsd: 558000000,
    fdvUsd: 1240000000,
    volume24hUsd: 48920000,
    liquidityUsd: 42100000,
    securityAudit: {
      buyTaxPercent: 0,
      sellTaxPercent: 0,
      isOwnershipRenounced: true,
      ownerAddress: '0x1a9C8182C09F50C8318d769245beA52c32BE35BC (EtherPulse Timelock)',
      isMintable: false,
      canBlacklist: false,
      canPauseTransfers: false,
      hasMaxTxAmount: false,
      safetyScore: 99,
      riskLevel: 'LOW',
      vulnerabilitiesFound: []
    },
    pools: [
      {
        dexName: 'Uniswap V3',
        poolAddress: '0x3a928e4480029b9f584711994801192849b6b92b',
        pairSymbol: 'CT / WETH (0.3%)',
        feeTierPercent: 0.3,
        liquidityUsd: 28400000,
        volume24hUsd: 34100000,
        tokenReserve: '11,450,000 CT',
        ethReserve: '4,520 WETH'
      },
      {
        dexName: 'Uniswap V3',
        poolAddress: '0x8b919420048184818481992849b6b92b84819928',
        pairSymbol: 'CT / USDT (0.05%)',
        feeTierPercent: 0.05,
        liquidityUsd: 13700000,
        volume24hUsd: 14820000,
        tokenReserve: '5,520,000 CT',
        ethReserve: '13,689,600 USDT'
      }
    ]
  },
  UNI: {
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    name: 'Uniswap',
    symbol: 'UNI',
    decimals: 18,
    totalSupply: '1000000000000000000000000000',
    totalSupplyFormatted: '1,000,000,000 UNI',
    circulatingSupply: '753766667000000000000000000',
    circulatingSupplyFormatted: '753,766,667 UNI',
    deployerAddress: '0x41653c7d61609D856f29355E404F310Ec4142Cfb',
    deploymentBlock: 10861674,
    deploymentDate: '2020-09-16 11:23:42 UTC',
    verified: true,
    compilerVersion: 'v0.5.16+commit.9c3226ce',
    license: 'GPL-3.0',
    standard: 'ERC-20 + EIP-2612 (Permit)',
    hasPermit: true,
    isProxy: false,
    description: 'Uniswap governance token (UNI) powering the leading decentralized automated liquidity protocol on Ethereum.',
    website: 'https://uniswap.org',
    explorerUrl: 'https://etherscan.io/token/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    currentPriceUsd: 8.42,
    currentPriceEth: 0.00268,
    priceChange1h: 0.45,
    priceChange24h: 3.82,
    priceChange7d: 12.4,
    high24h: 8.68,
    low24h: 8.05,
    marketCapUsd: 6346715336,
    fdvUsd: 8420000000,
    volume24hUsd: 284520190,
    liquidityUsd: 194820000,
    securityAudit: {
      buyTaxPercent: 0,
      sellTaxPercent: 0,
      isOwnershipRenounced: true,
      ownerAddress: '0x1a9C8182C09F50C8318d769245beA52c32BE35BC (Timelock Governance)',
      isMintable: true, // Mint capped at 2%/year inflation after 4 years by timelock
      canBlacklist: false,
      canPauseTransfers: false,
      hasMaxTxAmount: false,
      safetyScore: 98,
      riskLevel: 'LOW',
      vulnerabilitiesFound: []
    },
    pools: [
      {
        dexName: 'Uniswap V3',
        poolAddress: '0x1d42064Fc4Beb5F8aAF85F4617AE8b3b5B8Bd801',
        pairSymbol: 'UNI / WETH (0.3%)',
        feeTierPercent: 0.3,
        liquidityUsd: 94250000,
        volume24hUsd: 142100000,
        tokenReserve: '5,580,240 UNI',
        ethReserve: '15,120 WETH'
      },
      {
        dexName: 'Uniswap V3',
        poolAddress: '0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36',
        pairSymbol: 'UNI / USDT (0.3%)',
        feeTierPercent: 0.3,
        liquidityUsd: 48310000,
        volume24hUsd: 74300000,
        tokenReserve: '2,860,110 UNI',
        ethReserve: '24,190,000 USDT'
      },
      {
        dexName: 'Uniswap V2',
        poolAddress: '0xd3d2E2692501A5c9Ca623199D38826e513033a17',
        pairSymbol: 'UNI / WETH',
        feeTierPercent: 0.3,
        liquidityUsd: 31200000,
        volume24hUsd: 38200000,
        tokenReserve: '1,850,000 UNI',
        ethReserve: '4,960 WETH'
      },
      {
        dexName: 'SushiSwap',
        poolAddress: '0xda4320857144e138a4F90F2cEb4B680dFE17C5B1',
        pairSymbol: 'UNI / WETH',
        feeTierPercent: 0.3,
        liquidityUsd: 21060000,
        volume24hUsd: 29920000,
        tokenReserve: '1,250,000 UNI',
        ethReserve: '3,340 WETH'
      }
    ]
  },
  LINK: {
    address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    name: 'Chainlink',
    symbol: 'LINK',
    decimals: 18,
    totalSupply: '1000000000000000000000000000',
    totalSupplyFormatted: '1,000,000,000 LINK',
    circulatingSupply: '608099970000000000000000000',
    circulatingSupplyFormatted: '608,100,000 LINK',
    deployerAddress: '0xE6b9d560c5a7C10B70f3f2e46b94002C937a0774',
    deploymentBlock: 4299304,
    deploymentDate: '2017-09-19 15:45:00 UTC',
    verified: true,
    compilerVersion: 'v0.4.11+commit.68ef5807',
    license: 'MIT',
    standard: 'ERC-677 (ERC-20 Compatible + transferAndCall)',
    hasPermit: false,
    isProxy: false,
    description: 'Chainlink decentralized oracle network token connecting smart contracts to off-chain data feeds and APIs.',
    website: 'https://chain.link',
    explorerUrl: 'https://etherscan.io/token/0x514910771AF9Ca656af840dff83E8264EcF986CA',
    currentPriceUsd: 14.85,
    currentPriceEth: 0.00473,
    priceChange1h: -0.12,
    priceChange24h: 5.14,
    priceChange7d: 8.65,
    high24h: 15.22,
    low24h: 14.10,
    marketCapUsd: 9030284554,
    fdvUsd: 14850000000,
    volume24hUsd: 340210000,
    liquidityUsd: 145800000,
    securityAudit: {
      buyTaxPercent: 0,
      sellTaxPercent: 0,
      isOwnershipRenounced: true,
      ownerAddress: '0x99A7c4cDdaFbf18C28D05e94084F8e33F890a880 (Multisig)',
      isMintable: false,
      canBlacklist: false,
      canPauseTransfers: false,
      hasMaxTxAmount: false,
      safetyScore: 99,
      riskLevel: 'LOW',
      vulnerabilitiesFound: []
    },
    pools: [
      {
        dexName: 'Uniswap V3',
        poolAddress: '0xa6Cc3C2531FdaA3Ae5132c71252bc57A472a579b',
        pairSymbol: 'LINK / WETH (0.3%)',
        feeTierPercent: 0.3,
        liquidityUsd: 82400000,
        volume24hUsd: 168300000,
        tokenReserve: '2,770,000 LINK',
        ethReserve: '13,100 WETH'
      },
      {
        dexName: 'Uniswap V3',
        poolAddress: '0xFAD57d2039C21811C8F2B5D5B65308AA99D31559',
        pairSymbol: 'LINK / USDC (0.05%)',
        feeTierPercent: 0.05,
        liquidityUsd: 41200000,
        volume24hUsd: 91400000,
        tokenReserve: '1,385,000 LINK',
        ethReserve: '20,600,000 USDC'
      }
    ]
  },
  PEPE: {
    address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
    name: 'Pepe',
    symbol: 'PEPE',
    decimals: 18,
    totalSupply: '420690000000000000000000000000000',
    totalSupplyFormatted: '420,690,000,000,000 PEPE',
    circulatingSupply: '420690000000000000000000000000000',
    circulatingSupplyFormatted: '420,690,000,000,000 PEPE',
    deployerAddress: '0x2F715364177c36a445484196B6858e92F144D9F0',
    deploymentBlock: 17046808,
    deploymentDate: '2023-04-14 20:38:23 UTC',
    verified: true,
    compilerVersion: 'v0.8.19+commit.7dd66d80',
    license: 'MIT',
    standard: 'ERC-20',
    hasPermit: false,
    isProxy: false,
    description: 'High-volume community meme token on Ethereum with 0% tax and renounced contract ownership.',
    website: 'https://pepe.vip',
    explorerUrl: 'https://etherscan.io/token/0x6982508145454Ce325dDbE47a25d4ec3d2311933',
    currentPriceUsd: 0.00000942,
    currentPriceEth: 0.000000003,
    priceChange1h: 1.85,
    priceChange24h: 8.92,
    priceChange7d: 24.3,
    high24h: 0.00000995,
    low24h: 0.00000858,
    marketCapUsd: 3962900000,
    fdvUsd: 3962900000,
    volume24hUsd: 612400000,
    liquidityUsd: 88600000,
    securityAudit: {
      buyTaxPercent: 0,
      sellTaxPercent: 0,
      isOwnershipRenounced: true,
      ownerAddress: '0x0000000000000000000000000000000000000000 (Dead address)',
      isMintable: false,
      canBlacklist: false,
      canPauseTransfers: false,
      hasMaxTxAmount: false,
      safetyScore: 94,
      riskLevel: 'LOW',
      vulnerabilitiesFound: []
    },
    pools: [
      {
        dexName: 'Uniswap V3',
        poolAddress: '0x11950d141ecb863f01007add7d1a342041227b58',
        pairSymbol: 'PEPE / WETH (0.3%)',
        feeTierPercent: 0.3,
        liquidityUsd: 59400000,
        volume24hUsd: 388000000,
        tokenReserve: '3,150,000,000,000 PEPE',
        ethReserve: '9,450 WETH'
      },
      {
        dexName: 'Uniswap V2',
        poolAddress: '0xA43fe16908251ee70EF74718545e4FE6C5cCEc9f',
        pairSymbol: 'PEPE / WETH',
        feeTierPercent: 0.3,
        liquidityUsd: 29200000,
        volume24hUsd: 142000000,
        tokenReserve: '1,550,000,000,000 PEPE',
        ethReserve: '4,640 WETH'
      }
    ]
  },
  AAVE: {
    address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    name: 'Aave',
    symbol: 'AAVE',
    decimals: 18,
    totalSupply: '16000000000000000000000000',
    totalSupplyFormatted: '16,000,000 AAVE',
    circulatingSupply: '14930000000000000000000000',
    circulatingSupplyFormatted: '14,930,000 AAVE',
    deployerAddress: '0xb2C043813B13C4D116a3C5aE74B0868f8eAf292c',
    deploymentBlock: 10984852,
    deploymentDate: '2020-10-03 16:32:04 UTC',
    verified: true,
    compilerVersion: 'v0.7.5+commit.eb77ed08',
    license: 'AGPL-3.0',
    standard: 'ERC-20 + EIP-2612',
    hasPermit: true,
    isProxy: true,
    proxyImplementation: '0x2C465e6484a0c86847c2020B13b28C3d76378A52',
    description: 'Governance token of the Aave protocol for decentralized crypto lending and borrowing money markets.',
    website: 'https://aave.com',
    explorerUrl: 'https://etherscan.io/token/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    currentPriceUsd: 162.30,
    currentPriceEth: 0.0516,
    priceChange1h: 0.28,
    priceChange24h: 4.31,
    priceChange7d: 15.8,
    high24h: 166.50,
    low24h: 154.20,
    marketCapUsd: 2423139000,
    fdvUsd: 2596800000,
    volume24hUsd: 184500000,
    liquidityUsd: 112000000,
    securityAudit: {
      buyTaxPercent: 0,
      sellTaxPercent: 0,
      isOwnershipRenounced: false,
      ownerAddress: '0xEC568fffba86c094cf06b22134443F197876165e (Aave Short Executor)',
      isMintable: true, // Only by governance for safety module shortfall
      canBlacklist: false,
      canPauseTransfers: false,
      hasMaxTxAmount: false,
      safetyScore: 96,
      riskLevel: 'LOW',
      vulnerabilitiesFound: []
    },
    pools: [
      {
        dexName: 'Uniswap V3',
        poolAddress: '0x5ab53EE1d50eeF2C1DD3d5402789cd27bB52c1bB',
        pairSymbol: 'AAVE / WETH (0.3%)',
        feeTierPercent: 0.3,
        liquidityUsd: 68500000,
        volume24hUsd: 95400000,
        tokenReserve: '211,000 AAVE',
        ethReserve: '10,800 WETH'
      }
    ]
  },
  USDT: {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    totalSupply: '68500000000000000',
    totalSupplyFormatted: '68,500,000,000 USDT',
    circulatingSupply: '68500000000000000',
    circulatingSupplyFormatted: '68,500,000,000 USDT',
    deployerAddress: '0x36907da27BF60f11107680711ec5a4b11fE2eEa7',
    deploymentBlock: 4634748,
    deploymentDate: '2017-11-28 00:41:21 UTC',
    verified: true,
    compilerVersion: 'v0.4.18+commit.9cf6e910',
    license: 'None (Proprietary)',
    standard: 'Custom ERC-20 (No return values on transfer)',
    hasPermit: false,
    isProxy: true,
    proxyImplementation: '0xC6CDE7C39eB2f0F0095F41570af89eFC2C1Ea828',
    description: 'Fiat-collateralized stablecoin pegged to the US Dollar, operated by Tether Limited.',
    website: 'https://tether.to',
    explorerUrl: 'https://etherscan.io/token/0xdAC17F958D2ee523a2206206994597C13D831ec7',
    currentPriceUsd: 1.0002,
    currentPriceEth: 0.000318,
    priceChange1h: 0.01,
    priceChange24h: 0.02,
    priceChange7d: -0.01,
    high24h: 1.0008,
    low24h: 0.9996,
    marketCapUsd: 68513700000,
    fdvUsd: 68513700000,
    volume24hUsd: 38450000000,
    liquidityUsd: 840000000,
    securityAudit: {
      buyTaxPercent: 0,
      sellTaxPercent: 0,
      isOwnershipRenounced: false,
      ownerAddress: '0xC6CDE7C39eB2f0F0095F41570af89eFC2C1Ea828 (Tether Multisig)',
      isMintable: true,
      canBlacklist: true, // Tether addBlackList()
      canPauseTransfers: true, // Tether pause()
      hasMaxTxAmount: false,
      safetyScore: 82,
      riskLevel: 'MEDIUM',
      vulnerabilitiesFound: [
        'Centralized Blacklist: Contract owner can freeze token balances with addBlackList(address)',
        'Pausable: Transfers can be paused globally by the owner address',
        'Upgradeability: Proxy implementation can be modified by the multi-sig admin'
      ]
    },
    pools: [
      {
        dexName: 'Uniswap V3',
        poolAddress: '0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36',
        pairSymbol: 'USDT / WETH (0.05%)',
        feeTierPercent: 0.05,
        liquidityUsd: 340000000,
        volume24hUsd: 890000000,
        tokenReserve: '170,000,000 USDT',
        ethReserve: '54,200 WETH'
      }
    ]
  }
};

/**
 * Generate Top Whale Wallets for a given token
 */
export function getWhaleWallets(symbol: string): WhaleHolder[] {
  const token = SUPPORTED_TOKENS[symbol] || SUPPORTED_TOKENS.UNI;
  const price = token.currentPriceUsd;

  if (symbol === 'UNI') {
    return [
      {
        rank: 1,
        address: '0x1a9C8182C09F50C8318d769245beA52c32BE35BC',
        ens: 'timelock.uniswap.eth',
        label: 'Uniswap Timelock Governance Treasury',
        category: 'Team Treasury',
        balance: 182450000,
        balanceFormatted: '182,450,000 UNI',
        valueUsd: 182450000 * price,
        sharePercent: 18.25,
        change24hPercent: 0.0,
        firstSeenBlock: 10861674,
        lastActiveTimestamp: Date.now() - 3600000 * 14,
        txCount: 420
      },
      {
        rank: 2,
        address: '0x1d42064Fc4Beb5F8aAF85F4617AE8b3b5B8Bd801',
        ens: 'uniswap-v3-pool.eth',
        label: 'Uniswap V3 UNI/ETH Pool',
        category: 'Liquidity Pool',
        balance: 48920000,
        balanceFormatted: '48,920,000 UNI',
        valueUsd: 48920000 * price,
        sharePercent: 4.89,
        change24hPercent: -0.42,
        firstSeenBlock: 12369621,
        lastActiveTimestamp: Date.now() - 12000,
        txCount: 184920
      },
      {
        rank: 3,
        address: '0x28C6c06298d514Db089934071355E5743bf21d60',
        ens: 'binance-14.eth',
        label: 'Binance: Hot Wallet 14',
        category: 'Exchange Hot Wallet',
        balance: 39400000,
        balanceFormatted: '39,400,000 UNI',
        valueUsd: 39400000 * price,
        sharePercent: 3.94,
        change24hPercent: 1.15,
        firstSeenBlock: 10900000,
        lastActiveTimestamp: Date.now() - 45000,
        txCount: 948102
      },
      {
        rank: 4,
        address: '0x503828976D22510aad0201ac7EC88293211A23Da',
        ens: 'coinbase-prime.eth',
        label: 'Coinbase Custody / Prime',
        category: 'Exchange Hot Wallet',
        balance: 31200000,
        balanceFormatted: '31,200,000 UNI',
        valueUsd: 31200000 * price,
        sharePercent: 3.12,
        change24hPercent: -0.05,
        firstSeenBlock: 10870000,
        lastActiveTimestamp: Date.now() - 180000,
        txCount: 310500
      },
      {
        rank: 5,
        address: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503',
        ens: 'binance-cold.eth',
        label: 'Binance: Cold Storage 2',
        category: 'Exchange Hot Wallet',
        balance: 24800000,
        balanceFormatted: '24,800,000 UNI',
        valueUsd: 24800000 * price,
        sharePercent: 2.48,
        change24hPercent: 0.0,
        firstSeenBlock: 11100000,
        lastActiveTimestamp: Date.now() - 86400000 * 3,
        txCount: 84
      },
      {
        rank: 6,
        address: '0x3DdfA8eC3052539b6C9549F12cEA2C295cfF5296',
        ens: 'a16z-crypto-vault.eth',
        label: 'Andreessen Horowitz (a16z) Custody',
        category: 'Whale',
        balance: 19500000,
        balanceFormatted: '19,500,000 UNI',
        valueUsd: 19500000 * price,
        sharePercent: 1.95,
        change24hPercent: 0.0,
        firstSeenBlock: 10862000,
        lastActiveTimestamp: Date.now() - 86400000 * 45,
        txCount: 16
      },
      {
        rank: 7,
        address: '0x000000000000000000000000000000000000dead',
        label: 'Proof of Burn Address',
        category: 'Staking / Governance',
        balance: 14200000,
        balanceFormatted: '14,200,000 UNI',
        valueUsd: 14200000 * price,
        sharePercent: 1.42,
        change24hPercent: 0.02,
        firstSeenBlock: 10861674,
        lastActiveTimestamp: Date.now() - 3600000 * 2,
        txCount: 1240
      },
      {
        rank: 8,
        address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
        ens: 'vitalik.eth',
        label: 'Vitalik Buterin (Identified)',
        category: 'Whale',
        balance: 8450000,
        balanceFormatted: '8,450,000 UNI',
        valueUsd: 8450000 * price,
        sharePercent: 0.85,
        change24hPercent: 0.0,
        firstSeenBlock: 10862500,
        lastActiveTimestamp: Date.now() - 86400000 * 12,
        txCount: 1492
      },
      {
        rank: 9,
        address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        ens: 'kraken-hot.eth',
        label: 'Kraken: Hot Wallet 4',
        category: 'Exchange Hot Wallet',
        balance: 7200000,
        balanceFormatted: '7,200,000 UNI',
        valueUsd: 7200000 * price,
        sharePercent: 0.72,
        change24hPercent: -0.34,
        firstSeenBlock: 10920000,
        lastActiveTimestamp: Date.now() - 60000,
        txCount: 421000
      },
      {
        rank: 10,
        address: '0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1',
        label: 'Optimism Gateway Bridge Escrow',
        category: 'Liquidity Pool',
        balance: 6180000,
        balanceFormatted: '6,180,000 UNI',
        valueUsd: 6180000 * price,
        sharePercent: 0.62,
        change24hPercent: 0.88,
        firstSeenBlock: 12500000,
        lastActiveTimestamp: Date.now() - 15000,
        txCount: 58200
      }
    ];
  }

  // Generic whale generation for other tokens
  const total = Number(BigInt(token.totalSupply) / BigInt(10 ** token.decimals));
  return [
    {
      rank: 1,
      address: '0x40B3876ab3E614b5d89aB3A0721284581177610e',
      ens: `${symbol.toLowerCase()}-treasury.eth`,
      label: `${symbol} Protocol Treasury Reserve`,
      category: 'Team Treasury',
      balance: Math.round(total * 0.22),
      balanceFormatted: `${(total * 0.22).toLocaleString()} ${symbol}`,
      valueUsd: total * 0.22 * price,
      sharePercent: 22.0,
      change24hPercent: 0.0,
      firstSeenBlock: token.deploymentBlock,
      lastActiveTimestamp: Date.now() - 86400000 * 2,
      txCount: 145
    },
    {
      rank: 2,
      address: token.pools[0]?.poolAddress || '0x1d42064Fc4Beb5F8aAF85F4617AE8b3b5B8Bd801',
      ens: 'uniswap-v3-primary.eth',
      label: `Uniswap V3 ${symbol}/WETH Primary Pool`,
      category: 'Liquidity Pool',
      balance: Math.round(total * 0.095),
      balanceFormatted: `${(total * 0.095).toLocaleString()} ${symbol}`,
      valueUsd: total * 0.095 * price,
      sharePercent: 9.5,
      change24hPercent: -0.15,
      firstSeenBlock: token.deploymentBlock + 500,
      lastActiveTimestamp: Date.now() - 12000,
      txCount: 94820
    },
    {
      rank: 3,
      address: '0x28C6c06298d514Db089934071355E5743bf21d60',
      ens: 'binance-14.eth',
      label: 'Binance: Hot Wallet 14',
      category: 'Exchange Hot Wallet',
      balance: Math.round(total * 0.068),
      balanceFormatted: `${(total * 0.068).toLocaleString()} ${symbol}`,
      valueUsd: total * 0.068 * price,
      sharePercent: 6.8,
      change24hPercent: 1.4,
      firstSeenBlock: token.deploymentBlock + 2000,
      lastActiveTimestamp: Date.now() - 40000,
      txCount: 650000
    },
    {
      rank: 4,
      address: '0x503828976D22510aad0201ac7EC88293211A23Da',
      ens: 'coinbase-exchange.eth',
      label: 'Coinbase: Exchange Hot Wallet',
      category: 'Exchange Hot Wallet',
      balance: Math.round(total * 0.045),
      balanceFormatted: `${(total * 0.045).toLocaleString()} ${symbol}`,
      valueUsd: total * 0.045 * price,
      sharePercent: 4.5,
      change24hPercent: -0.3,
      firstSeenBlock: token.deploymentBlock + 2500,
      lastActiveTimestamp: Date.now() - 120000,
      txCount: 420000
    },
    {
      rank: 5,
      address: '0x3DdfA8eC3052539b6C9549F12cEA2C295cfF5296',
      label: 'Institutional Whale 0x3D...5296',
      category: 'Whale',
      balance: Math.round(total * 0.032),
      balanceFormatted: `${(total * 0.032).toLocaleString()} ${symbol}`,
      valueUsd: total * 0.032 * price,
      sharePercent: 3.2,
      change24hPercent: 0.0,
      firstSeenBlock: token.deploymentBlock + 3100,
      lastActiveTimestamp: Date.now() - 86400000 * 7,
      txCount: 48
    },
    {
      rank: 6,
      address: '0x000000000000000000000000000000000000dead',
      label: 'Burn Vault (Permanent Deflation)',
      category: 'Staking / Governance',
      balance: Math.round(total * 0.025),
      balanceFormatted: `${(total * 0.025).toLocaleString()} ${symbol}`,
      valueUsd: total * 0.025 * price,
      sharePercent: 2.5,
      change24hPercent: 0.01,
      firstSeenBlock: token.deploymentBlock,
      lastActiveTimestamp: Date.now() - 3600000 * 3,
      txCount: 890
    },
    {
      rank: 7,
      address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
      ens: 'vitalik.eth',
      label: 'Vitalik Buterin',
      category: 'Whale',
      balance: Math.round(total * 0.018),
      balanceFormatted: `${(total * 0.018).toLocaleString()} ${symbol}`,
      valueUsd: total * 0.018 * price,
      sharePercent: 1.8,
      change24hPercent: 0.0,
      firstSeenBlock: token.deploymentBlock + 800,
      lastActiveTimestamp: Date.now() - 86400000 * 15,
      txCount: 1420
    },
    {
      rank: 8,
      address: '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8',
      label: 'Smart Money Arbitrageur 0xBE...33E8',
      category: 'Retail Whale',
      balance: Math.round(total * 0.012),
      balanceFormatted: `${(total * 0.012).toLocaleString()} ${symbol}`,
      valueUsd: total * 0.012 * price,
      sharePercent: 1.2,
      change24hPercent: 0.45,
      firstSeenBlock: token.deploymentBlock + 4000,
      lastActiveTimestamp: Date.now() - 18000,
      txCount: 4520
    }
  ];
}

/**
 * Holder distribution tiers
 */
export function getHolderDistribution(symbol: string): HolderDistributionTier[] {
  return [
    {
      tierName: 'Mega Whales ($1M+)',
      rangeUsd: '> $1,000,000',
      holderCount: 86,
      totalTokens: 520000000,
      percentHolders: 0.02,
      percentTokens: 52.0
    },
    {
      tierName: 'Whales ($100k - $1M)',
      rangeUsd: '$100k - $1M',
      holderCount: 842,
      totalTokens: 210000000,
      percentHolders: 0.22,
      percentTokens: 21.0
    },
    {
      tierName: 'Dolphins ($10k - $100k)',
      rangeUsd: '$10k - $100k',
      holderCount: 6420,
      totalTokens: 140000000,
      percentHolders: 1.68,
      percentTokens: 14.0
    },
    {
      tierName: 'Fish ($1k - $10k)',
      rangeUsd: '$1k - $10k',
      holderCount: 42100,
      totalTokens: 85000000,
      percentHolders: 11.02,
      percentTokens: 8.5
    },
    {
      tierName: 'Shrimp (< $1k)',
      rangeUsd: '< $1,000',
      holderCount: 332500,
      totalTokens: 45000000,
      percentHolders: 87.06,
      percentTokens: 4.5
    }
  ];
}

/**
 * Generate synthetic OHLCV price candles
 */
export function generatePriceCandles(basePrice: number, count: number = 30): PriceCandle[] {
  const candles: PriceCandle[] = [];
  const now = Date.now();
  const intervalMs = 15 * 60 * 1000; // 15m intervals

  let currentClose = basePrice * 0.94;

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = now - i * intervalMs;
    const date = new Date(timestamp);
    const timeLabel = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

    const delta = (Math.random() - 0.48) * (currentClose * 0.025);
    const open = currentClose;
    const close = Math.max(open * 0.8, open + delta);
    const high = Math.max(open, close) + Math.random() * (open * 0.012);
    const low = Math.min(open, close) - Math.random() * (open * 0.012);
    const volumeUsd = Math.round(500000 + Math.random() * 2500000);
    const isBull = close >= open;
    const buyVolumeUsd = Math.round(volumeUsd * (isBull ? 0.55 + Math.random() * 0.2 : 0.35 + Math.random() * 0.15));
    const sellVolumeUsd = volumeUsd - buyVolumeUsd;

    candles.push({
      timestamp,
      timeLabel,
      open: Number(open.toFixed(6)),
      high: Number(high.toFixed(6)),
      low: Number(low.toFixed(6)),
      close: Number(close.toFixed(6)),
      volumeUsd,
      buyVolumeUsd,
      sellVolumeUsd
    });

    currentClose = close;
  }

  // Ensure last candle close equals current live price
  if (candles.length > 0) {
    candles[candles.length - 1].close = basePrice;
  }

  return candles;
}

/**
 * Initial recent token transfers
 */
export function getInitialTransfers(symbol: string): LiveTokenTransfer[] {
  const token = SUPPORTED_TOKENS[symbol] || SUPPORTED_TOKENS.UNI;
  const price = token.currentPriceUsd;
  const currentBlock = 21458920;

  const mockEntities = [
    { addr: '0x28C6c06298d514Db089934071355E5743bf21d60', ens: 'binance-14.eth', label: 'Binance 14' },
    { addr: '0x503828976D22510aad0201ac7EC88293211A23Da', ens: 'coinbase.eth', label: 'Coinbase Hot' },
    { addr: '0x1d42064Fc4Beb5F8aAF85F4617AE8b3b5B8Bd801', ens: 'uniswap-v3.eth', label: 'Uniswap V3 Pool' },
    { addr: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad', label: 'Uniswap Universal Router' },
    { addr: '0xef1c6e67703c7bd7107eed8303fbe6ec2554bf6b', label: '1inch V5 Router' },
    { addr: '0x1111111254fb6c44bac0bed2854e76f90643097d', label: '1inch Aggregator' },
    { addr: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', ens: 'vitalik.eth', label: 'Vitalik Buterin' },
    { addr: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640', label: 'Arbitrage Bot 0x88...5640' },
    { addr: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', label: 'Uniswap V2 Router' },
    { addr: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', ens: 'vitalik.eth', label: 'Smart Trader' }
  ];

  const actions: ('BUY' | 'SELL' | 'TRANSFER' | 'ADD_LIQUIDITY' | 'BURN')[] = [
    'BUY', 'SELL', 'BUY', 'TRANSFER', 'BUY', 'SELL', 'ADD_LIQUIDITY', 'BUY', 'TRANSFER', 'BURN', 'BUY', 'SELL'
  ];

  const transfers: LiveTokenTransfer[] = [];
  const now = Date.now();

  for (let i = 0; i < 15; i++) {
    const fromObj = mockEntities[Math.floor(Math.random() * mockEntities.length)];
    let toObj = mockEntities[Math.floor(Math.random() * mockEntities.length)];
    while (toObj.addr === fromObj.addr) {
      toObj = mockEntities[Math.floor(Math.random() * mockEntities.length)];
    }

    const action = actions[i % actions.length];
    const amount = symbol === 'PEPE' 
      ? Math.round(100000000 + Math.random() * 5000000000)
      : Number((100 + Math.random() * 15000).toFixed(2));
    const valueUsd = Number((amount * price).toFixed(2));
    const gasPriceGwei = Number((14 + Math.random() * 8).toFixed(1));
    const gasFeeEth = Number(((gasPriceGwei * 85000) / 1e9).toFixed(5));

    transfers.push({
      txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      blockNumber: currentBlock - i * 2,
      timestamp: now - i * 14000 - Math.floor(Math.random() * 5000),
      fromAddress: fromObj.addr,
      fromEns: fromObj.ens,
      fromLabel: fromObj.label,
      toAddress: toObj.addr,
      toEns: toObj.ens,
      toLabel: toObj.label,
      action,
      amount,
      amountFormatted: `${amount.toLocaleString()} ${symbol}`,
      valueUsd,
      gasPriceGwei,
      gasFeeEth,
      status: 'CONFIRMED',
      dexRouter: action === 'BUY' || action === 'SELL' ? 'Uniswap Universal Router' : undefined
    });
  }

  return transfers;
}

/**
 * On-chain relationship nodes and links
 */
export function getOnChainRelationships(symbol: string): { nodes: OnChainNode[]; links: OnChainLink[] } {
  const token = SUPPORTED_TOKENS[symbol] || SUPPORTED_TOKENS.UNI;
  const price = token.currentPriceUsd;

  const nodes: OnChainNode[] = [
    {
      id: 'pool_v3',
      label: `Uniswap V3 ${symbol}/WETH`,
      type: 'POOL',
      address: token.pools[0]?.poolAddress || '0x1d42064Fc4Beb5F8aAF85F4617AE8b3b5B8Bd801',
      balanceUsd: 94250000,
      activityVolume24h: 142100000
    },
    {
      id: 'router_univ',
      label: 'Universal Router',
      type: 'ROUTER',
      address: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
      balanceUsd: 1420000,
      activityVolume24h: 89000000
    },
    {
      id: 'binance_hot',
      label: 'Binance Hot 14',
      type: 'CEX',
      address: '0x28C6c06298d514Db089934071355E5743bf21d60',
      balanceUsd: 39400000 * price,
      activityVolume24h: 42000000
    },
    {
      id: 'coinbase_hot',
      label: 'Coinbase Custody',
      type: 'CEX',
      address: '0x503828976D22510aad0201ac7EC88293211A23Da',
      balanceUsd: 31200000 * price,
      activityVolume24h: 28500000
    },
    {
      id: 'treasury',
      label: `${symbol} Governance Treasury`,
      type: 'TREASURY',
      address: '0x1a9C8182C09F50C8318d769245beA52c32BE35BC',
      balanceUsd: 182450000 * price,
      activityVolume24h: 5400000
    },
    {
      id: 'whale_1',
      label: 'Alpha Whale (0x3D...5296)',
      type: 'WHALE',
      address: '0x3DdfA8eC3052539b6C9549F12cEA2C295cfF5296',
      balanceUsd: 19500000 * price,
      activityVolume24h: 3800000
    },
    {
      id: 'mev_bot',
      label: 'MEV / Arbitrage Bot',
      type: 'TRADER',
      address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
      balanceUsd: 4200000,
      activityVolume24h: 34500000
    },
    {
      id: 'vitalik_wallet',
      label: 'vitalik.eth',
      type: 'WHALE',
      address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
      balanceUsd: 8450000 * price,
      activityVolume24h: 1200000
    }
  ];

  const links: OnChainLink[] = [
    { source: 'router_univ', target: 'pool_v3', volumeUsd: 89000000, txCount: 14200, type: 'SWAP' },
    { source: 'binance_hot', target: 'router_univ', volumeUsd: 24500000, txCount: 3400, type: 'TRANSFER' },
    { source: 'coinbase_hot', target: 'router_univ', volumeUsd: 18200000, txCount: 2100, type: 'TRANSFER' },
    { source: 'mev_bot', target: 'pool_v3', volumeUsd: 34500000, txCount: 4800, type: 'SWAP' },
    { source: 'whale_1', target: 'binance_hot', volumeUsd: 3800000, txCount: 12, type: 'DEPOSIT' },
    { source: 'pool_v3', target: 'vitalik_wallet', volumeUsd: 1200000, txCount: 8, type: 'SWAP' },
    { source: 'treasury', target: 'pool_v3', volumeUsd: 5400000, txCount: 4, type: 'DEPOSIT' }
  ];

  return { nodes, links };
}

/**
 * Generate historical daily snapshots of token holder distribution
 */
export function getHistoricalHolderSnapshots(symbol: string, days: number = 30): HistoricalHolderSnapshot[] {
  const snapshots: HistoricalHolderSnapshot[] = [];
  const now = Date.now();
  const currentBlock = 21458932;
  const blocksPerDay = 7150; // ~12s per block on Ethereum

  // Base parameters per token
  let baseTop10 = 39.8;
  let baseTop50 = 58.2;
  let baseTop100 = 68.4;
  let baseHolders = 381948;
  let baseGini = 0.842;

  if (symbol === 'LINK') {
    baseTop10 = 42.5;
    baseTop50 = 61.0;
    baseTop100 = 71.5;
    baseHolders = 520400;
    baseGini = 0.855;
  } else if (symbol === 'PEPE') {
    baseTop10 = 32.1;
    baseTop50 = 51.4;
    baseTop100 = 64.0;
    baseHolders = 284100;
    baseGini = 0.812;
  } else if (symbol === 'AAVE') {
    baseTop10 = 46.2;
    baseTop50 = 65.8;
    baseTop100 = 74.2;
    baseHolders = 168200;
    baseGini = 0.871;
  } else if (symbol === 'USDT') {
    baseTop10 = 28.4;
    baseTop50 = 48.0;
    baseTop100 = 59.2;
    baseHolders = 5940000;
    baseGini = 0.795;
  }

  // Pre-planned on-chain events at relative day indices
  const eventDays: Record<number, string> = {
    [Math.floor(days * 0.85)]: 'Treasury Timelock Vesting Release',
    [Math.floor(days * 0.60)]: 'Major CEX Liquidity Inflow (Binance/Coinbase)',
    [Math.floor(days * 0.35)]: 'Whale Accumulation Wave & LP Rebalance',
    [Math.floor(days * 0.12)]: 'DEX Volume Surge & Retail Distribution'
  };

  // Generate backwards from days ago to today
  for (let i = days - 1; i >= 0; i--) {
    const timestamp = now - i * 86400000;
    const dateObj = new Date(timestamp);
    const dateStr = dateObj.toISOString().split('T')[0];
    const block = currentBlock - i * blocksPerDay;

    // Gradual redistribution trend + small realistic daily random walk
    const progress = (days - 1 - i) / Math.max(1, days - 1); // 0 at start, 1 today
    const noise = (Math.sin(i * 0.6) * 0.6) + ((i % 5) - 2) * 0.15;

    // Whales tend to slightly dilute/distribute over time as holder base grows
    const top10Initial = baseTop10 + (days > 60 ? 4.5 : 2.5);
    const top10 = Number(Math.max(15, Math.min(75, top10Initial - (top10Initial - baseTop10) * progress + noise)).toFixed(2));

    const next11to50Initial = (baseTop50 - baseTop10) + (days > 60 ? 1.5 : 0.8);
    const next11to50 = Number(Math.max(5, Math.min(35, next11to50Initial - 0.5 * progress + Math.cos(i * 0.4) * 0.3)).toFixed(2));

    const next51to100Initial = (baseTop100 - baseTop50) + 0.3;
    const next51to100 = Number(Math.max(3, Math.min(20, next51to100Initial + Math.sin(i * 0.3) * 0.2)).toFixed(2));

    const cumulativeTop50 = Number((top10 + next11to50).toFixed(2));
    const cumulativeTop100 = Number((cumulativeTop50 + next51to100).toFixed(2));
    const retail = Number(Math.max(5, 100 - cumulativeTop100).toFixed(2));

    // Holders count grew over time
    const holderGrowthFactor = 1 - (1 - progress) * (days > 60 ? 0.18 : 0.06);
    const totalHolders = Math.round(baseHolders * holderGrowthFactor);

    // Gini index tracks concentration
    const gini = Number((baseGini + (1 - progress) * 0.02 + noise * 0.003).toFixed(3));

    const dateLabel = days > 90
      ? `${dateObj.toLocaleString('en-US', { month: 'short' })} '${String(dateObj.getFullYear()).slice(2)}`
      : `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;

    const eventAnnotation = eventDays[i];

    snapshots.push({
      date: dateStr,
      dateLabel,
      timestamp,
      blockNumber: block,
      top10SharePct: top10,
      top50SharePct: cumulativeTop50,
      top100SharePct: cumulativeTop100,
      retailSharePct: retail,
      next11to50Pct: next11to50,
      next51to100Pct: next51to100,
      giniCoefficient: gini,
      totalHoldersCount: totalHolders,
      eventAnnotation
    });
  }

  // Ensure last snapshot matches current figures exactly
  if (snapshots.length > 0) {
    const last = snapshots[snapshots.length - 1];
    last.top10SharePct = baseTop10;
    last.top50SharePct = baseTop50;
    last.top100SharePct = baseTop100;
    last.next11to50Pct = Number((baseTop50 - baseTop10).toFixed(2));
    last.next51to100Pct = Number((baseTop100 - baseTop50).toFixed(2));
    last.retailSharePct = Number((100 - baseTop100).toFixed(2));
    last.giniCoefficient = baseGini;
    last.totalHoldersCount = baseHolders;
  }

  return snapshots;
}

export const getHistoricalHolderDistribution = getHistoricalHolderSnapshots;

/**
 * Live Trading Pairs available in EtherPulse
 */
export const TRADING_PAIRS: TradingPair[] = [
  {
    id: 'CT/ETH',
    baseSymbol: 'CT',
    quoteSymbol: 'ETH',
    baseDecimals: 18,
    quoteDecimals: 18,
    currentPrice: 0.000789,
    currentPriceUsd: 2.48,
    priceChange24h: 6.42,
    high24h: 0.000834,
    low24h: 0.000735,
    volume24hUsd: 34100000,
    poolAddress: '0x3a928e4480029b9f584711994801192849b6b92b',
    feeTierPercent: 0.3
  },
  {
    id: 'UNI/ETH',
    baseSymbol: 'UNI',
    quoteSymbol: 'ETH',
    baseDecimals: 18,
    quoteDecimals: 18,
    currentPrice: 0.00268,
    currentPriceUsd: 8.42,
    priceChange24h: 3.82,
    high24h: 0.00276,
    low24h: 0.00256,
    volume24hUsd: 142100000,
    poolAddress: '0x1d42064Fc4Beb5F8aAF85F4617AE8b3b5B8Bd801',
    feeTierPercent: 0.3
  },
  {
    id: 'LINK/ETH',
    baseSymbol: 'LINK',
    quoteSymbol: 'ETH',
    baseDecimals: 18,
    quoteDecimals: 18,
    currentPrice: 0.00473,
    currentPriceUsd: 14.85,
    priceChange24h: 5.14,
    high24h: 0.00485,
    low24h: 0.00449,
    volume24hUsd: 168300000,
    poolAddress: '0xa6Cc3C2531FdaA3Ae5132c71252bc57A472a579b',
    feeTierPercent: 0.3
  },
  {
    id: 'PEPE/ETH',
    baseSymbol: 'PEPE',
    quoteSymbol: 'ETH',
    baseDecimals: 18,
    quoteDecimals: 18,
    currentPrice: 0.000000003,
    currentPriceUsd: 0.00000942,
    priceChange24h: 8.92,
    high24h: 0.0000000032,
    low24h: 0.0000000027,
    volume24hUsd: 388000000,
    poolAddress: '0x11950d141ecb863f01007add7d1a342041227b58',
    feeTierPercent: 0.3
  },
  {
    id: 'CT/USDT',
    baseSymbol: 'CT',
    quoteSymbol: 'USDT',
    baseDecimals: 18,
    quoteDecimals: 6,
    currentPrice: 2.48,
    currentPriceUsd: 2.48,
    priceChange24h: 6.42,
    high24h: 2.62,
    low24h: 2.31,
    volume24hUsd: 14820000,
    poolAddress: '0x8b919420048184818481992849b6b92b84819928',
    feeTierPercent: 0.05
  },
  {
    id: 'ETH/USDT',
    baseSymbol: 'ETH',
    quoteSymbol: 'USDT',
    baseDecimals: 18,
    quoteDecimals: 6,
    currentPrice: 3142.50,
    currentPriceUsd: 3142.50,
    priceChange24h: 2.85,
    high24h: 3195.00,
    low24h: 3080.20,
    volume24hUsd: 940000000,
    poolAddress: '0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36',
    feeTierPercent: 0.05
  }
];

/**
 * Initial Demo Portfolio state (strictly simulated assets for risk-free execution)
 */
export const INITIAL_USER_PORTFOLIO: UserPortfolio = {
  demoEthBalance: 5.42,
  demoCtBalance: 12500,
  demoUsdtBalance: 10000,
  otherTokenBalances: {
    UNI: 120,
    LINK: 85,
    PEPE: 15000000,
    AAVE: 14
  },
  totalTradeCount: 14,
  totalVolumeUsd: 48520,
  realizedPnlUsd: 1420.50,
  realizedPnlPercent: 12.8
};

/**
 * Initial trade history log
 */
export const INITIAL_TRADE_HISTORY: TradeOrder[] = [
  {
    id: 'order_1',
    timestamp: Date.now() - 3600000 * 3,
    pair: 'CT/ETH',
    type: 'MARKET',
    side: 'BUY',
    price: 0.000780,
    amount: 2500,
    totalCostEth: 1.95,
    totalCostUsd: 6125,
    feeDiscountPercent: 25,
    feeAmount: 0.00438,
    status: 'FILLED',
    txHash: '0x8f192b490a0c86847c2020B13b28C3d76378A52481029481029481029481029',
    blockNumber: 21458910,
    slippageTolerancePercent: 0.5
  },
  {
    id: 'order_2',
    timestamp: Date.now() - 3600000 * 8,
    pair: 'UNI/ETH',
    type: 'MARKET',
    side: 'BUY',
    price: 0.00262,
    amount: 120,
    totalCostEth: 0.3144,
    totalCostUsd: 988,
    feeDiscountPercent: 25,
    feeAmount: 0.0007,
    status: 'FILLED',
    txHash: '0x3a928e4480029b9f584711994801192849b6b92b3a928e4480029b9f58471199',
    blockNumber: 21458750,
    slippageTolerancePercent: 0.5
  },
  {
    id: 'order_3',
    timestamp: Date.now() - 86400000 * 1.5,
    pair: 'LINK/ETH',
    type: 'LIMIT',
    side: 'BUY',
    price: 0.00450,
    targetPrice: 0.00450,
    amount: 85,
    totalCostEth: 0.3825,
    totalCostUsd: 1202,
    feeDiscountPercent: 25,
    feeAmount: 0.00086,
    status: 'FILLED',
    txHash: '0x2c465e6484a0c86847c2020B13b28C3d76378A52948192849102948192048192',
    blockNumber: 21457420,
    slippageTolerancePercent: 0.1
  }
];



