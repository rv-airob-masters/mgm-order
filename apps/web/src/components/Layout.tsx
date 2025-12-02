import { Link, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: '🏠 Home' },
    { path: '/customers', label: '👥 Customers' },
    { path: '/orders', label: '📋 Orders' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary-500 text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl">🌭</span>
              <span className="font-bold text-xl">MGM Packing</span>
              <span className="text-2xl">🍔</span>
            </Link>
            
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

