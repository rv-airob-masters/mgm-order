import { Link, useLocation } from 'react-router-dom';
import { ReactNode, useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { subscribeToConnectionStatus, ConnectionStatus } from '../lib/supabaseSync';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { syncState, syncWithSupabase, setSyncError } = useAppStore();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isOnline: navigator.onLine,
    isConnected: false,
    lastError: null,
    lastSyncTime: null,
  });

  // Subscribe to connection status changes
  useEffect(() => {
    const unsubscribe = subscribeToConnectionStatus(setConnectionStatus);
    return unsubscribe;
  }, []);

  // Initial sync on mount
  useEffect(() => {
    syncWithSupabase();
  }, []);

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (syncState.syncError) {
      const timer = setTimeout(() => setSyncError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [syncState.syncError]);

  const navItems = [
    { path: '/', label: '🏠 Home' },
    { path: '/customers', label: '👥 Customers' },
    { path: '/orders', label: '📋 Orders' },
  ];

  const getConnectionIndicator = () => {
    if (syncState.isSyncing) {
      return { color: 'bg-yellow-400', text: '🔄 Syncing...' };
    }
    if (!connectionStatus.isOnline) {
      return { color: 'bg-gray-400', text: '📴 Offline' };
    }
    if (connectionStatus.isConnected) {
      return { color: 'bg-green-400', text: '🟢 Connected' };
    }
    return { color: 'bg-red-400', text: '🔴 Disconnected' };
  };

  const indicator = getConnectionIndicator();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sync Error Banner */}
      {syncState.syncError && (
        <div className="bg-red-500 text-white px-4 py-2 text-center text-sm">
          ⚠️ {syncState.syncError}
          <button
            onClick={() => setSyncError(null)}
            className="ml-4 underline hover:no-underline"
          >
            Dismiss
          </button>
          <button
            onClick={() => syncWithSupabase()}
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-primary-500 text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl">🌭</span>
              <span className="font-bold text-xl">MGM Packing</span>
              <span className="text-2xl">🍔</span>
            </Link>

            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div
                className="flex items-center gap-2 text-sm cursor-pointer hover:opacity-80"
                onClick={() => syncWithSupabase()}
                title="Click to sync"
              >
                <span className={`w-2 h-2 rounded-full ${indicator.color}`}></span>
                <span className="hidden sm:inline">{indicator.text}</span>
              </div>

              <nav className="flex gap-4">
                {navItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      location.pathname === item.path
                        ? 'bg-white/20'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t py-4">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          MGM Packing Assistant v1.0.0 | Sausage & Burger Packing Calculator
        </div>
      </footer>
    </div>
  );
}

