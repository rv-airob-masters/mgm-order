import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const MOCK_ORDERS = [
  {
    id: '1',
    orderNumber: 'ORD-2024-0001',
    customerName: 'ABC Butchers',
    orderDate: '2024-01-15',
    status: 'completed',
    totalBoxes: 12,
    totalWeight: 45.5,
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-0002',
    customerName: 'XYZ Meats',
    orderDate: '2024-01-15',
    status: 'confirmed',
    totalBoxes: 8,
    totalWeight: 32.0,
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-0003',
    customerName: 'Fresh Foods Co',
    orderDate: '2024-01-14',
    status: 'draft',
    totalBoxes: 5,
    totalWeight: 18.5,
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return '#4CAF50';
    case 'confirmed': return '#2196F3';
    case 'draft': return '#FF9800';
    case 'cancelled': return '#F44336';
    default: return '#999';
  }
};

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_ORDERS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>{item.orderNumber}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
            
            <Text style={styles.customerName}>{item.customerName}</Text>
            <Text style={styles.orderDate}>📅 {item.orderDate}</Text>
            
            <View style={styles.orderStats}>
              <Text style={styles.stat}>📦 {item.totalBoxes} boxes</Text>
              <Text style={styles.stat}>⚖️ {item.totalWeight} kg</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySubtext}>Your order history will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  customerName: {
    fontSize: 15,
    color: '#555',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 13,
    color: '#888',
  },
  orderStats: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 16,
  },
  stat: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});

