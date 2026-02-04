import { useState } from 'react';
import { useCryptoStore } from '../lib/store';
import type { VWMAIndicator } from '../types/quotations';

interface VWMAManagerProps {
  className?: string;
}

// Названия индикаторов по ID
const INDICATOR_NAMES: Record<string, string> = {
  'vwma-gray': 'Быстрый',
  'vwma-blue': 'Средний',
  'vwma-green': 'Медленный',
  'vwma-red': 'Долгий',
};

export function VWMAManager({ className = '' }: VWMAManagerProps) {
  const vwmaIndicators = useCryptoStore((state) => state.vwmaIndicators);
  const updateVWMAIndicator = useCryptoStore((state) => state.updateVWMAIndicator);
  const toggleVWMAIndicator = useCryptoStore((state) => state.toggleVWMAIndicator);

  const handleColorChange = (id: string, color: string) => {
    updateVWMAIndicator(id, { color });
  };

  const handlePeriodChange = (id: string, period: number) => {
    if (period >= 10 && period <= 2000) {
      updateVWMAIndicator(id, { period });
    }
  };

  // Сортируем индикаторы в фиксированном порядке
  const sortedIndicators = [...vwmaIndicators].sort((a, b) => {
    const order = ['vwma-gray', 'vwma-blue', 'vwma-green', 'vwma-red'];
    return order.indexOf(a.id) - order.indexOf(b.id);
  });

  return (
    <div className={className}>
      <div className="card">
        <div className="card-header">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" style={{ color: 'var(--accent-purple)' }} viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
          <span className="card-title">VWMA Индикаторы</span>
        </div>

        {/* Список индикаторов */}
        <div className="space-y-2">
          {sortedIndicators.map((indicator) => (
            <VWMAIndicatorItem
              key={indicator.id}
              indicator={indicator}
              name={INDICATOR_NAMES[indicator.id] || indicator.id}
              onToggle={() => toggleVWMAIndicator(indicator.id)}
              onColorChange={(color) => handleColorChange(indicator.id, color)}
              onPeriodChange={(period) => handlePeriodChange(indicator.id, period)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface VWMAIndicatorItemProps {
  indicator: VWMAIndicator;
  name: string;
  onToggle: () => void;
  onColorChange: (color: string) => void;
  onPeriodChange: (period: number) => void;
}

function VWMAIndicatorItem({
  indicator,
  name,
  onToggle,
  onColorChange,
  onPeriodChange
}: VWMAIndicatorItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [period, setPeriod] = useState(indicator.period);

  const handleSavePeriod = () => {
    onPeriodChange(period);
    setIsEditing(false);
  };

  return (
    <div
      className={`p-2 rounded-lg border transition-all ${indicator.visible ? 'opacity-100' : 'opacity-50'}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: indicator.visible ? indicator.color : 'var(--border-color)'
      }}
    >
      <div className="flex items-center gap-2">
        {/* Чекбокс видимости */}
        <input
          type="checkbox"
          checked={indicator.visible}
          onChange={onToggle}
          className="w-4 h-4 rounded cursor-pointer"
          style={{ accentColor: indicator.color }}
        />

        {/* Цвет */}
        <div className="relative">
          <input
            type="color"
            value={indicator.color}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-6 h-6 rounded cursor-pointer border-0"
            style={{ backgroundColor: indicator.color }}
          />
        </div>

        {/* Название и период */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            {name}
          </div>
          {isEditing ? (
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                min="10"
                max="2000"
                value={period}
                onChange={(e) => setPeriod(parseInt(e.target.value) || indicator.period)}
                className="w-16 px-2 py-1 rounded text-sm"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />
              <button
                onClick={handleSavePeriod}
                className="p-1 rounded"
                style={{ color: 'var(--accent-green)' }}
                title="Сохранить"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setPeriod(indicator.period);
                }}
                className="p-1 rounded"
                style={{ color: 'var(--accent-pink)' }}
                title="Отмена"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ) : (
            <div
              className="font-medium text-sm cursor-pointer hover:opacity-80 truncate"
              onClick={() => setIsEditing(true)}
              style={{ color: indicator.color }}
              title="Нажмите для редактирования периода"
            >
              VWMA({indicator.period})
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
