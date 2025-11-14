import { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/hooks/useWallet';

const ConnectWallet = () => {
  const { 
    address, 
    errorMessage, 
    isWrongNetwork, 
    connectWallet, 
    disconnectWallet, 
    switchNetwork 
  } = useWallet() as any;

  return (
    <div className="flex flex-col items-end gap-3">
      <button 
        onClick={address ? disconnectWallet : connectWallet}
        className="px-6 py-2.5 rounded-md font-medium transition-all duration-300 bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {address ? 'Disconnect Wallet' : 'Connect Wallet'}
      </button>

      {/* Conditional Display for Wrong Network */}
      {address && isWrongNetwork && (
        <div className="mt-2 p-4 rounded-md border border-destructive/50 bg-destructive/10 backdrop-blur-sm animate-slide-up">
          <p className="text-sm font-medium text-destructive mb-3">
            Wrong Network! Please switch to Rootstock Testnet.
          </p>
          <button 
            onClick={switchNetwork}
            className="px-4 py-2 rounded-md font-medium text-sm transition-all duration-300 bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2"
          >
            Switch to RSK Testnet
          </button>
        </div>
      )}

      {/* Display connected address */}
      {address && !isWrongNetwork && (
        <div className="mt-2 px-4 py-2 rounded-md bg-card border border-border text-sm font-mono text-muted-foreground animate-slide-up">
          <span className="text-foreground font-medium">Connected to RSK Testnet:</span>{' '}
          <span className="text-primary">{(address as any).substring(0, 6)}...{(address as any).substring(38)}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mt-2 px-4 py-2 rounded-md bg-destructive/10 border border-destructive/50 text-sm text-destructive animate-slide-up">
          <span className="font-medium">Error:</span> {errorMessage}
        </div>
      )}
    </div>
  );
};

export default ConnectWallet;