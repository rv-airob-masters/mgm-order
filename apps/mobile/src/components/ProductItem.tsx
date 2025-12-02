import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import type { Product, PackType } from '@mgm/shared';
import { calculatePacking } from '@mgm/shared';

interface ProductItemProps {
  product: Product;
  packType: PackType;
  onQuantityChange: (productId: string, quantityKg: number) => void;
}

export function ProductItem({ product, packType, onQuantityChange }: ProductItemProps) {
  const [quantity, setQuantity] = useState('');
  
  const numericQuantity = parseFloat(quantity) || 0;
  
  // Calculate packing preview
  const result = numericQuantity > 0 
    ? calculatePacking({
        productId: product.id,
        productName: product.name,
        productType: product.type,
        quantityKg: numericQuantity,
        config: {
          packType,
          productType: product.type,
          trayWeightKg: product.defaultTrayWeightKg,
          traysPerBox: product.defaultTraysPerBox,
          tubWeightKg: product.defaultTubWeightKg,
          tubsPerBox: product.defaultTubsPerBox,
          pattyWeightKg: product.defaultPattyWeightKg,
          pattiesPerTray: product.defaultPattiesPerTray,
        },
      })
    : null;

  const handleQuantityChange = (text: string) => {
    // Only allow numbers and decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    setQuantity(cleaned);
    onQuantityChange(product.id, parseFloat(cleaned) || 0);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productType}>
          {product.type === 'sausage' ? '🌭' : '🍔'}
        </Text>
      </View>
      
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={handleQuantityChange}
          placeholder="0"
          keyboardType="decimal-pad"
          placeholderTextColor="#999"
        />
        <Text style={styles.unit}>kg</Text>
      </View>
      
      {result && numericQuantity > 0 && (
        <View style={styles.results}>
          {packType === 'tray' && (
            <View style={styles.resultItem}>
              <Text style={styles.resultValue}>{result.traysNeeded}</Text>
              <Text style={styles.resultLabel}>Trays</Text>
            </View>
          )}
          {packType === 'tub' && (
            <View style={styles.resultItem}>
              <Text style={styles.resultValue}>{result.tubsNeeded}</Text>
              <Text style={styles.resultLabel}>Tubs</Text>
            </View>
          )}
          <View style={styles.resultItem}>
            <Text style={styles.resultValue}>{result.boxesNeeded}</Text>
            <Text style={styles.resultLabel}>Boxes</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  productType: {
    fontSize: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    backgroundColor: '#f9f9f9',
  },
  unit: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  results: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    justifyContent: 'space-around',
  },
  resultItem: {
    alignItems: 'center',
  },
  resultValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2196F3',
  },
  resultLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

