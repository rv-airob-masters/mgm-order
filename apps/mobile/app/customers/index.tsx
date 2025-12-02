import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { CustomerCard } from '../../src/components/CustomerCard';
import { useAppStore } from '../../src/store/useAppStore';
import type { Customer } from '@mgm/shared';

export default function CustomersScreen() {
  const router = useRouter();
  const { customers, setCustomers, isLoading, setLoading } = useAppStore();
  const [search, setSearch] = useState('');
  
  // For demo, create mock data
  useEffect(() => {
    setLoading(true);
    // Simulate loading customers
    setTimeout(() => {
      const mockCustomers: Customer[] = [
        {
          id: 'd1000000-0000-0000-0000-000000000001',
          name: 'ABC Butchers',
          contactPhone: '+61 400 111 222',
          contactEmail: 'orders@abcbutchers.com.au',
          address: '123 Main Street, Melbourne VIC 3000',
          specialInstructions: 'Deliver before 6am. Use side entrance.',
          defaultSausagePackType: 'tray',
          isActive: true,
          syncStatus: 'synced',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'd2000000-0000-0000-0000-000000000002',
          name: 'XYZ Meats',
          contactPhone: '+61 400 333 444',
          contactEmail: 'purchasing@xyzmeats.com.au',
          address: '456 Smith Road, Sydney NSW 2000',
          specialInstructions: 'Call 30 minutes before delivery.',
          defaultSausagePackType: 'tub',
          isActive: true,
          syncStatus: 'synced',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'd3000000-0000-0000-0000-000000000003',
          name: 'Fresh Foods Co',
          contactPhone: '+61 400 555 666',
          contactEmail: 'orders@freshfoods.com.au',
          address: '789 Queen Street, Brisbane QLD 4000',
          specialInstructions: null,
          defaultSausagePackType: 'tray',
          isActive: true,
          syncStatus: 'synced',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      setCustomers(mockCustomers);
      setLoading(false);
    }, 500);
  }, []);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectCustomer = (customer: Customer) => {
    router.push({
      pathname: '/orders/new',
      params: { customerId: customer.id, customerName: customer.name }
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading customers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search customers..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#999"
        />
      </View>

      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CustomerCard 
            customer={item} 
            onPress={() => handleSelectCustomer(item)} 
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No customers found</Text>
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  list: {
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});

