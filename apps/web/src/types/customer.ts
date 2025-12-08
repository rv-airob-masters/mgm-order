// Customer types - shared between store and sync service

export type PackType = 'tray' | 'tub';
export type SyncStatus = 'pending' | 'synced' | 'conflict';

export interface Customer {
  id: string;
  name: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  specialInstructions: string;
  defaultSausagePackType: PackType;
  isActive: boolean;
  syncStatus: SyncStatus;
  createdAt: Date;
  updatedAt: Date;
}

