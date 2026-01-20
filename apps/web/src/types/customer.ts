// Customer types - shared between store and sync service

export type PackType = 'tray' | 'tub';
export type SyncStatus = 'pending' | 'synced' | 'conflict';
export type SpicePreference = 'mild' | 'normal';

export interface Customer {
  id: string;
  name: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  specialInstructions: string;
  defaultSausagePackType: PackType;
  spicePreference: SpicePreference;  // Customer's preferred spice level for sausages
  isActive: boolean;
  syncStatus: SyncStatus;
  createdAt: Date;
  updatedAt: Date;
}

