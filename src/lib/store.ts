import { create } from 'zustand';
import type { Quotation } from '../types/quotations';
import { fetchQuotations } from './supabase';
import { calculateVWMA } from './vwma';

const STORAGE_KEYS = {
  VWMA_PERIOD: 'btcai_vwma_period',
  CHART_STATE: 'btcai_chart_state',
} as const;

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save ${key} to storage:`, error);
  }
}

interface ChartState {
  timeScalePosition: number;
  isZoomed: boolean;
}

interface CryptoState {
  quotations: Quotation[];
  currentDirection: number;
  vwmaPeriod: number;
  isLoading: boolean;
  error: string | null;
  chartState: ChartState;

  // Actions
  fetchInitialData: () => Promise<void>;
  pollNewData: () => Promise<void>;
  setVWMAPeriod: (period: number) => void;
  setChartState: (state: ChartState) => void;
  resetChartState: () => void;

  // Computed getters
  getVWMA: () => (number | undefined)[];
  getCurrentQuote: () => Quotation | null;
}

export const useCryptoStore = create<CryptoState>((set, get) => ({
  quotations: [],
  currentDirection: 0,
  vwmaPeriod: loadFromStorage(STORAGE_KEYS.VWMA_PERIOD, 20),
  isLoading: false,
  error: null,
  chartState: loadFromStorage(STORAGE_KEYS.CHART_STATE, {
    timeScalePosition: 0,
    isZoomed: false,
  }),

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
    saveToStorage(STORAGE_KEYS.VWMA_PERIOD, period);
  },

  setChartState: (state: ChartState) => {
    set({ chartState: state });
    saveToStorage(STORAGE_KEYS.CHART_STATE, state);
  },

  resetChartState: () => {
    const defaultState = { timeScalePosition: 0, isZoomed: false };
    set({ chartState: defaultState });
    saveToStorage(STORAGE_KEYS.CHART_STATE, defaultState);
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
