export interface Quotation {
  time: Date;
  close: number;
  vol: number;
  dir: number;
  liq: number | null;
}

export interface QuoteData {
  time: number; // Unix timestamp для lightweight-charts
  value: number;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface VolumeData {
  time: number;
  value: number;
  color: string;
}
