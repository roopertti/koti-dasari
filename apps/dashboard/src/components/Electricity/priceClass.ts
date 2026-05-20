export type PriceClass = 'cheap' | 'normal' | 'expensive';

export interface PriceThresholds {
  cheap: number;
  expensive: number;
}

export function classifyPrice(price: number, thresholds: PriceThresholds): PriceClass {
  if (price <= thresholds.cheap) {
    return 'cheap';
  }
  if (price >= thresholds.expensive) {
    return 'expensive';
  }
  return 'normal';
}
