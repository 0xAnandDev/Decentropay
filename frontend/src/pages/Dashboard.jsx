import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';

const POLYGON_SCAN_BASE = 'https://polygonscan.com';

export default function Dashboard() {
  const { account, balance, transactions, isWrongNetwork } = useWallet();

  // Filter and slice for recent transactions
  const myTransactions = transactions.filter(
    (tx) => tx.from.toLowerCase() === account?.toLowerCase() || tx.to.toLowerCase() === account?.toLowerCase()
  );
  const recent = myTransactions.slice(0, 10);

  return (
    <div className="page">
      <div className="dashboard-page">
        {isWrongNetwork && (
          <div className="network-warning-banner">
            ⚠️ You are connected to the wrong network. Please switch to Polygon Amoy.
          </div>
        )}
        <div className="dashboard-cards">

          <div className="dashboard-card">
            <div className="dashboard-card-label">Wallet address</div>
            <div className="dashboard-card-value mono">{account ? `${account.slice(0, 10)}...${account.slice(-8)}` : '—'}</div>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-card-label">Balance</div>
            <div className="dashboard-card-value">{balance} ETH</div>
          </div>
        </div>

        <div className="dashboard-actions">
          <Link to="/send" className="dashboard-action-btn">
            ⬆ Send
          </Link>
          <Link to="/receive" className="dashboard-action-btn">
            ⬇ Receive
          </Link>
          <Link to="/history" className="dashboard-action-btn">
            📜 History
          </Link>
        </div>

        <div className="recent-list">
          <div className="recent-list-title">Recent transactions</div>
          {recent.length === 0 ? (
            <div className="recent-item" style={{ borderBottom: 'none' }}>
              <span className="recent-item-msg">No transactions yet</span>
            </div>
          ) : (
            recent.map((tx) => {
              const isReceived = tx.to.toLowerCase() === account?.toLowerCase();
              return (
                <div
                  key={tx.id}
                  className={`recent-item ${isReceived ? 'received' : ''}`}
                >
                  <div className="recent-item-icon">{isReceived ? '⬇' : '⬆'}</div>
                  <div>
                    <div className="recent-item-addr">
                      {isReceived ? `${tx.from.slice(0, 8)}...${tx.from.slice(-6)}` : `${tx.to.slice(0, 8)}...${tx.to.slice(-6)}`}
                    </div>
                    <div className="recent-item-msg">{tx.message || 'No message'}</div>
                    <div className="recent-item-time">{tx.timestamp}</div>
                  </div>
                  <div className={`recent-item-amount ${isReceived ? 'received' : 'sent'}`}>
                    {isReceived ? '+' : '-'}{tx.amount} ETH
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

