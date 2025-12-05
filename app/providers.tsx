'use client';

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
    WalletModalProvider,
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

export function Providers({ children }: { children: React.ReactNode }) {
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    // Using devnet to match the deposit service configuration
    const network = WalletAdapterNetwork.Devnet;

    // Use a custom RPC endpoint if provided, otherwise use clusterApiUrl
    // For devnet, you can use: https://api.devnet.solana.com
    // For mainnet, consider using a service like Helius, QuickNode, or Alchemy
    const endpoint = useMemo(() => {
        // Check for custom RPC endpoint in environment variable
        if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL) {
            return process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
        }
        // Use devnet by default to match deposit service
        return clusterApiUrl(network);
    }, [network]);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}
