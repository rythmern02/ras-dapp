// hooks/useWallet.ts
import { useState, useCallback } from 'react';
import { ethers, BrowserProvider, Signer, Contract } from 'ethers';

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

export const useWallet = (): WalletState => {
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

  // Set up listeners once on mount
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    (window as any).ethereum.on('chainChanged', (chainId: string) => {
        const chainIdNum = parseInt(chainId, 16); // chainId comes as hex string
        if (chainIdNum !== TARGET_CHAIN_ID) {
            setIsWrongNetwork(true);
        } else {
            setIsWrongNetwork(false);
            // Re-fetch signer/address if provider exists
            if (provider) connectWallet(); 
        }
    });
    
    (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
            disconnectWallet();
        } else {
            // Re-connect to update signer
            connectWallet(); 
        }
    });
  }

  return { 
    address, 
    provider, 
    signer, 
    errorMessage, 
    isWrongNetwork, 
    connectWallet, 
    disconnectWallet, 
    switchNetwork 
  };
};