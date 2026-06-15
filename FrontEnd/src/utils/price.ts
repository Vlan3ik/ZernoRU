import { PriceRecord } from '../types/domain';

const PRICE_SLUGS: Array<{ match: string; slug: string }> = [
  { match: 'пшеница 3', slug: 'pw-3' },
  { match: 'пшеница 4', slug: 'pw-4' },
  { match: 'пшеница 5', slug: 'pw-5' },
  { match: 'ячмень', slug: 'barley' },
  { match: 'кукуруза', slug: 'corn' },
];

export function priceSlug(culture: string) {
  const normalized = culture.toLowerCase();
  return PRICE_SLUGS.find((item) => normalized.includes(item.match))?.slug ?? 'regions';
}

export function priceSlugForRecord(record: Pick<PriceRecord, 'culture'>) {
  return priceSlug(record.culture);
}

export function buildPriceArchiveSeries(record: PriceRecord, period: 'week' | 'month' | 'quarter') {
  const windowSize = period === 'week' ? 8 : period === 'month' ? 12 : 16;
  const volatility = period === 'week' ? 0.6 : period === 'month' ? 1.1 : 1.8;
  const base = record.day - record.weekChange * (period === 'quarter' ? 3.2 : period === 'month' ? 2.2 : 1.5);

  return Array.from({ length: windowSize }, (_, index) => {
    const progress = index / Math.max(1, windowSize - 1);
    const drift = record.weekChange * progress * (period === 'quarter' ? 3.2 : period === 'month' ? 2.2 : 1.5);
    const wave = Math.sin(progress * Math.PI) * record.weekChange * volatility;
    return {
      step: `${period === 'week' ? 'W' : period === 'month' ? 'M' : 'Q'}${index + 1}`,
      price: Math.round((base + drift + wave) * 10) / 10,
    };
  });
}
