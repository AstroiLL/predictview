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

  const quotations = useCryptoStore((state) => state.quotations);
  const vwmaIndicators = useCryptoStore((state) => state.vwmaIndicators);
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

      // Всегда показываем последние данные при загрузке
      timeScale.fitContent();
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

  // Управление VWMA линиями (создание/удаление)
  useEffect(() => {
    if (!chartRef.current || !isRestored) return;

    const chart = chartRef.current;
    const currentIds = new Set(vwmaLinesRef.current.keys());
    const newIds = new Set(vwmaIndicators.map(ind => ind.id));

    // Удаляем линии, которых больше нет
    for (const id of currentIds) {
      if (!newIds.has(id)) {
        const series = vwmaLinesRef.current.get(id);
        if (series) {
          chart.removeSeries(series);
          const newMap = new Map(vwmaLinesRef.current);
          newMap.delete(id);
          vwmaLinesRef.current = newMap;
        }
      }
    }

    // Добавляем новые линии
    for (const indicator of vwmaIndicators) {
      if (!vwmaLinesRef.current.has(indicator.id)) {
        const vwmaLine = chart.addLineSeries({
          color: indicator.color,
          lineWidth: 1,
          title: `VWMA(${indicator.period})`,
          priceLineVisible: false,
          lastValueVisible: true,
        });

        const newMap = new Map(vwmaLinesRef.current);
        newMap.set(indicator.id, vwmaLine);
        vwmaLinesRef.current = newMap;

        // Сразу устанавливаем данные если quotations уже загружен
        if (quotations.length > 0 && indicator.visible) {
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
          vwmaLine.setData(data);
        }
      } else {
        const series = vwmaLinesRef.current.get(indicator.id);
        if (series) {
          series.applyOptions({
            color: indicator.color,
            title: `VWMA(${indicator.period})`,
          });
        }
      }
    }
  }, [vwmaIndicators, isRestored, quotations, getVWMAForIndicator]);

  // Обновление данных VWMA линий при изменении quotations
  useEffect(() => {
    // Пропускаем если нет данных
    if (quotations.length === 0) return;

    for (const indicator of vwmaIndicators) {
      const series = vwmaLinesRef.current.get(indicator.id);
      if (!series) continue;

      if (indicator.visible) {
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
        series.setData(data);
      } else {
        series.setData([]);
      }
    }
  }, [quotations, vwmaIndicators, getVWMAForIndicator]);

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

  // Обновление данных на графике
  useEffect(() => {
    if (!priceLineRef.current || !volumeBarRef.current || !chartRef.current) return;

    const timeScale = chartRef.current.timeScale();

    priceLineRef.current.setData(chartData);
    volumeBarRef.current.setData(volumeData);

    // Подгоняем под новые данные для отображения последних значений
    if (chartData.length > 0 && isRestored) {
      timeScale.fitContent();
    }
  }, [chartData, volumeData, isRestored]);

  return (
    <div ref={chartContainerRef} className={className} style={style} />
  );
}
