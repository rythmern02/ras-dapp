"use client"

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { ethers, BrowserProvider, Signer } from 'ethers';

// Rootstock Testnet Configuration (Moved for reusability)
const RSK_TESTNET = {
  chainId: '0x1f',
  chainName: 'Rootstock Testnet',
  nativeCurrency: { name: 'tRBTC', symbol: 'tRBTC', decimals: 18 },
  rpcUrls: ['https://public-node.testnet.rsk.co'],
  blockExplorerUrls: ['https://explorer.testnet.rsk.co'],
};
const TARGET_CHAIN_ID = 31;

interface WalletState {
  address: string | null;
  provider: BrowserProvider | null;
  signer: Signer | null;
  errorMessage: string | null;
  isWrongNetwork: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: () => Promise<void>;
}

const WalletContext = createContext<WalletState | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  const checkNetwork = useCallback(async (p: BrowserProvider) => {
    try {
      const network = await p.getNetwork();
      const currentChainId = Number(network.chainId);
      
      const isCorrect = currentChainId === TARGET_CHAIN_ID;
      setIsWrongNetwork(!isCorrect);

      if (!isCorrect) {
        setErrorMessage(`Please switch to ${RSK_TESTNET.chainName} (Chain ID: ${TARGET_CHAIN_ID})`);
      } else {
        setErrorMessage(null);
      }
      return isCorrect;
    } catch (error) {
      console.error("Error checking network:", error);
      return false;
    }
  }, []);

  const switchNetwork = useCallback(async () => {
    if (!(window as any).ethereum) return;
    
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: RSK_TESTNET.chainId }],
      });
      // A successful switch will trigger the 'chainChanged' event below
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [RSK_TESTNET],
          });
        } catch (addError: any) {
          setErrorMessage(`Failed to add network: ${addError.message}`);
        }
      } else {
        setErrorMessage(`Network switch rejected or failed: ${switchError.message}`);
      }
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!(window as any).ethereum) {
      setErrorMessage("MetaMask (or a compatible wallet) is not installed.");
      return;
    }

    try {
      await (window as any).ethereum.request({ method: 'eth_requestAccounts' });

      const p = new ethers.BrowserProvider((window as any).ethereum);
      const s = await p.getSigner();
      const userAddress = await s.getAddress();
      
      setAddress(userAddress);
      setProvider(p);
      setSigner(s);
      setErrorMessage(null); 
      
      await checkNetwork(p);

    } catch (error) {
      setErrorMessage("Wallet connection failed: " + (error as any).message);
      console.error("Connection Error:", error);
    }
  }, [checkNetwork]);
  
  const disconnectWallet = useCallback(() => {
    setAddress(null);
    setProvider(null);
    setSigner(null);
    setErrorMessage(null);
    setIsWrongNetwork(false);
  }, []);

  // Check for existing connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const p = new ethers.BrowserProvider((window as any).ethereum);
            const s = await p.getSigner();
            const userAddress = await s.getAddress();
            
            setAddress(userAddress);
            setProvider(p);
            setSigner(s);
            await checkNetwork(p);
          }
        } catch (error) {
          console.error("Error checking existing connection:", error);
        }
      }
    };

    checkExistingConnection();
  }, [checkNetwork]);

  // Set up listeners
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const handleChainChanged = (chainId: string) => {
        const chainIdNum = parseInt(chainId, 16);
        if (chainIdNum !== TARGET_CHAIN_ID) {
          setIsWrongNetwork(true);
        } else {
          setIsWrongNetwork(false);
          if (provider) {
            connectWallet();
          }
        }
      };
      
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          connectWallet();
        }
      };

      (window as any).ethereum.on('chainChanged', handleChainChanged);
      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        (window as any).ethereum?.removeListener('chainChanged', handleChainChanged);
        (window as any).ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [provider, connectWallet, disconnectWallet]);

  const value: WalletState = {
    address,
    provider,
    signer,
    errorMessage,
    isWrongNetwork,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = (): WalletState => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

