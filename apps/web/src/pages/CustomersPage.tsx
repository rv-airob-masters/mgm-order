import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Customer, PackType } from '@mgm/shared';
import { useAppStore } from '../store';
import { useAuth } from '../lib/auth';

// Pastel colors for customer tiles
const pastelColors = [
  'bg-pink-100 border-pink-200 hover:border-pink-400',
  'bg-blue-100 border-blue-200 hover:border-blue-400',
  'bg-green-100 border-green-200 hover:border-green-400',
  'bg-purple-100 border-purple-200 hover:border-purple-400',
  'bg-yellow-100 border-yellow-200 hover:border-yellow-400',
  'bg-orange-100 border-orange-200 hover:border-orange-400',
  'bg-teal-100 border-teal-200 hover:border-teal-400',
  'bg-indigo-100 border-indigo-200 hover:border-indigo-400',
  'bg-rose-100 border-rose-200 hover:border-rose-400',
];

export function CustomersPage() {
  const navigate = useNavigate();
  const { isOwner } = useAuth();
  const [search, setSearch] = useState('');
  const { customers, addCustomer, deleteCustomer } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    specialInstructions: '',
    defaultSausagePackType: 'tray' as PackType,
  });

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectCustomer = (customer: Customer) => {
    navigate(`/orders/new/${customer.id}`, { state: { customer } });
  };

  const handleAddCustomer = () => {
    if (!newCustomer.name.trim()) return;

    const customer: Customer = {
      id: crypto.randomUUID(),
      name: newCustomer.name.trim(),
      contactPhone: newCustomer.contactPhone.trim() || null,
      contactEmail: newCustomer.contactEmail.trim() || null,
      address: newCustomer.address.trim() || null,
      specialInstructions: newCustomer.specialInstructions.trim() || null,
      defaultSausagePackType: newCustomer.defaultSausagePackType,
      isActive: true,
      syncStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addCustomer(customer);
    setShowAddModal(false);
    setNewCustomer({
      name: '',
      contactPhone: '',
      contactEmail: '',
      address: '',
      specialInstructions: '',
      defaultSausagePackType: 'tray',
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Select Customer</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <span>➕</span> Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="🔍 Search customers..."
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Customer Tiles - 3 per row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer, index) => (
          <div
            key={customer.id}
            onClick={() => handleSelectCustomer(customer)}
            className={`rounded-xl p-4 cursor-pointer transition-all border-2 hover:shadow-lg ${pastelColors[index % pastelColors.length]}`}
          >
            {/* Header with name and actions */}
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold text-gray-800 truncate flex-1">
                {customer.name}
              </h3>
              {isOwner && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete customer "${customer.name}"? This cannot be undone.`)) {
                      deleteCustomer(customer.id);
                    }
                  }}
                  className="ml-2 text-red-600 hover:text-red-800 p-1"
                  title="Delete customer (Owner only)"
                >
                  🗑️
                </button>
              )}
            </div>

            {/* Pack type badge */}
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-3 ${
              customer.defaultSausagePackType === 'tray'
                ? 'bg-green-200 text-green-800'
                : 'bg-blue-200 text-blue-800'
            }`}>
              {customer.defaultSausagePackType.toUpperCase()}
            </span>

            {/* Contact info */}
            <div className="space-y-1 text-sm">
              {customer.contactPhone && (
                <p className="text-gray-700">📞 {customer.contactPhone}</p>
              )}
              {customer.address && (
                <p className="text-gray-600 truncate">📍 {customer.address}</p>
              )}
            </div>

            {/* Special instructions */}
            {customer.specialInstructions && (
              <div className="mt-3 p-2 bg-white/60 rounded text-amber-700 text-xs">
                ⚠️ {customer.specialInstructions}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No customers found
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Customer</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter customer name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="input"
                  placeholder="+61 400 000 000"
                  value={newCustomer.contactPhone}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, contactPhone: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder="email@example.com"
                  value={newCustomer.contactEmail}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, contactEmail: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Street address, City, State"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Pack Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                      newCustomer.defaultSausagePackType === 'tray'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                    onClick={() => setNewCustomer(prev => ({ ...prev, defaultSausagePackType: 'tray' }))}
                  >
                    Tray
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                      newCustomer.defaultSausagePackType === 'tub'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                    onClick={() => setNewCustomer(prev => ({ ...prev, defaultSausagePackType: 'tub' }))}
                  >
                    Tub
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Instructions
                </label>
                <textarea
                  className="input min-h-[80px]"
                  placeholder="Any special delivery or handling instructions..."
                  value={newCustomer.specialInstructions}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, specialInstructions: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomer}
                className="btn-primary flex-1"
                disabled={!newCustomer.name.trim()}
              >
                Add Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

