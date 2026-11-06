import { useState, useEffect, useRef, useCallback } from 'react';
import { TokenProfile, LiveTokenTransfer, PriceCandle } from '../types/token';
import { getInitialTransfers, generatePriceCandles } from '../data/tokens';

interface UseLiveBlockchainStreamProps {
  token: TokenProfile;
}

export function useLiveBlockchainStream({ token }: UseLiveBlockchainStreamProps) {
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1); // 1x, 2x, 5x
  const [currentBlock, setCurrentBlock] = useState<number>(21458932);
  const [currentPrice, setCurrentPrice] = useState<number>(token.currentPriceUsd);
  const [priceChange24h, setPriceChange24h] = useState<number>(token.priceChange24h);
  const [gasPriceGwei, setGasPriceGwei] = useState<number>(18.4);
  const [transfers, setTransfers] = useState<LiveTokenTransfer[]>(() => getInitialTransfers(token.symbol));
  const [candles, setCandles] = useState<PriceCandle[]>(() => generatePriceCandles(token.currentPriceUsd, 28));
  
  // Real-time market pressure accumulator
  const [buyVolume24h, setBuyVolume24h] = useState<number>(() => Math.round(token.volume24hUsd * 0.54));
  const [sellVolume24h, setSellVolume24h] = useState<number>(() => Math.round(token.volume24hUsd * 0.46));
  const [totalTxCount, setTotalTxCount] = useState<number>(18420);

  // Sync when token changes
  useEffect(() => {
    setCurrentPrice(token.currentPriceUsd);
    setPriceChange24h(token.priceChange24h);
    setTransfers(getInitialTransfers(token.symbol));
    setCandles(generatePriceCandles(token.currentPriceUsd, 28));
    setBuyVolume24h(Math.round(token.volume24hUsd * 0.54));
    setSellVolume24h(Math.round(token.volume24hUsd * 0.46));
  }, [token.address, token.symbol]);

  const generateSyntheticTransfer = useCallback((blockNum: number, price: number): LiveTokenTransfer => {
    const addresses = [
      { addr: '0x28C6c06298d514Db089934071355E5743bf21d60', ens: 'binance-14.eth', label: 'Binance Hot 14' },
      { addr: '0x503828976D22510aad0201ac7EC88293211A23Da', ens: 'coinbase.eth', label: 'Coinbase Custody' },
      { addr: '0x1d42064Fc4Beb5F8aAF85F4617AE8b3b5B8Bd801', ens: 'uniswap-v3.eth', label: 'Uniswap V3 Pool' },
      { addr: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad', label: 'Universal Router' },
      { addr: '0x1111111254fb6c44bac0bed2854e76f90643097d', label: '1inch V5 Router' },
      { addr: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', ens: 'vitalik.eth', label: 'vitalik.eth' },
      { addr: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640', label: 'Arbitrage Bot' },
      { addr: '0x71a56bc22998a44d852a3b984180801249b6b92b', label: 'Smart Trader' }
    ];

    const actions: ('BUY' | 'SELL' | 'TRANSFER' | 'ADD_LIQUIDITY' | 'BURN')[] = [
      'BUY', 'SELL', 'BUY', 'BUY', 'SELL', 'TRANSFER', 'BUY', 'ADD_LIQUIDITY', 'SELL', 'TRANSFER'
    ];
    const action = actions[Math.floor(Math.random() * actions.length)];

    const fromIdx = Math.floor(Math.random() * addresses.length);
    let toIdx = Math.floor(Math.random() * addresses.length);
    while (toIdx === fromIdx) {
      toIdx = Math.floor(Math.random() * addresses.length);
    }

    const fromObj = addresses[fromIdx];
    const toObj = addresses[toIdx];

    const isHighWhale = Math.random() < 0.15;
    const baseAmount = token.symbol === 'PEPE' ? 800000000 : 850;
    const multiplier = isHighWhale ? (10 + Math.random() * 40) : (0.2 + Math.random() * 3);
    const amount = Number((baseAmount * multiplier).toFixed(token.decimals === 18 && token.symbol !== 'PEPE' ? 2 : 0));
    const valueUsd = Number((amount * price).toFixed(2));
    const gasPrice = Number((14 + Math.random() * 12).toFixed(1));
    const gasFeeEth = Number(((gasPrice * 92000) / 1e9).toFixed(5));

    return {
      txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      blockNumber: blockNum,
      timestamp: Date.now(),
      fromAddress: fromObj.addr,
      fromEns: fromObj.ens,
      fromLabel: fromObj.label,
      toAddress: toObj.addr,
      toEns: toObj.ens,
      toLabel: toObj.label,
      action,
      amount,
      amountFormatted: `${amount.toLocaleString()} ${token.symbol}`,
      valueUsd,
      gasPriceGwei: gasPrice,
      gasFeeEth,
      status: 'CONFIRMED',
      dexRouter: action === 'BUY' || action === 'SELL' ? 'Uniswap Universal Router' : undefined
    };
  }, [token.decimals, token.symbol]);

  // Block creation & stream interval
  useEffect(() => {
    if (!isStreaming) return;

    // Normal slot time is 12000ms, modulated by speed factor
    const intervalMs = Math.max(1200, Math.floor(6000 / speed));

    const timer = setInterval(() => {
      setCurrentBlock(prev => {
        const nextBlock = prev + 1;
        
        // Micro price drift
        setCurrentPrice(curr => {
          const deltaPct = (Math.random() - 0.49) * 0.003;
          const nextPrice = Number(Math.max(curr * 0.5, curr * (1 + deltaPct)).toFixed(curr < 0.01 ? 8 : 4));

          // Generate 1-3 transfers in this new block
          const txCountInBlock = 1 + Math.floor(Math.random() * 3);
          const newTxs: LiveTokenTransfer[] = [];
          for (let i = 0; i < txCountInBlock; i++) {
            newTxs.push(generateSyntheticTransfer(nextBlock, nextPrice));
          }

          setTransfers(prevTransfers => [...newTxs, ...prevTransfers.slice(0, 45)]);
          setTotalTxCount(c => c + txCountInBlock);

          // Update volume aggregates
          newTxs.forEach(tx => {
            if (tx.action === 'BUY') {
              setBuyVolume24h(v => v + tx.valueUsd);
            } else if (tx.action === 'SELL') {
              setSellVolume24h(v => v + tx.valueUsd);
            }
          });

          // Update last candle close
          setCandles(prevCandles => {
            if (prevCandles.length === 0) return prevCandles;
            const updated = [...prevCandles];
            const lastIdx = updated.length - 1;
            const last = { ...updated[lastIdx] };
            last.close = nextPrice;
            last.high = Math.max(last.high, nextPrice);
            last.low = Math.min(last.low, nextPrice);
            last.volumeUsd += newTxs.reduce((acc, t) => acc + t.valueUsd, 0);
            updated[lastIdx] = last;
            return updated;
          });

          return nextPrice;
        });

        // Gas price fluctuation
        setGasPriceGwei(Number((15 + Math.random() * 9).toFixed(1)));

        return nextBlock;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isStreaming, speed, generateSyntheticTransfer]);

  const toggleStream = () => setIsStreaming(prev => !prev);

  const triggerInstantBlock = () => {
    setCurrentBlock(prev => {
      const nextBlock = prev + 1;
      const tx = generateSyntheticTransfer(nextBlock, currentPrice);
      setTransfers(prevTransfers => [tx, ...prevTransfers.slice(0, 45)]);
      setTotalTxCount(c => c + 1);
      return nextBlock;
    });
  };

  return {
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
  };
}
