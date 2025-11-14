import { useState } from 'react';
import { ethers } from 'ethers';

// Rootstock Testnet Configuration
const RSK_TESTNET = {
  chainId: '0x1f', // Hexadecimal of 31
  chainName: 'Rootstock Testnet',
  nativeCurrency: {
    name: 'tRBTC',
    symbol: 'tRBTC',
    decimals: 18,
  },
  rpcUrls: ['https://public-node.testnet.rsk.co'],
  blockExplorerUrls: ['https://explorer.testnet.rsk.co'],
};
const TARGET_CHAIN_ID = 31; // Decimal Chain ID

const ConnectWallet = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  // --- Network Switching Functions ---

  // 1. Check the current network
  const checkNetwork = async (provider: any) => {
    try {
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId); // Convert BigInt to Number
      
      if (currentChainId !== TARGET_CHAIN_ID) {
        setIsWrongNetwork(true);
        setErrorMessage(`Please switch to ${RSK_TESTNET.chainName} (Chain ID: ${TARGET_CHAIN_ID})` as any);
        return false;
      }
      setIsWrongNetwork(false);
      return true;

    } catch (error) {
      console.error("Error checking network:", error);
      return false;
    }
  };

  // 2. Prompt user to switch network
  const switchNetwork = async () => {
    if (!(window as any).ethereum) return;
    
    try {
      // Try to switch to the network
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: RSK_TESTNET.chainId }],
      });
      // If successful, reset error state
      setIsWrongNetwork(false);
      setErrorMessage(null as any);

    } catch (switchError: any) {
      // This error code indicates the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          // Try to add the network
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [RSK_TESTNET],
          });
          // If added, the wallet will automatically switch

        } catch (addError: any) {
          setErrorMessage(`Failed to add or switch network: ${addError.message}` as any);
          console.error("Add network failed:", addError);
        }
      } else {
        // Handle other switch errors (e.g., user rejected the request)
        setErrorMessage(`Network switch rejected or failed: ${switchError.message}` as any);
        console.error("Switch network failed:", switchError);
      }
    }
  };

  // --- Wallet Connection Handler ---
  const connectWalletHandler = async () => {
    if (!(window as any).ethereum) {
      setErrorMessage("MetaMask (or a compatible wallet) is not installed." as any);
      return;
    }

    try {
      // 1. Request account access
      await (window as any).ethereum.request({ method: 'eth_requestAccounts' });

      // 2. Create provider and signer
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setWalletAddress(address as any);
      setErrorMessage(null as any); 
      
      // 3. Check network and prompt to switch if needed
      await checkNetwork(provider);

    } catch (error) {
      setErrorMessage("Wallet connection failed: " + (error as any).message as any);
      console.error("Connection Error:", error);
    }
  };
  
  // Optional: Listen for network changes to update UI automatically
  if (typeof window !== 'undefined' && (window as any).ethereum) {
      (window as any).ethereum.on('chainChanged', (chainId: any) => {
          // Reload page recommended by MetaMask but checking network is better for a modern dApp
          if (Number(chainId) !== TARGET_CHAIN_ID) {
              setIsWrongNetwork(true);
          } else {
              setIsWrongNetwork(false);
          }
      });
  }
  
  const disconnectWalletHandler = () => {
    setWalletAddress(null as any);
    setErrorMessage(null);
    setIsWrongNetwork(false);
  };


  return (
    <div className="flex flex-col items-end gap-3">
      <button 
        onClick={walletAddress ? disconnectWalletHandler : connectWalletHandler}
        className="px-6 py-2.5 rounded-md font-medium transition-all duration-300 bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {walletAddress ? 'Disconnect Wallet' : 'Connect Wallet'}
      </button>

      {/* Conditional Display for Wrong Network */}
      {walletAddress && isWrongNetwork && (
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
      {walletAddress && !isWrongNetwork && (
        <div className="mt-2 px-4 py-2 rounded-md bg-card border border-border text-sm font-mono text-muted-foreground animate-slide-up">
          <span className="text-foreground font-medium">Connected to RSK Testnet:</span>{' '}
          <span className="text-primary">{(walletAddress as any).substring(0, 6)}...{(walletAddress as any).substring(38)}</span>
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