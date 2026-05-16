import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import PaymentGatewayUtils from '../utils/PaymentGateway.json';

const PAYMENT_GATEWAY_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [balance, setBalance] = useState('0.0');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Use useCallback to prevent re-creation on every render
  const fetchTransactions = useCallback(async (contractInstance) => {
    if (!contractInstance) return;
    try {
      console.log('Fetching transactions from contract:', contractInstance.target);
      const txs = await contractInstance.getAllTransactions();
      console.log('Raw transactions from contract:', txs);
      
      if (!txs || !Array.isArray(txs)) {
        console.warn('getAllTransactions did not return an array:', txs);
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
          console.error('Error formatting individual transaction:', err, tx);
          return null;
        }
      }).filter(tx => tx !== null);

      console.log('Formatted transactions:', formatted);
      setTransactions([...formatted].reverse());
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  }, []);

  const refreshBalance = useCallback(async (currentAccount) => {
    if (!currentAccount || !window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const bal = await provider.getBalance(currentAccount);
      setBalance(ethers.formatEther(bal).substring(0, 6));
    } catch (err) {
      console.error('Error refreshing balance:', err);
    }
  }, []);

  const initContract = async (ethereum, currentAccount) => {
    try {
      const provider = new ethers.BrowserProvider(ethereum);
      const network = await provider.getNetwork();
      const chainId = network.chainId;
      const signer = await provider.getSigner();
      
      console.log('Network connected:', network.name, chainId.toString());

      // Warning if using default address on non-local network
      if (PAYMENT_GATEWAY_ADDRESS === '0x5FbDB2315678afecb367f032d93F642f64180aa3' && chainId !== 31337n) {
        toast.error('Using default contract address on a live network! Please set VITE_CONTRACT_ADDRESS.', { duration: 6000 });
      }

      console.log('Initializing contract at:', PAYMENT_GATEWAY_ADDRESS);
      const paymentGatewayContract = new ethers.Contract(
        PAYMENT_GATEWAY_ADDRESS,
        PaymentGatewayUtils.abi,
        signer
      );

      
      setContract(paymentGatewayContract);
      await refreshBalance(currentAccount);
      await fetchTransactions(paymentGatewayContract);

      // Listen for events
      paymentGatewayContract.on('PaymentSent', (from, to, amount, message, timestamp) => {
        console.log('PaymentSent event received:', { from, to, amount, message, timestamp });
        // Refresh everything when a payment is detected
        fetchTransactions(paymentGatewayContract);
        refreshBalance(currentAccount);
        toast.success('New transaction detected!');
      });

      return () => {
        paymentGatewayContract.removeAllListeners('PaymentSent');
      };
    } catch (err) {
      console.error('Error initializing contract:', err);
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
        console.error(err);
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

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [fetchTransactions]);

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        toast.error('Please install MetaMask!');
        throw new Error('Please install MetaMask!');
      }
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      await initContract(ethereum, accounts[0]);
      toast.success('Wallet connected!');
      return true;
    } catch (err) {
      if (err?.message !== 'Please install MetaMask!') {
        toast.error(err?.message || 'Failed to connect');
      }
      throw err;
    }
  };

  const value = {
    account,
    contract,
    balance,
    transactions,
    loading,
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

