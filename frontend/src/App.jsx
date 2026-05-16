import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { WalletProvider, useWallet } from './context/WalletContext';
import Background3D from './components/Background3D';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Send from './pages/Send';
import Receive from './pages/Receive';
import History from './pages/History';

function AppContent() {
  const { account, connectWallet, isWrongNetwork } = useWallet();

  return (
    <div className="app-wrap">
      <Background3D />
      <Navbar account={account} connectWallet={connectWallet} isWrongNetwork={isWrongNetwork} />

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--card)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Home connectWallet={connectWallet} />} />
        <Route path="/dashboard" element={account ? <Dashboard /> : <Navigate to="/" replace />} />
        <Route path="/send" element={<Send />} />
        <Route path="/receive" element={<Receive />} />
        <Route path="/history" element={<History />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </WalletProvider>
  );
}
