import { create } from 'zustand';
import type { Quotation, VWMAIndicator } from '../types/quotations';
import { fetchQuotations } from './supabase';
import { calculateVWMA } from './vwma';

const STORAGE_KEYS = {
  VWMA_INDICATORS: 'btcai_vwma_indicators',
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

function generateRandomColor(): string {
  const colors = [
    '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
    '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#84cc16',
    '#3b82f6', '#a855f7', '#d946ef', '#f43f5e', '#22c55e'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

interface ChartState {
  timeScalePosition: number;
  isZoomed: boolean;
}

interface CryptoState {
  quotations: Quotation[];
  currentDirection: number;
  vwmaIndicators: VWMAIndicator[];
  isLoading: boolean;
  error: string | null;
  chartState: ChartState;

  // Actions
  fetchInitialData: () => Promise<void>;
  pollNewData: () => Promise<void>;
  addVWMAIndicator: (period: number, color?: string) => void;
  removeVWMAIndicator: (id: string) => void;
  updateVWMAIndicator: (id: string, updates: Partial<Omit<VWMAIndicator, 'id'>>) => void;
  toggleVWMAIndicator: (id: string) => void;
  setChartState: (state: ChartState) => void;
  resetChartState: () => void;

  // Computed getters
  getVWMAForIndicator: (indicator: VWMAIndicator) => (number | undefined)[];
  getCurrentQuote: () => Quotation | null;
}

export const useCryptoStore = create<CryptoState>((set, get) => ({
  quotations: [],
  currentDirection: 0,
  vwmaIndicators: loadFromStorage<VWMAIndicator[]>(STORAGE_KEYS.VWMA_INDICATORS, [
    { id: 'default', period: 20, color: '#8b5cf6', visible: true }
  ]),
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

  addVWMAIndicator: (period: number, color?: string) => {
    const { vwmaIndicators } = get();
    const newIndicator: VWMAIndicator = {
      id: `vwma-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      period,
      color: color || generateRandomColor(),
      visible: true,
    };
    const updated = [...vwmaIndicators, newIndicator];
    set({ vwmaIndicators: updated });
    saveToStorage(STORAGE_KEYS.VWMA_INDICATORS, updated);
  },

  removeVWMAIndicator: (id: string) => {
    const { vwmaIndicators } = get();
    const updated = vwmaIndicators.filter(ind => ind.id !== id);
    set({ vwmaIndicators: updated });
    saveToStorage(STORAGE_KEYS.VWMA_INDICATORS, updated);
  },

  updateVWMAIndicator: (id: string, updates: Partial<Omit<VWMAIndicator, 'id'>>) => {
    const { vwmaIndicators } = get();
    const updated = vwmaIndicators.map(ind =>
      ind.id === id ? { ...ind, ...updates } : ind
    );
    set({ vwmaIndicators: updated });
    saveToStorage(STORAGE_KEYS.VWMA_INDICATORS, updated);
  },

  toggleVWMAIndicator: (id: string) => {
    const { vwmaIndicators } = get();
    const updated = vwmaIndicators.map(ind =>
      ind.id === id ? { ...ind, visible: !ind.visible } : ind
    );
    set({ vwmaIndicators: updated });
    saveToStorage(STORAGE_KEYS.VWMA_INDICATORS, updated);
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

  getVWMAForIndicator: (indicator: VWMAIndicator) => {
    const { quotations } = get();
    return calculateVWMA(quotations, indicator.period);
  },

  getCurrentQuote: () => {
    const { quotations } = get();
    return quotations.length > 0 ? quotations[quotations.length - 1] : null;
  },
}));
