import { NavLink } from 'react-router-dom';

export default function Navbar({ account, connectWallet, isWrongNetwork }) {
  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/send', label: 'Send' },
    { to: '/receive', label: 'Receive' },
    { to: '/history', label: 'History' },
  ];

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-logo">
        DecentroPay
      </NavLink>

      <div className="nav-links">
        {navItems.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            end={to === '/'}
          >
            {label}
          </NavLink>
        ))}
      </div>

      <div className="nav-actions">
        {isWrongNetwork && account && (
          <span className="network-badge error">
            Wrong Network
          </span>
        )}
        <button
          type="button"
          className={`nav-wallet-btn ${account ? 'connected' : 'disconnected'}`}
          onClick={!account ? connectWallet : undefined}
        >
          {account ? (
            <>
              <span className="wallet-dot" />
              {account.slice(0, 6)}...{account.slice(-4)}
            </>
          ) : (
            'Connect Wallet'
          )}
        </button>
      </div>
    </nav>
  );
}

