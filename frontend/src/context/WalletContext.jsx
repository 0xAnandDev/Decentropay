import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import PaymentGatewayUtils from '../utils/PaymentGateway.json';

// Production configuration from environment variables
const PAYMENT_GATEWAY_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const EXPECTED_CHAIN_ID = 80002; // Polygon Amoy Testnet
const EXPECTED_CHAIN_NAME = 'Polygon Amoy';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [balance, setBalance] = useState('0.0');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  // Use useCallback to prevent re-creation on every render
  const fetchTransactions = useCallback(async (contractInstance) => {
    if (!contractInstance) return;
    try {
      console.log('[Blockchain] Fetching history from:', contractInstance.target);
      const txs = await contractInstance.getAllTransactions();
      
      if (!txs || !Array.isArray(txs)) {
        console.warn('[Blockchain] No transaction data returned');
        return;
      }

      const formatted = txs.map((tx, index) => {
        try {
          return {
            from: tx.from,
            to: tx.to,
            amount: ethers.formatEther(tx.amount || 0),
            message: tx.message || '',
            timestamp: new Date(Number(tx.timestamp || 0) * 1000).toLocaleString(),
            id: `${tx.from}-${tx.to}-${tx.timestamp}-${index}`
          };
        } catch (err) {
          console.error('[Blockchain] Formatting error:', err);
          return null;
        }
      }).filter(tx => tx !== null);

      setTransactions([...formatted].reverse());
    } catch (err) {
      console.error('[Blockchain] Fetch error:', err);
    }
  }, []);

  const refreshBalance = useCallback(async (currentAccount) => {
    if (!currentAccount || !window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const bal = await provider.getBalance(currentAccount);
      setBalance(ethers.formatEther(bal).substring(0, 6));
    } catch (err) {
      console.error('[Blockchain] Balance refresh error:', err);
    }
  }, []);

  const initContract = async (ethereum, currentAccount) => {
    // 1. Validate Environment
    if (!PAYMENT_GATEWAY_ADDRESS) {
      console.error('[Config] VITE_CONTRACT_ADDRESS is missing in .env file');
      toast.error('Configuration error: Contract address missing.', { id: 'config-error' });
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(ethereum);
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      
      console.log(`[Network] Connected to ${network.name} (ID: ${chainId})`);

      // 2. Validate Network
      if (chainId !== EXPECTED_CHAIN_ID) {
        setIsWrongNetwork(true);
        toast.error(`Please switch to ${EXPECTED_CHAIN_NAME} network!`, { id: 'network-error' });
        return;
      }
      setIsWrongNetwork(false);

      const signer = await provider.getSigner();
      const paymentGatewayContract = new ethers.Contract(
        PAYMENT_GATEWAY_ADDRESS,
        PaymentGatewayUtils.abi,
        signer
      );
      
      setContract(paymentGatewayContract);
      await refreshBalance(currentAccount);
      await fetchTransactions(paymentGatewayContract);

      // 3. Real-time Event Sync
      paymentGatewayContract.on('PaymentSent', (from, to, amount, message, timestamp) => {
        console.log('[Event] PaymentSent detected');
        fetchTransactions(paymentGatewayContract);
        refreshBalance(currentAccount);
        toast.success('Transaction confirmed on-chain!');
      });

      return () => {
        paymentGatewayContract.removeAllListeners('PaymentSent');
      };
    } catch (err) {
      console.error('[Blockchain] Initialization error:', err);
      toast.error('Failed to initialize blockchain connection.');
    }
  };

  useEffect(() => {
    const checkIfWalletIsConnected = async () => {
      try {
        const { ethereum } = window;
        if (!ethereum) return;
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        if (accounts.length !== 0) {
          setAccount(accounts[0]);
          await initContract(ethereum, accounts[0]);
        }
      } catch (err) {
        console.error('[Wallet] Connection check error:', err);
      }
    };

    checkIfWalletIsConnected();

    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          window.location.reload();
        } else {
          setAccount(null);
          setContract(null);
          setBalance('0.0');
          setTransactions([]);
        }
      };

      const handleChainChanged = () => window.location.reload();

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [fetchTransactions]);

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        toast.error('Please install MetaMask!');
        return false;
      }
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      await initContract(ethereum, accounts[0]);
      toast.success('Wallet connected!');
      return true;
    } catch (err) {
      toast.error(err?.message || 'Failed to connect wallet');
      return false;
    }
  };

  const value = {
    account,
    contract,
    balance,
    transactions,
    loading,
    isWrongNetwork,
    setLoading,
    connectWallet,
    fetchTransactions,
    refreshBalance: () => refreshBalance(account),
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}


