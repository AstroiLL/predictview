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

// Фиксированные VWMA индикаторы с предустановленными цветами и периодами
export const FIXED_VWMA_INDICATORS: VWMAIndicator[] = [
  { id: 'vwma-gray', period: 30, color: '#808080', visible: true },      // Серый - 30
  { id: 'vwma-blue', period: 60, color: '#0066ff', visible: true },      // Ярко синий - 60
  { id: 'vwma-green', period: 240, color: '#00ff00', visible: true },    // Ярко зеленый - 240
  { id: 'vwma-red', period: 960, color: '#ff0000', visible: true },      // Ярко красный - 960
];

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
  updateVWMAIndicator: (id: string, updates: Partial<Omit<VWMAIndicator, 'id'>>) => void;
  toggleVWMAIndicator: (id: string) => void;
  setChartState: (state: ChartState) => void;
  resetChartState: () => void;

  // Computed getters
  getVWMAForIndicator: (indicator: VWMAIndicator) => (number | undefined)[];
  getCurrentQuote: () => Quotation | null;
  getVWMALastValues: () => Map<string, number | undefined>;
}

export const useCryptoStore = create<CryptoState>((set, get) => ({
  quotations: [],
  currentDirection: 0,
  vwmaIndicators: loadFromStorage<VWMAIndicator[]>(STORAGE_KEYS.VWMA_INDICATORS, FIXED_VWMA_INDICATORS),
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

  getVWMALastValues: () => {
    const { quotations, vwmaIndicators } = get();
    const lastValues = new Map<string, number | undefined>();
    
    if (quotations.length === 0) return lastValues;
    
    vwmaIndicators.forEach(indicator => {
      const vwmaValues = calculateVWMA(quotations, indicator.period);
      const lastValue = vwmaValues[vwmaValues.length - 1];
      lastValues.set(indicator.id, lastValue);
    });
    
    return lastValues;
  },
}));
