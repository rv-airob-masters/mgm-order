import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Customer, PackType } from '@mgm/shared';
import { useAppStore } from '../store';
import { useAuth } from '../lib/auth';

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

      {/* Customer List */}
      <div className="space-y-4">
        {filteredCustomers.map(customer => (
          <div
            key={customer.id}
            onClick={() => handleSelectCustomer(customer)}
            className="card cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-primary-300"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {customer.name}
                </h3>
                {customer.contactPhone && (
                  <p className="text-gray-600 text-sm">📞 {customer.contactPhone}</p>
                )}
                {customer.address && (
                  <p className="text-gray-500 text-sm">📍 {customer.address}</p>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                customer.defaultSausagePackType === 'tray'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {customer.defaultSausagePackType.toUpperCase()}
              </span>
              {isOwner && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete customer "${customer.name}"? This cannot be undone.`)) {
                      deleteCustomer(customer.id);
                    }
                  }}
                  className="ml-2 text-red-600 hover:text-red-800 px-2"
                  title="Delete customer (Owner only)"
                >
                  🗑️
                </button>
              )}
            </div>
            {customer.specialInstructions && (
              <div className="mt-3 p-2 bg-amber-50 rounded text-amber-700 text-sm">
                ⚠️ {customer.specialInstructions}
              </div>
            )}
          </div>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No customers found
          </div>
        )}
      </div>

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

