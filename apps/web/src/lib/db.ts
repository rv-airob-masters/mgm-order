import Dexie, { Table } from 'dexie';
import type { Customer, Product, Order, OrderItem } from '@mgm/shared';

export class PackingDatabase extends Dexie {
  customers!: Table<Customer>;
  products!: Table<Product>;
  orders!: Table<Order>;
  orderItems!: Table<OrderItem>;
  syncQueue!: Table<{
    id?: number;
    tableName: string;
    operation: 'INSERT' | 'UPDATE' | 'DELETE';
    recordId: string;
    data: string;
    createdAt: Date;
  }>;

  constructor() {
    super('mgm-packing');
    
    this.version(1).stores({
      customers: 'id, name, isActive, syncStatus',
      products: 'id, categoryId, name, type, isActive',
      orders: 'id, customerId, orderNumber, orderDate, status, syncStatus',
      orderItems: 'id, orderId, productId',
      syncQueue: '++id, tableName, operation, recordId, createdAt',
    });
  }
}

export const db = new PackingDatabase();

// Helper functions
export async function addToSyncQueue(
  tableName: string,
  operation: 'INSERT' | 'UPDATE' | 'DELETE',
  recordId: string,
  data: object
) {
  await db.syncQueue.add({
    tableName,
    operation,
    recordId,
    data: JSON.stringify(data),
    createdAt: new Date(),
  });
}

export async function getPendingSyncCount(): Promise<number> {
  return await db.syncQueue.count();
}

export async function clearSyncQueue() {
  await db.syncQueue.clear();
}

