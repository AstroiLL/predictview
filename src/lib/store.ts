import { create } from 'zustand';
import type { Quotation } from '../types/quotations';
import { fetchQuotations } from './supabase';
import { calculateVWMA } from './vwma';

interface CryptoState {
  quotations: Quotation[];
  currentDirection: number;
  vwmaPeriod: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchInitialData: () => Promise<void>;
  pollNewData: () => Promise<void>;
  setVWMAPeriod: (period: number) => void;

  // Computed getters
  getVWMA: () => (number | undefined)[];
  getCurrentQuote: () => Quotation | null;
}

export const useCryptoStore = create<CryptoState>((set, get) => ({
  quotations: [],
  currentDirection: 0,
  vwmaPeriod: 20,
  isLoading: false,
  error: null,

  fetchInitialData: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchQuotations();
      set({
        quotations: data,
        isLoading: false,
        currentDirection: data.length > 0 ? data[data.length - 1].dir : 0,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch data',
        isLoading: false,
      });
    }
  },

  pollNewData: async () => {
    const { quotations } = get();
    const lastTime = quotations.length > 0 ? quotations[quotations.length - 1].time : undefined;

    try {
      const newData = await fetchQuotations(lastTime);
      if (newData.length > 0) {
        set({
          quotations: [...quotations, ...newData],
          currentDirection: newData[newData.length - 1].dir,
        });
      }
    } catch (error) {
      console.error('Poll error:', error);
    }
  },

  setVWMAPeriod: (period: number) => {
    set({ vwmaPeriod: period });
  },

  getVWMA: () => {
    const { quotations, vwmaPeriod } = get();
    return calculateVWMA(quotations, vwmaPeriod);
  },

  getCurrentQuote: () => {
    const { quotations } = get();
    return quotations.length > 0 ? quotations[quotations.length - 1] : null;
  },
}));
