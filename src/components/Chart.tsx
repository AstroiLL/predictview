import { useEffect, useRef, useMemo } from 'react';
import { createChart, IChartApi, ISeriesApi, LineData, Time } from 'lightweight-charts';
import { useCryptoStore } from '../lib/store';
import type { Quotation } from '../types/quotations';

interface ChartProps {
  className?: string;
}

export function Chart({ className = '' }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const priceLineRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeBarRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const vwmaLineRef = useRef<ISeriesApi<'Line'> | null>(null);

  const quotations = useCryptoStore((state) => state.quotations);
  const vwmaPeriod = useCryptoStore((state) => state.vwmaPeriod);

  // Инициализация графика
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#0a0a0a' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#1f1f1f' },
        horzLines: { color: '#1f1f1f' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        borderColor: '#2a2a2a',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#2a2a2a',
      },
    });

    // Line series для цены
    const priceLine = chart.addLineSeries({
      color: '#f59e0b',
      lineWidth: 2,
      title: 'BTC Price',
      priceLineVisible: true,
      lastValueVisible: true,
    });

    // Histogram для объемов
    const volumeBar = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // Line series для VWMA
    const vwmaLine = chart.addLineSeries({
      color: '#3b82f6',
      lineWidth: 1,
      title: `VWMA(${vwmaPeriod})`,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    chartRef.current = chart;
    priceLineRef.current = priceLine;
    volumeBarRef.current = volumeBar;
    vwmaLineRef.current = vwmaLine;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Обновление VWMA при изменении периода
  useEffect(() => {
    if (vwmaLineRef.current) {
      vwmaLineRef.current.applyOptions({
        title: `VWMA(${vwmaPeriod})`,
      });
    }
  }, [vwmaPeriod]);

  // Подготовка данных для графика
  const chartData = useMemo(() => {
    return quotations.map((q: Quotation) => ({
      time: (new Date(q.time).getTime() / 1000) as Time,
      value: q.close,
    } as LineData));
  }, [quotations]);

  const volumeData = useMemo(() => {
    return quotations.map((q: Quotation) => ({
      time: (new Date(q.time).getTime() / 1000) as Time,
      value: q.vol,
      color: q.close >= (quotations[quotations.indexOf(q) - 1]?.close || q.close)
        ? '#26a69a'
        : '#ef5350',
    }));
  }, [quotations]);

  const vwmaData = useMemo(() => {
    const { getVWMA } = useCryptoStore.getState();
    const vwmaValues = getVWMA();

    return quotations
      .map((q: Quotation, index: number) => {
        const value = vwmaValues[index];
        if (value === undefined) return null;

        return {
          time: (new Date(q.time).getTime() / 1000) as Time,
          value,
        } as LineData;
      })
      .filter((d): d is LineData => d !== null);
  }, [quotations, vwmaPeriod]);

  // Обновление данных на графике
  useEffect(() => {
    if (!priceLineRef.current || !volumeBarRef.current || !vwmaLineRef.current) return;

    priceLineRef.current.setData(chartData);
    volumeBarRef.current.setData(volumeData);
    vwmaLineRef.current.setData(vwmaData);

    // Подгонка содержимого под данные
    if (chartRef.current && chartData.length > 0) {
      chartRef.current.timeScale().fitContent();
    }
  }, [chartData, volumeData, vwmaData]);

  return (
    <div ref={chartContainerRef} className={className} />
  );
}
