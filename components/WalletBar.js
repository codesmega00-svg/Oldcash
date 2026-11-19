'use client';
import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { shortAddr, LAMPORTS_PER_SOL } from '@/lib/config';
import ConnectWalletModal from './ConnectWalletModal';

export default function WalletBar() {
  const { connection } = useConnection();
  const { publicKey, connected, wallet } = useWallet();
  const [bal, setBal] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (connected && publicKey && connection) {
      connection
        .getBalance(publicKey)
        .then((l) => {
          if (!cancelled) setBal(l / LAMPORTS_PER_SOL);
        })
        .catch(() => {});
    } else {
      setBal(null);
    }
    return () => {
      cancelled = true;
    };
  }, [connected, publicKey, connection]);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {connected && publicKey ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right', lineHeight: 1.2, fontFamily: 'var(--font-mono)' }}>
              <div style={{ fontSize: 11, fontWeight: 700 }}>{shortAddr(publicKey.toBase58(), 4)}</div>
              <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700 }}>
                {bal !== null ? `${bal.toFixed(4)} SOL` : '...'}
              </div>
            </div>
            <button
              className="os-btn os-btn--dark"
              data-tour="connect-wallet"
              style={{ padding: '6px 12px', fontSize: 11 }}
              onClick={() => setModalOpen(true)}
            >
              {wallet?.adapter?.icon && (
                <img
                  src={wallet.adapter.icon}
                  alt="Wallet"
                  width={14}
                  height={14}
                  style={{ borderRadius: 2 }}
                />
              )}
              <span>{shortAddr(publicKey.toBase58(), 3)}</span>
            </button>
          </div>
        ) : (
          <button
            className="os-btn os-btn--dark"
            data-tour="connect-wallet"
            style={{ padding: '8px 16px', fontSize: 12 }}
            onClick={() => setModalOpen(true)}
          >
            <span>◈ Connect Wallet</span>
          </button>
        )}
      </div>

      <ConnectWalletModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
