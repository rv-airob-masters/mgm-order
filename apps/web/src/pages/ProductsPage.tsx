import { useState, useMemo } from 'react';
import { useAppStore, type Product, type MeatType, type SpiceType } from '../store';
import { useAuth } from '../lib/auth';

type Category = 'sausage' | 'burger' | 'meatball';

const categoryLabels: Record<Category, string> = {
  sausage: '🌭 Sausages',
  burger: '🍔 Burgers',
  meatball: '🧆 Meatballs',
};

const categoryColors: Record<Category, string> = {
  sausage: 'bg-amber-100 text-amber-700',
  burger: 'bg-red-100 text-red-700',
  meatball: 'bg-orange-100 text-orange-700',
};

// Tile background colors for products
const tileBgColors: Record<Category, string> = {
  sausage: 'bg-amber-50 border-amber-200 hover:border-amber-400',
  burger: 'bg-red-50 border-red-200 hover:border-red-400',
  meatball: 'bg-orange-50 border-orange-200 hover:border-orange-400',
};

const meatTypeLabels: Record<MeatType, string> = {
  chicken: 'Chicken',
  beef: 'Beef',
  lamb: 'Lamb',
  veal: 'Veal',
  mixed: 'Mixed',
};

const spiceTypeLabels: Record<SpiceType, string> = {
  mild: 'Mild',
  normal: 'Normal',
  none: 'None',
};

export function ProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useAppStore();
  const { isOwner, canEdit } = useAuth();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'sausage' as Category,
    meatType: 'chicken' as MeatType,
    spiceType: 'normal' as SpiceType,
    trayWeightKg: 0.4,
    traysPerBox: 20,
    tubWeightKg5: 5,
    tubWeightKg2: 2,
    tubsPerBox5kg: 3,
    tubsPerBox2kg: 7,
    countPerTub: undefined as number | undefined,
  });

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (search) {
      result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter);
    }
    return result.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  }, [products, search, categoryFilter]);

  const groupedProducts = useMemo(() => {
    const groups: Record<Category, Product[]> = { sausage: [], burger: [], meatball: [] };
    filteredProducts.forEach(p => {
      if (groups[p.category]) groups[p.category].push(p);
    });
    return groups;
  }, [filteredProducts]);

  const handleAddProduct = () => {
    if (!newProduct.name.trim()) {
      alert('Please enter a product name');
      return;
    }

    const id = newProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Check for duplicate
    if (products.some(p => p.id === id)) {
      alert('A product with this name already exists');
      return;
    }

    const product: Product = {
      id,
      name: newProduct.name.trim(),
      category: newProduct.category,
      meatType: newProduct.meatType,
      spiceType: newProduct.spiceType,
      trayWeightKg: newProduct.trayWeightKg,
      traysPerBox: newProduct.traysPerBox,
      tubWeightKg5: newProduct.tubWeightKg5,
      tubWeightKg2: newProduct.tubWeightKg2,
      tubsPerBox5kg: newProduct.tubsPerBox5kg,
      tubsPerBox2kg: newProduct.tubsPerBox2kg,
      countPerTub: newProduct.category === 'meatball' ? newProduct.countPerTub : undefined,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addProduct(product);
    setShowAddModal(false);
    setNewProduct({
      name: '',
      category: 'sausage',
      meatType: 'chicken',
      spiceType: 'normal',
      trayWeightKg: 0.4,
      traysPerBox: 20,
      tubWeightKg5: 5,
      tubWeightKg2: 2,
      tubsPerBox5kg: 3,
      tubsPerBox2kg: 7,
      countPerTub: undefined,
    });
  };

  const handleUpdateProduct = () => {
    if (!editingProduct) return;
    updateProduct({ ...editingProduct, updatedAt: new Date() });
    setEditingProduct(null);
  };

  const handleDeleteProduct = (product: Product) => {
    if (confirm(`Delete "${product.name}"? This cannot be undone.`)) {
      deleteProduct(product.id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📦 Products</h1>
        {canEdit && (
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            ➕ Add Product
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="🔍 Search products..."
          className="input flex-1"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="input w-40"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value as Category | 'all')}
        >
          <option value="all">All Categories</option>
          <option value="sausage">🌭 Sausages</option>
          <option value="burger">🍔 Burgers</option>
          <option value="meatball">🧆 Meatballs</option>
        </select>
      </div>

      {/* Products by Category - Tile Layout */}
      {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
        categoryProducts.length > 0 && (
          <div key={category} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              {categoryLabels[category as Category]} ({categoryProducts.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryProducts.map(product => (
                <div
                  key={product.id}
                  className={`rounded-xl p-4 border-2 transition-all hover:shadow-lg ${tileBgColors[product.category]}`}
                >
                  {/* Header with name and actions */}
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-800 text-lg truncate flex-1">
                      {product.name}
                    </h3>
                    {(canEdit || isOwner) && (
                      <div className="flex gap-1 ml-2">
                        {canEdit && (
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Edit product"
                          >
                            ✏️
                          </button>
                        )}
                        {isOwner && (
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete product (Owner only)"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Badges row: Category, Meat Type, Spice */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[product.category]}`}>
                      {product.category.toUpperCase()}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {meatTypeLabels[product.meatType]}
                    </span>
                    {product.spiceType !== 'none' && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${product.spiceType === 'mild' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {spiceTypeLabels[product.spiceType]}
                      </span>
                    )}
                  </div>

                  {/* Product details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center bg-white/50 rounded-lg p-2">
                      <span className="text-gray-600">🥡 Tray</span>
                      <span className="font-medium text-gray-800">
                        {product.trayWeightKg}kg • {product.traysPerBox}/box
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white/50 rounded-lg p-2">
                      <span className="text-gray-600">🪣 Tub</span>
                      <span className="font-medium text-gray-800">
                        {product.tubWeightKg5}kg • {product.tubsPerBox5kg}/box
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ))}

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📦</div>
          <p>No products found</p>
          {canEdit && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary mt-4">
              Add First Product
            </button>
          )}
        </div>
      )}

      {/* Add Product Modal */}
      {canEdit && showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">➕ Add New Product</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="e.g. Chicken Sausage (40g)"
                  value={newProduct.name}
                  onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="input w-full"
                  value={newProduct.category}
                  onChange={e => setNewProduct({ ...newProduct, category: e.target.value as Category })}
                >
                  <option value="sausage">🌭 Sausage</option>
                  <option value="burger">🍔 Burger</option>
                  <option value="meatball">🧆 Meatball</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meat Type</label>
                  <select
                    className="input w-full"
                    value={newProduct.meatType}
                    onChange={e => setNewProduct({ ...newProduct, meatType: e.target.value as MeatType })}
                  >
                    <option value="chicken">Chicken</option>
                    <option value="beef">Beef</option>
                    <option value="lamb">Lamb</option>
                    <option value="veal">Veal</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Spice Type</label>
                  <select
                    className="input w-full"
                    value={newProduct.spiceType}
                    onChange={e => setNewProduct({ ...newProduct, spiceType: e.target.value as SpiceType })}
                  >
                    <option value="normal">Normal</option>
                    <option value="mild">Mild</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tray Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input w-full"
                    value={newProduct.trayWeightKg}
                    onChange={e => setNewProduct({ ...newProduct, trayWeightKg: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trays per Box</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={newProduct.traysPerBox}
                    onChange={e => setNewProduct({ ...newProduct, traysPerBox: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">5kg Tubs per Box</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={newProduct.tubsPerBox5kg}
                    onChange={e => setNewProduct({ ...newProduct, tubsPerBox5kg: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">2kg Tubs per Box</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={newProduct.tubsPerBox2kg}
                    onChange={e => setNewProduct({ ...newProduct, tubsPerBox2kg: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {newProduct.category === 'meatball' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Count per Tub</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={newProduct.countPerTub || ''}
                    onChange={e => setNewProduct({ ...newProduct, countPerTub: parseInt(e.target.value) || undefined })}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleAddProduct} className="btn-primary flex-1">
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {canEdit && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">✏️ Edit Product</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  className="input w-full"
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meat Type</label>
                  <select
                    className="input w-full"
                    value={editingProduct.meatType}
                    onChange={e => setEditingProduct({ ...editingProduct, meatType: e.target.value as MeatType })}
                  >
                    <option value="chicken">Chicken</option>
                    <option value="beef">Beef</option>
                    <option value="lamb">Lamb</option>
                    <option value="veal">Veal</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Spice Type</label>
                  <select
                    className="input w-full"
                    value={editingProduct.spiceType}
                    onChange={e => setEditingProduct({ ...editingProduct, spiceType: e.target.value as SpiceType })}
                  >
                    <option value="normal">Normal</option>
                    <option value="mild">Mild</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tray Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input w-full"
                    value={editingProduct.trayWeightKg}
                    onChange={e => setEditingProduct({ ...editingProduct, trayWeightKg: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trays per Box</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={editingProduct.traysPerBox}
                    onChange={e => setEditingProduct({ ...editingProduct, traysPerBox: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">5kg Tubs per Box</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={editingProduct.tubsPerBox5kg}
                    onChange={e => setEditingProduct({ ...editingProduct, tubsPerBox5kg: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">2kg Tubs per Box</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={editingProduct.tubsPerBox2kg}
                    onChange={e => setEditingProduct({ ...editingProduct, tubsPerBox2kg: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {editingProduct.category === 'meatball' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Count per Tub</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={editingProduct.countPerTub || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, countPerTub: parseInt(e.target.value) || undefined })}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingProduct(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleUpdateProduct} className="btn-primary flex-1">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

