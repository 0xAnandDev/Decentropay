import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';

const EXPLORER_ADDRESS = import.meta.env.VITE_EXPLORER_URL || 'https://polygonscan.com/address/';

export default function History() {
  const navigate = useNavigate();
  const { account, transactions } = useWallet();

  if (!account) {
    return (
      <div className="page">
        <div className="connect-gate">
          <div className="connect-gate-card">
            <h2>Connect your wallet</h2>
            <p>Connect MetaMask to view transaction history.</p>
            <button type="button" className="btn-primary" onClick={() => navigate('/')}>
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter transactions related to the current account
  const myTransactions = transactions.filter(
    (tx) => tx.from.toLowerCase() === account.toLowerCase() || tx.to.toLowerCase() === account.toLowerCase()
  );

  return (
    <div className="page">
      <div className="history-page">
        <h1 className="history-title">Transaction history</h1>
        <div className="history-list">
          {myTransactions.length === 0 ? (
            <div className="history-empty">No transactions yet. Send or receive to see history here.</div>
          ) : (
            myTransactions.map((tx) => {
              const isReceived = tx.to.toLowerCase() === account.toLowerCase();
              return (
                <div key={tx.id} className="history-item">
                  <span className={`history-badge ${isReceived ? 'received' : 'sent'}`}>
                    {isReceived ? 'Received' : 'Sent'}
                  </span>
                  <div className="history-addr">
                    {isReceived ? `${tx.from.slice(0, 10)}...${tx.from.slice(-8)}` : `${tx.to.slice(0, 10)}...${tx.to.slice(-8)}`}
                  </div>
                  <div className="history-msg">{tx.message || '—'}</div>
                  <div className="history-time">{tx.timestamp}</div>
                  <div className={`history-amount ${isReceived ? 'received' : 'sent'}`}>
                    {isReceived ? '+' : '-'}{tx.amount} ETH
                  </div>
                  <a
                    href={`${EXPLORER_ADDRESS}${account}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="history-link"
                  >
                    PolygonScan →
                  </a>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

