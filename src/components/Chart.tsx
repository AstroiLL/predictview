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
  const vwmaLinesRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());
  const [isRestored, setIsRestored] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const quotations = useCryptoStore((state) => state.quotations);
  const vwmaIndicators = useCryptoStore((state) => state.vwmaIndicators);
  const chartState = useCryptoStore((state) => state.chartState);
  const setChartState = useCryptoStore((state) => state.setChartState);
  const getVWMAForIndicator = useCryptoStore((state) => state.getVWMAForIndicator);

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

    chartRef.current = chart;
    priceLineRef.current = priceLine;
    volumeBarRef.current = volumeBar;

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

  // Управление VWMA линиями
  useEffect(() => {
    if (!chartRef.current) return;

    const chart = chartRef.current;
    const currentMap = vwmaLinesRef.current;
    const currentIds = new Set(currentMap.keys());
    const newIds = new Set(vwmaIndicators.map(ind => ind.id));

    // Удаляем линии, которых больше нет
    for (const id of currentIds) {
      if (!newIds.has(id)) {
        const series = currentMap.get(id);
        if (series) {
          chart.removeSeries(series);
          currentMap.delete(id);
        }
      }
    }

    // Добавляем или обновляем линии
    for (const indicator of vwmaIndicators) {
      if (!currentMap.has(indicator.id)) {
        const vwmaLine = chart.addLineSeries({
          color: indicator.color,
          lineWidth: 1,
          title: `VWMA(${indicator.period})`,
          priceLineVisible: false,
          lastValueVisible: true,
        });
        currentMap.set(indicator.id, vwmaLine);
      } else {
        // Обновляем настройки существующей линии
        const series = currentMap.get(indicator.id);
        if (series) {
          series.applyOptions({
            color: indicator.color,
            title: `VWMA(${indicator.period})`,
          });
        }
      }
    }

    vwmaLinesRef.current = currentMap;
  }, [vwmaIndicators]);

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

  // Подготовка данных для каждого VWMA индикатора
  const vwmaDataMap = useMemo(() => {
    const map = new Map<string, LineData[]>();

    for (const indicator of vwmaIndicators) {
      if (!indicator.visible) {
        map.set(indicator.id, []);
        continue;
      }

      const vwmaValues = getVWMAForIndicator(indicator);

      const data = quotations
        .map((q: Quotation, index: number) => {
          const value = vwmaValues[index];
          if (value === undefined) return null;

          return {
            time: (new Date(q.time).getTime() / 1000) as Time,
            value,
          } as LineData;
        })
        .filter((d): d is LineData => d !== null);

      map.set(indicator.id, data);
    }

    return map;
  }, [quotations, vwmaIndicators, getVWMAForIndicator]);

  // Обновление данных на графике
  useEffect(() => {
    if (!priceLineRef.current || !volumeBarRef.current || !chartRef.current) return;

    // Сохраняем текущий visible range перед обновлением данных
    const timeScale = chartRef.current.timeScale();
    const visibleRange = timeScale.getVisibleRange();

    priceLineRef.current.setData(chartData);
    volumeBarRef.current.setData(volumeData);

    // Обновляем данные для каждой VWMA линии
    for (const [id, series] of vwmaLinesRef.current) {
      const data = vwmaDataMap.get(id) || [];
      series.setData(data);
    }

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
  }, [chartData, volumeData, vwmaDataMap, isRestored, hasUserInteracted]);

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
