import type { Quotation } from '../types/quotations';

/**
 * Рассчитывает Volume Weighted Moving Average (VWMA)
 * Формула: VWMA = Σ(Price × Volume) / Σ(Volume) за период N
 *
 * @param data Массив данных котировок
 * @param period Период усреднения (по умолчанию 20)
 * @returns Массив значений VWMA (undefined для периодов без достаточных данных)
 */
export function calculateVWMA(data: Quotation[], period: number = 20): (number | undefined)[] {
  const result: (number | undefined)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(undefined);
      continue;
    }

    const slice = data.slice(i - period + 1, i + 1);

    const sumPriceVolume = slice.reduce((acc, q) => acc + (q.close * q.vol), 0);
    const sumVolume = slice.reduce((acc, q) => acc + q.vol, 0);

    if (sumVolume === 0) {
      result.push(undefined);
    } else {
      result.push(sumPriceVolume / sumVolume);
    }
  }

  return result;
}
