// Customer types - shared between store and sync service

export type PackType = 'tray' | 'tub';
export type SyncStatus = 'pending' | 'synced' | 'conflict';

export interface Customer {
  id: string;
  name: string;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  specialInstructions: string | null;
  defaultSausagePackType: PackType;
  isActive: boolean;
  syncStatus: SyncStatus;
  createdAt: Date;
  updatedAt: Date;
}

