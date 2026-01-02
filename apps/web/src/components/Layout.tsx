import { Link, useLocation } from 'react-router-dom';
import { ReactNode, useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { subscribeToConnectionStatus, ConnectionStatus } from '../lib/supabaseSync';
import { useAuth } from '../lib/auth';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { syncState, syncWithSupabase, setSyncError } = useAppStore();
  const { user, isAdmin, isOwner, signOut } = useAuth();
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

  // All nav items with admin flag
  const allNavItems = [
    { path: '/', label: '🏠 Home', adminOnly: true },
    { path: '/customers', label: '👥 Customers', adminOnly: true },
    { path: '/orders', label: '📋 Orders', adminOnly: true },
    { path: '/products', label: '📦 Products', adminOnly: false },
  ];

  // Filter nav items based on user role
  const navItems = allNavItems.filter(item => !item.adminOnly || isAdmin);

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

              <nav className="flex gap-2">
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

              {/* User Info & Logout */}
              {user && (
                <div className="flex items-center gap-2 ml-4 pl-4 border-l border-white/20">
                  <span className="text-sm hidden md:inline">
                    {isOwner ? '🔑' : isAdmin ? '👑' : '👤'} {user.email.split('@')[0]}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="px-2 py-1 text-sm rounded hover:bg-white/10"
                    title="Sign out"
                  >
                    🚪
                  </button>
                </div>
              )}
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

