import { DeliveryMode, DeliveryQuote } from '../types/domain';

const modeBase: Record<DeliveryMode, number> = {
  pickup: 0,
  seller_delivery: 54,
  partner_delivery: 68,
};

export const logisticsService = {
  calculate(distanceKm: number, volume: number, mode: DeliveryMode): DeliveryQuote {
    if (mode === 'pickup') {
      return {
        distanceKm,
        volume,
        mode,
        price: 0,
        etaDays: 1,
      };
    }

    const raw = distanceKm * modeBase[mode] + volume * 120;
    const price = Math.round(raw);
    const etaDays = Math.max(1, Math.ceil(distanceKm / 250));

    return { distanceKm, volume, mode, price, etaDays };
  },
};


