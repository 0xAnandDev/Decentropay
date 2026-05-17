import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { QrReader } from 'react-qr-reader';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';

export default function Send() {
  const navigate = useNavigate();
  const { account, contract, fetchTransactions, refreshBalance, setLoading, loading, isWrongNetwork, currencySymbol } = useWallet();
  const [tab, setTab] = useState('manual');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  const handleScan = (result) => {
    if (result?.text) {
      setRecipient(result.text);
      setTab('manual');
      toast.success('QR code scanned');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isWrongNetwork) {
      toast.error('Switch to Polygon Amoy to send payments');
      return;
    }
    if (!contract) {
      toast.error('Blockchain connection not ready');
      return;
    }
    if (!recipient.trim() || !amount.trim()) {
      toast.error('Fill recipient and amount');
      return;
    }
    try {
      setLoading(true);
      const parsed = ethers.parseEther(amount);

      // Gas price fix for Polygon Amoy
      // Amoy requires a minimum tip cap of 25 Gwei (25000000000)
      console.log('[Send] Formatting transaction with custom gas overrides for Amoy');
      const overrides = {
        value: parsed,
        maxPriorityFeePerGas: ethers.parseUnits('30', 'gwei'), // 30 Gwei tip cap (comfortably above 25 Gwei)
        maxFeePerGas: ethers.parseUnits('35', 'gwei'),        // 35 Gwei max fee (lowered to save balance reservation)
        gasLimit: 250000                                       // Manual gas limit of 250,000 to prevent Out-of-Gas reverts!
      };

      const tx = await contract.sendPayment(recipient.trim(), message.trim() || '', overrides);
      toast.loading('Processing...', { id: 'send' });
      await tx.wait();
      toast.success('Payment sent!', { id: 'send' });
      setRecipient('');
      setAmount('');
      setMessage('');
      await fetchTransactions(contract);
      await refreshBalance();
      navigate('/history');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Transaction failed', { id: 'send' });
    } finally {
      setLoading(false);
    }
  };


  if (!account) {
    return (
      <div className="page">
        <div className="connect-gate">
          <div className="connect-gate-card">
            <h2>Connect your wallet</h2>
            <p>Connect MetaMask to use Send.</p>
            <button type="button" className="btn-primary" onClick={() => navigate('/')}>
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isWrongNetwork) {
    return (
      <div className="page">
        <div className="connect-gate">
          <div className="connect-gate-card">
            <h2>Wrong Network</h2>
            <p>Please switch your MetaMask to Polygon Amoy Testnet.</p>
            <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="send-page">
        <div className="send-card">
          <div className="send-tabs">
            <button
              type="button"
              className={`send-tab ${tab === 'manual' ? 'active' : ''}`}
              onClick={() => setTab('manual')}
            >
              Manual
            </button>
            <button
              type="button"
              className={`send-tab ${tab === 'scan' ? 'active' : ''}`}
              onClick={() => setTab('scan')}
            >
              Scan QR
            </button>
          </div>

          {tab === 'scan' && (
            <div className="scan-area">
              <QrReader
                onResult={handleScan}
                constraints={{ facingMode: 'environment' }}
                style={{ width: '100%' }}
              />
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '8px' }}>
                Point camera at wallet QR
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Recipient address</label>
              <input
                type="text"
                className="form-input"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Amount ({currencySymbol || 'POL'})</label>
              <input
                type="number"
                step="0.0001"
                className="form-input"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Message (optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="What is this for?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
              />
            </div>
            <button type="submit" className="send-submit" disabled={loading}>
              {loading ? 'Processing...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
