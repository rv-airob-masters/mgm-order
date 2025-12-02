import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ProductItem } from '../../src/components/ProductItem';
import { OrderSummary } from '../../src/components/OrderSummary';
import { useAppStore } from '../../src/store/useAppStore';
import { calculateOrderTotals, type CalculationResult, type OrderTotals, type Product } from '@mgm/shared';

// Mock products for demo
const MOCK_PRODUCTS: Product[] = [
  {
    id: 'b1000000-0000-0000-0000-000000000001',
    categoryId: 'a1000000-0000-0000-0000-000000000001',
    name: 'Chicken Sausage',
    type: 'sausage',
    defaultTrayWeightKg: 0.4,
    defaultTraysPerBox: 20,
    defaultTubWeightKg: 5.0,
    defaultTubsPerBox: 3,
    defaultPattyWeightKg: 0.1,
    defaultPattiesPerTray: 10,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'b2000000-0000-0000-0000-000000000002',
    categoryId: 'a1000000-0000-0000-0000-000000000001',
    name: 'Beef Sausage',
    type: 'sausage',
    defaultTrayWeightKg: 0.4,
    defaultTraysPerBox: 20,
    defaultTubWeightKg: 5.0,
    defaultTubsPerBox: 3,
    defaultPattyWeightKg: 0.1,
    defaultPattiesPerTray: 10,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'b3000000-0000-0000-0000-000000000003',
    categoryId: 'a1000000-0000-0000-0000-000000000001',
    name: 'Lamb Sausage',
    type: 'sausage',
    defaultTrayWeightKg: 0.4,
    defaultTraysPerBox: 20,
    defaultTubWeightKg: 5.0,
    defaultTubsPerBox: 3,
    defaultPattyWeightKg: 0.1,
    defaultPattiesPerTray: 10,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'c1000000-0000-0000-0000-000000000001',
    categoryId: 'a2000000-0000-0000-0000-000000000002',
    name: 'Beef Burger Patty',
    type: 'burger',
    defaultTrayWeightKg: 0.4,
    defaultTraysPerBox: 10,
    defaultTubWeightKg: 5.0,
    defaultTubsPerBox: 3,
    defaultPattyWeightKg: 0.1,
    defaultPattiesPerTray: 10,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function NewOrderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ customerId: string; customerName: string }>();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [packType, setPackType] = useState<'tray' | 'tub'>('tray');

  const handleQuantityChange = useCallback((productId: string, qty: number) => {
    setQuantities(prev => ({ ...prev, [productId]: qty }));
  }, []);

  // Calculate totals
  const totals: OrderTotals = {
    totalWeightKg: Object.values(quantities).reduce((sum, q) => sum + (q || 0), 0),
    totalTrays: 0,
    totalTubs: 0,
    totalBoxes: 0,
    itemCount: Object.values(quantities).filter(q => q > 0).length,
  };

  const handleSaveOrder = () => {
    if (totals.itemCount === 0) {
      Alert.alert('Empty Order', 'Please add at least one item to the order.');
      return;
    }
    Alert.alert(
      'Order Saved',
      `Order for ${params.customerName} has been saved.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.customerHeader}>
        <Text style={styles.customerName}>{params.customerName}</Text>
        <View style={styles.packTypeToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, packType === 'tray' && styles.toggleActive]}
            onPress={() => setPackType('tray')}
          >
            <Text style={[styles.toggleText, packType === 'tray' && styles.toggleTextActive]}>
              Tray
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, packType === 'tub' && styles.toggleActive]}
            onPress={() => setPackType('tub')}
          >
            <Text style={[styles.toggleText, packType === 'tub' && styles.toggleTextActive]}>
              Tub
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.productList}>
        <Text style={styles.sectionTitle}>🌭 Sausages</Text>
        {MOCK_PRODUCTS.filter(p => p.type === 'sausage').map(product => (
          <ProductItem
            key={product.id}
            product={product}
            packType={packType}
            onQuantityChange={handleQuantityChange}
          />
        ))}
        
        <Text style={styles.sectionTitle}>🍔 Burgers</Text>
        {MOCK_PRODUCTS.filter(p => p.type === 'burger').map(product => (
          <ProductItem
            key={product.id}
            product={product}
            packType="tray"
            onQuantityChange={handleQuantityChange}
          />
        ))}
      </ScrollView>

      <OrderSummary totals={totals} />

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveOrder}>
        <Text style={styles.saveButtonText}>💾 Save Order</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  customerHeader: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  customerName: { fontSize: 18, fontWeight: '600' },
  packTypeToggle: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden' },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#e0e0e0' },
  toggleActive: { backgroundColor: '#4CAF50' },
  toggleText: { color: '#666', fontWeight: '500' },
  toggleTextActive: { color: '#fff' },
  productList: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 8, color: '#333' },
  saveButton: {
    backgroundColor: '#4CAF50',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});

