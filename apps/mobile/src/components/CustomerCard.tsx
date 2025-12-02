import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Customer } from '@mgm/shared';

interface CustomerCardProps {
  customer: Customer;
  onPress: () => void;
}

export function CustomerCard({ customer, onPress }: CustomerCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.name}>{customer.name}</Text>
        <View style={[
          styles.badge, 
          { backgroundColor: customer.defaultSausagePackType === 'tray' ? '#4CAF50' : '#2196F3' }
        ]}>
          <Text style={styles.badgeText}>
            {customer.defaultSausagePackType.toUpperCase()}
          </Text>
        </View>
      </View>
      
      {customer.contactPhone && (
        <Text style={styles.detail}>📞 {customer.contactPhone}</Text>
      )}
      
      {customer.address && (
        <Text style={styles.detail} numberOfLines={1}>
          📍 {customer.address}
        </Text>
      )}
      
      {customer.specialInstructions && (
        <Text style={styles.instructions} numberOfLines={2}>
          ⚠️ {customer.specialInstructions}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  detail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  instructions: {
    fontSize: 13,
    color: '#f57c00',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

