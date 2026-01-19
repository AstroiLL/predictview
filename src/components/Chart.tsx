import { useEffect, useRef, useMemo, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, LineData, Time } from 'lightweight-charts';
import { useCryptoStore } from '../lib/store';
import type { Quotation } from '../types/quotations';

interface ChartProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Chart({ className = '', style }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const priceLineRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeBarRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const vwmaLineRef = useRef<ISeriesApi<'Line'> | null>(null);
  const [isRestored, setIsRestored] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const quotations = useCryptoStore((state) => state.quotations);
  const vwmaPeriod = useCryptoStore((state) => state.vwmaPeriod);
  const chartState = useCryptoStore((state) => state.chartState);
  const setChartState = useCryptoStore((state) => state.setChartState);

  // Инициализация графика
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#1a1f2e' },
        textColor: '#a0a0a0',
      },
      grid: {
        vertLines: { color: '#2a2f3a' },
        horzLines: { color: '#2a2f3a' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        borderColor: '#2a2f3a',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#2a2f3a',
      },
    });

    // Line series для цены
    const priceLine = chart.addLineSeries({
      color: '#f97316',
      lineWidth: 2,
      title: 'BTC Price',
      priceLineVisible: true,
      lastValueVisible: true,
    });

    // Histogram для объемов
    const volumeBar = chart.addHistogramSeries({
      color: '#10b981',
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
      color: '#8b5cf6',
      lineWidth: 1,
      title: `VWMA(${vwmaPeriod})`,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    chartRef.current = chart;
    priceLineRef.current = priceLine;
    volumeBarRef.current = volumeBar;
    vwmaLineRef.current = vwmaLine;

    // Восстановление состояния после инициализации
    const restoreState = () => {
      if (!chartRef.current) return;

      const timeScale = chartRef.current.timeScale();

      // Восстанавливаем позицию если она была сохранена и пользователь взаимодействовал
      if (chartState.isZoomed) {
        timeScale.scrollToPosition(chartState.timeScalePosition, false);
        setHasUserInteracted(true);
      }

      setIsRestored(true);
    };

    // Отложенное восстановление состояния
    setTimeout(restoreState, 100);

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
        ? '#10b981'
        : '#ec4899',
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
    if (!priceLineRef.current || !volumeBarRef.current || !vwmaLineRef.current || !chartRef.current) return;

    // Сохраняем текущий visible range перед обновлением данных
    const timeScale = chartRef.current.timeScale();
    const visibleRange = timeScale.getVisibleRange();

    priceLineRef.current.setData(chartData);
    volumeBarRef.current.setData(volumeData);
    vwmaLineRef.current.setData(vwmaData);

    // Восстанавливаем положение пользователя или подгоняем под новые данные
    if (chartData.length > 0) {
      if (hasUserInteracted && visibleRange) {
        // Если пользователь взаимодействовал - оставляем его позицию
        // Данные обновились, но позиция остается
      } else {
        // Иначе подгоняем под новые данные
        timeScale.fitContent();
      }
    }
  }, [chartData, volumeData, vwmaData, isRestored, hasUserInteracted]);

  // Сохранение состояния графика при изменении пользователем
  useEffect(() => {
    if (!chartRef.current || !isRestored) return;

    const timeScale = chartRef.current.timeScale();

    const handleVisibleChange = () => {
      if (!chartRef.current) return;

      const visibleRange = timeScale.getVisibleRange();

      if (visibleRange) {
        setHasUserInteracted(true);
        setChartState({
          timeScalePosition: 0,
          isZoomed: true,
        });
      }
    };

    timeScale.subscribeVisibleLogicalRangeChange(handleVisibleChange);

    return () => {
      timeScale.unsubscribeVisibleLogicalRangeChange(handleVisibleChange);
    };
  }, [isRestored, setChartState]);

  return (
    <div ref={chartContainerRef} className={className} style={style} />
  );
}
