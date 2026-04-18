import { getStorage, setStorage, uid } from './localStorageService';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { EquipmentLot, GrainLot } from '../types/domain';

export interface GrainFilter {
  grainType?: string;
  minVolume?: number;
  maxPrice?: number;
  region?: string;
}

export interface EquipmentFilter {
  brand?: string;
  condition?: 'new' | 'used';
  minYear?: number;
  maxPrice?: number;
}

export const marketplaceService = {
  getGrainLots(filter?: GrainFilter): GrainLot[] {
    const lots = getStorage<GrainLot[]>(STORAGE_KEYS.grainLots, []);
    if (!filter) return lots;

    return lots.filter((lot) => {
      if (filter.grainType && lot.grainType !== filter.grainType) return false;
      if (filter.minVolume && lot.volumeTons < filter.minVolume) return false;
      if (filter.maxPrice && lot.pricePerTon > filter.maxPrice) return false;
      if (filter.region && !lot.region.toLowerCase().includes(filter.region.toLowerCase())) return false;
      return true;
    });
  },

  getEquipmentLots(filter?: EquipmentFilter): EquipmentLot[] {
    const lots = getStorage<EquipmentLot[]>(STORAGE_KEYS.equipmentLots, []);
    if (!filter) return lots;

    return lots.filter((lot) => {
      if (filter.brand && !lot.brand.toLowerCase().includes(filter.brand.toLowerCase())) return false;
      if (filter.condition && lot.condition !== filter.condition) return false;
      if (filter.minYear && lot.year < filter.minYear) return false;
      if (filter.maxPrice && lot.price > filter.maxPrice) return false;
      return true;
    });
  },

  addGrainLot(lot: Omit<GrainLot, 'id' | 'createdAt'>): GrainLot {
    const lots = getStorage<GrainLot[]>(STORAGE_KEYS.grainLots, []);
    const newLot: GrainLot = { ...lot, id: uid('grain'), createdAt: new Date().toISOString() };
    setStorage(STORAGE_KEYS.grainLots, [newLot, ...lots]);
    return newLot;
  },

  addEquipmentLot(lot: Omit<EquipmentLot, 'id' | 'createdAt'>): EquipmentLot {
    const lots = getStorage<EquipmentLot[]>(STORAGE_KEYS.equipmentLots, []);
    const newLot: EquipmentLot = { ...lot, id: uid('eq'), createdAt: new Date().toISOString() };
    setStorage(STORAGE_KEYS.equipmentLots, [newLot, ...lots]);
    return newLot;
  },
};


