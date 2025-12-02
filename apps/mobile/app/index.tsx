import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../src/store/useAppStore';

export default function HomeScreen() {
  const router = useRouter();
  const { isOnline, pendingSyncCount } = useAppStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sausage & Burger</Text>
        <Text style={styles.subtitle}>Packing Assistant</Text>
        
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, isOnline ? styles.online : styles.offline]}>
            <Text style={styles.statusText}>
              {isOnline ? '🟢 Online' : '🔴 Offline'}
            </Text>
          </View>
          
          {pendingSyncCount > 0 && (
            <View style={styles.syncBadge}>
              <Text style={styles.syncText}>{pendingSyncCount} pending sync</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.menuGrid}>
        <TouchableOpacity 
          style={[styles.menuButton, styles.primaryButton]}
          onPress={() => router.push('/customers')}
        >
          <Text style={styles.menuIcon}>📝</Text>
          <Text style={styles.menuTitle}>New Order</Text>
          <Text style={styles.menuDesc}>Create a new packing order</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => router.push('/history')}
        >
          <Text style={styles.menuIcon}>📋</Text>
          <Text style={styles.menuTitle}>Order History</Text>
          <Text style={styles.menuDesc}>View past orders</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => router.push('/customers')}
        >
          <Text style={styles.menuIcon}>👥</Text>
          <Text style={styles.menuTitle}>Customers</Text>
          <Text style={styles.menuDesc}>Manage customers</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => {/* TODO: Quick calc */}}
        >
          <Text style={styles.menuIcon}>🧮</Text>
          <Text style={styles.menuTitle}>Quick Calc</Text>
          <Text style={styles.menuDesc}>Calculate without saving</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#4CAF50',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  subtitle: {
    fontSize: 18,
    color: '#e8f5e9',
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  online: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  offline: {
    backgroundColor: 'rgba(244,67,54,0.3)',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  syncBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,152,0,0.3)',
  },
  syncText: {
    color: '#fff',
    fontSize: 14,
  },
  menuGrid: {
    flex: 1,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  menuButton: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: '#e8f5e9',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  menuIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  menuDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    color: '#999',
    fontSize: 12,
  },
});

