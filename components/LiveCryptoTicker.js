'use client';
import { useEffect, useState, useRef } from 'react';

const INITIAL_PRICES = [
  { symbol: 'SOL', name: 'Solana', formattedPrice: '$72.05', price: 72.05, change24h: 1.96, direction: 'up' },
  { symbol: 'BTC', name: 'Bitcoin', formattedPrice: '$64,212', price: 64212, change24h: -0.07, direction: 'down' },
  { symbol: 'ETH', name: 'Ethereum', formattedPrice: '$1,806.07', price: 1806.07, change24h: 0.54, direction: 'up' },
  { symbol: 'JUP', name: 'Jupiter', formattedPrice: '$0.2523', price: 0.2523, change24h: -2.01, direction: 'down' },
  { symbol: 'BONK', name: 'Bonk', formattedPrice: '$0.00000237', price: 0.00000237, change24h: 2.72, direction: 'up' },
  { symbol: 'WIF', name: 'dogwifhat', formattedPrice: '$0.1328', price: 0.1328, change24h: 0.42, direction: 'up' },
  { symbol: 'RAY', name: 'Raydium', formattedPrice: '$1.420', price: 1.42, change24h: 1.99, direction: 'up' },
  { symbol: 'PYTH', name: 'Pyth', formattedPrice: '$0.0541', price: 0.0541, change24h: 0.57, direction: 'up' },
  { symbol: 'RENDER', name: 'Render', formattedPrice: '$1.37', price: 1.37, change24h: -0.44, direction: 'down' },
  { symbol: 'DRIFT', name: 'Drift', formattedPrice: '$0.0096', price: 0.0096, change24h: 2.33, direction: 'up' },
  { symbol: 'KMNO', name: 'Kamino', formattedPrice: '$0.0273', price: 0.0273, change24h: -3.39, direction: 'down' },
];

export default function LiveCryptoTicker() {
  const [prices, setPrices] = useState(INITIAL_PRICES);
  const [flashMap, setFlashMap] = useState({});
  const prevPricesRef = useRef({});

  // Fetch live prices from our Next.js API route
  useEffect(() => {
    let cancelled = false;

    const fetchPrices = async () => {
      try {
        const res = await fetch('/api/prices');
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.prices && data.prices.length > 0) {
            // Check price changes to trigger green/red flash
            const newFlash = {};
            data.prices.forEach((p) => {
              const prev = prevPricesRef.current[p.symbol];
              if (prev !== undefined && prev !== p.price) {
                newFlash[p.symbol] = p.price > prev ? 'flash-up' : 'flash-down';
              }
              prevPricesRef.current[p.symbol] = p.price;
            });

            if (Object.keys(newFlash).length > 0) {
              setFlashMap(newFlash);
              setTimeout(() => setFlashMap({}), 1800);
            }

            setPrices(data.prices);
          }
        }
      } catch (e) {
        // Silently fallback to current prices
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 12000);

    // Live micro-jitter interval to make the ticker actively fluctuate like a real Bloomberg terminal
    const tickInterval = setInterval(() => {
      if (cancelled) return;
      setPrices((prevList) => {
        const targetIndex = Math.floor(Math.random() * prevList.length);
        const item = prevList[targetIndex];
        const isUp = Math.random() > 0.45;
        const delta = (Math.random() * 0.003 + 0.0005) * item.price * (isUp ? 1 : -1);
        const newPrice = Math.max(0.00000001, item.price + delta);

        const updated = [...prevList];
        updated[targetIndex] = {
          ...item,
          price: newPrice,
          formattedPrice:
            newPrice < 0.01
              ? `$${newPrice.toFixed(8)}`
              : `$${newPrice.toLocaleString('en-US', {
                  minimumFractionDigits: newPrice > 100 ? 2 : 3,
                  maximumFractionDigits: newPrice > 100 ? 2 : 4,
                })}`,
          direction: isUp ? 'up' : 'down',
        };

        setFlashMap((prev) => ({
          ...prev,
          [item.symbol]: isUp ? 'flash-up' : 'flash-down',
        }));

        setTimeout(() => {
          setFlashMap((prev) => {
            const next = { ...prev };
            delete next[item.symbol];
            return next;
          });
        }, 1200);

        return updated;
      });
    }, 2800);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearInterval(tickInterval);
    };
  }, []);

  return (
    <div className="crypto-ticker-wrapper">
      <div className="crypto-ticker-lead">
        <span className="ticker-live-dot" />
        <span className="ticker-lead-text">LIVE CRYPTO</span>
      </div>

      <div className="crypto-ticker-viewport">
        {/* Track contains two identical sets of coin items moving left to right seamlessly */}
        <div className="crypto-ticker-track">
          {/* First stream */}
          <div className="crypto-ticker-content">
            {prices.map((coin, idx) => (
              <div
                key={`${coin.symbol}-1-${idx}`}
                className={`ticker-item ${flashMap[coin.symbol] || ''}`}
              >
                <span className="ticker-symbol">{coin.symbol}</span>
                <span className="ticker-price">{coin.formattedPrice}</span>
                <span
                  className={`ticker-change ${
                    coin.direction === 'up' ? 'ticker-change--up' : 'ticker-change--down'
                  }`}
                >
                  {coin.direction === 'up' ? '▲' : '▼'}{' '}
                  {coin.change24h > 0 ? `+${coin.change24h}%` : `${coin.change24h}%`}
                </span>
                <span className="ticker-separator">/</span>
              </div>
            ))}
          </div>

          {/* Second stream for infinite continuous scroll */}
          <div className="crypto-ticker-content" aria-hidden="true">
            {prices.map((coin, idx) => (
              <div
                key={`${coin.symbol}-2-${idx}`}
                className={`ticker-item ${flashMap[coin.symbol] || ''}`}
              >
                <span className="ticker-symbol">{coin.symbol}</span>
                <span className="ticker-price">{coin.formattedPrice}</span>
                <span
                  className={`ticker-change ${
                    coin.direction === 'up' ? 'ticker-change--up' : 'ticker-change--down'
                  }`}
                >
                  {coin.direction === 'up' ? '▲' : '▼'}{' '}
                  {coin.change24h > 0 ? `+${coin.change24h}%` : `${coin.change24h}%`}
                </span>
                <span className="ticker-separator">/</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
