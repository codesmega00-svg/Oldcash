// ============================================================
// lib/transactions.js — Live Solana Mainnet Transaction Builder
// 100% Non-Custodial. Instructions built locally & signed via user's wallet.
// Follows official Solana docs: https://solana.com/docs/tokens/basics/close-account
// ============================================================
import {
  Transaction,
  TransactionInstruction,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM,
  TOKEN_2022_PROGRAM,
  PROTOCOL_WALLET,
  REFERRAL_COMMISSION_PERCENT,
  PROTOCOL_TREASURY_PERCENT,
  PROTOCOL_NON_REFERRAL_PERCENT,
  RENT_PER_TOKEN_ACCOUNT_SOL,
  LAMPORTS_PER_SOL,
  isValidAddress,
} from './config';

/**
 * Creates SPL Token CloseAccount instruction (Opcode 9).
 * Deletes empty SPL token account and refunds MEV Reward to destination.
 * Official spec: https://solana.com/docs/tokens/basics/close-account
 * Works with both standard Token Program and Token-2022 Program.
 *
 * @param {string|PublicKey} tokenAccountPubkey - The account to close
 * @param {string|PublicKey} destinationPubkey  - Destination account to receive MEV Reward SOL
 * @param {string|PublicKey} ownerPubkey        - Authority/owner of the token account
 * @param {string} [programId=TOKEN_PROGRAM]   - TOKEN_PROGRAM or TOKEN_2022_PROGRAM
 */
export function createCloseAccountInstruction(
  tokenAccountPubkey,
  destinationPubkey,
  ownerPubkey,
  programId = TOKEN_PROGRAM
) {
  const keys = [
    { pubkey: new PublicKey(tokenAccountPubkey), isSigner: false, isWritable: true },
    { pubkey: new PublicKey(destinationPubkey), isSigner: false, isWritable: true },
    { pubkey: new PublicKey(ownerPubkey), isSigner: true, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: new PublicKey(programId || TOKEN_PROGRAM),
    data: Buffer.from([9]), // CloseAccount instruction opcode 9
  });
}

/**
 * Creates batch CloseAccount instructions for an array of token accounts.
 */
export function createBatchCloseAccountInstructions(accounts, destinationPubkey, ownerPubkey) {
  return accounts.map((acc) => {
    const pubkey = typeof acc === 'string' ? acc : acc.pubkey;
    const progId = typeof acc === 'object' && acc.programId ? acc.programId : TOKEN_PROGRAM;
    return createCloseAccountInstruction(pubkey, destinationPubkey, ownerPubkey, progId);
  });
}

/**
 * Builds, sends, and confirms a live transaction on Solana Mainnet via the connected wallet adapter.
 */
export async function executeLiveTransaction({ connection, publicKey, sendTransaction, instructions }) {
  if (!publicKey || !sendTransaction) {
    throw new Error('Wallet not connected');
  }

  const tx = new Transaction();
  instructions.forEach((ix) => tx.add(ix));

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;
  tx.feePayer = publicKey;

  // Send transaction through the connected wallet (Phantom, Solflare, etc.)
  const signature = await sendTransaction(tx, connection);

  // Confirm on Solana Mainnet
  const confirmation = await connection.confirmTransaction(
    {
      signature,
      blockhash,
      lastValidBlockHeight,
    },
    'confirmed'
  );

  if (confirmation.value && confirmation.value.err) {
    throw new Error(`Transaction failed on-chain: ${JSON.stringify(confirmation.value.err)}`);
  }

  return {
    signature,
    solscanUrl: `https://solscan.io/tx/${signature}`,
    explorerUrl: `https://explorer.solana.com/tx/${signature}`,
  };
}

/**
 * Closes multiple token accounts in batched transactions (up to 10 accounts per tx).
 * Emits progress callbacks after each batch confirms.
 */
export async function executeBatchCloseAccounts({
  connection,
  publicKey,
  sendTransaction,
  accounts,
  onBatchConfirmed,
  referrerAddress,
}) {
  if (!publicKey || !sendTransaction) {
    throw new Error('Wallet not connected');
  }

  const BATCH_SIZE = 10;
  const batches = [];
  for (let i = 0; i < accounts.length; i += BATCH_SIZE) {
    batches.push(accounts.slice(i, i + BATCH_SIZE));
  }

  const results = [];
  const closedAccounts = [];

  for (let bIndex = 0; bIndex < batches.length; bIndex++) {
    const currentBatch = batches[bIndex];
    const instructions = currentBatch.map((acc) => {
      const pubkey = typeof acc === 'string' ? acc : acc.pubkey;
      const prog = typeof acc === 'object' && acc.programId ? acc.programId : TOKEN_PROGRAM;
      return createCloseAccountInstruction(pubkey, publicKey.toBase58(), publicKey.toBase58(), prog);
    });

    // Calculate total MEV Reward lamports in this batch
    let batchRefundLamports = 0;
    currentBatch.forEach((acc) => {
      if (typeof acc === 'object' && acc.rentSol) {
        batchRefundLamports += Math.floor(acc.rentSol * LAMPORTS_PER_SOL);
      } else {
        batchRefundLamports += Math.floor(RENT_PER_TOKEN_ACCOUNT_SOL * LAMPORTS_PER_SOL);
      }
    });

    const tx = new Transaction();
    instructions.forEach((ix) => tx.add(ix));

    // ON-CHAIN REFERRAL & PROTOCOL ROUTING (Atomic in same transaction)
    // 22% Referrer Commission + 28% Protocol Treasury Split
    const hasValidReferrer =
      referrerAddress &&
      isValidAddress(referrerAddress) &&
      referrerAddress !== publicKey.toBase58();

    if (batchRefundLamports > 1000) {
      if (hasValidReferrer) {
        const referrerLamports = Math.floor((batchRefundLamports * REFERRAL_COMMISSION_PERCENT) / 100);
        const protocolLamports = Math.floor((batchRefundLamports * PROTOCOL_TREASURY_PERCENT) / 100);

        if (referrerLamports > 0) {
          tx.add(
            SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: new PublicKey(referrerAddress),
              lamports: referrerLamports,
            })
          );
        }

        if (protocolLamports > 0 && isValidAddress(PROTOCOL_WALLET)) {
          tx.add(
            SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: new PublicKey(PROTOCOL_WALLET),
              lamports: protocolLamports,
            })
          );
        }
      } else if (isValidAddress(PROTOCOL_WALLET)) {
        // Non-referral protocol split (50%)
        const protocolLamports = Math.floor((batchRefundLamports * PROTOCOL_NON_REFERRAL_PERCENT) / 100);
        if (protocolLamports > 0) {
          tx.add(
            SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: new PublicKey(PROTOCOL_WALLET),
              lamports: protocolLamports,
            })
          );
        }
      }
    }

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = publicKey;

    const signature = await sendTransaction(tx, connection);
    const confirmation = await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      'confirmed'
    );

    if (confirmation.value && confirmation.value.err) {
      throw new Error(`Batch ${bIndex + 1} failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    const closedInThisBatch = currentBatch.map((acc) => (typeof acc === 'string' ? acc : acc.pubkey));
    closedAccounts.push(...closedInThisBatch);

    const res = {
      batchIndex: bIndex + 1,
      totalBatches: batches.length,
      signature,
      solscanUrl: `https://solscan.io/tx/${signature}`,
      closedCount: closedInThisBatch.length,
      closedAccounts: closedInThisBatch,
      referrerCutSol: hasValidReferrer
        ? +(((batchRefundLamports * REFERRAL_COMMISSION_PERCENT) / 100) / LAMPORTS_PER_SOL).toFixed(6)
        : 0,
      protocolCutSol: +(((batchRefundLamports * PROTOCOL_TREASURY_PERCENT) / 100) / LAMPORTS_PER_SOL).toFixed(6),
    };
    results.push(res);

    if (onBatchConfirmed) {
      onBatchConfirmed(res, closedAccounts);
    }
  }

  return {
    signatures: results.map((r) => r.signature),
    results,
    closedAccounts,
    totalClosed: closedAccounts.length,
  };
}


