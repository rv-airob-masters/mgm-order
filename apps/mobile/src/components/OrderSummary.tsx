import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { OrderTotals } from '@mgm/shared';

interface OrderSummaryProps {
  totals: OrderTotals;
}

export function OrderSummary({ totals }: OrderSummaryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Summary</Text>
      
      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totals.totalWeightKg.toFixed(1)}</Text>
          <Text style={styles.statLabel}>kg Total</Text>
        </View>
        
        {totals.totalTrays > 0 && (
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totals.totalTrays}</Text>
            <Text style={styles.statLabel}>Trays</Text>
          </View>
        )}
        
        {totals.totalTubs > 0 && (
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totals.totalTubs}</Text>
            <Text style={styles.statLabel}>Tubs</Text>
          </View>
        )}
        
        <View style={[styles.statCard, styles.boxCard]}>
          <Text style={[styles.statValue, styles.boxValue]}>{totals.totalBoxes}</Text>
          <Text style={styles.statLabel}>Boxes</Text>
        </View>
      </View>
      
      <Text style={styles.itemCount}>
        {totals.itemCount} item{totals.itemCount !== 1 ? 's' : ''} in order
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  boxCard: {
    backgroundColor: '#4CAF50',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
  },
  boxValue: {
    color: '#fff',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  itemCount: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    color: '#888',
  },
});

