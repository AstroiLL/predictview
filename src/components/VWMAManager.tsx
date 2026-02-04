import { useState } from 'react';
import { useCryptoStore } from '../lib/store';
import type { VWMAIndicator } from '../types/quotations';

interface VWMAManagerProps {
  className?: string;
}

export function VWMAManager({ className = '' }: VWMAManagerProps) {
  const vwmaIndicators = useCryptoStore((state) => state.vwmaIndicators);
  const addVWMAIndicator = useCryptoStore((state) => state.addVWMAIndicator);
  const removeVWMAIndicator = useCryptoStore((state) => state.removeVWMAIndicator);
  const updateVWMAIndicator = useCryptoStore((state) => state.updateVWMAIndicator);
  const toggleVWMAIndicator = useCryptoStore((state) => state.toggleVWMAIndicator);

  const [newPeriod, setNewPeriod] = useState<number>(20);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddIndicator = () => {
    if (newPeriod >= 60 && newPeriod <= 1000) {
      addVWMAIndicator(newPeriod);
      setNewPeriod(60);
      setShowAddForm(false);
    }
  };

  const handleColorChange = (id: string, color: string) => {
    updateVWMAIndicator(id, { color });
  };

  const handlePeriodChange = (id: string, period: number) => {
    if (period >= 60 && period <= 1000) {
      updateVWMAIndicator(id, { period });
    }
  };

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
        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
          {vwmaIndicators.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-secondary)' }}>
              Нет индикаторов
            </p>
          ) : (
            vwmaIndicators.map((indicator) => (
              <VWMAIndicatorItem
                key={indicator.id}
                indicator={indicator}
                onToggle={() => toggleVWMAIndicator(indicator.id)}
                onRemove={() => removeVWMAIndicator(indicator.id)}
                onColorChange={(color) => handleColorChange(indicator.id, color)}
                onPeriodChange={(period) => handlePeriodChange(indicator.id, period)}
              />
            ))
          )}
        </div>

        {/* Форма добавления */}
        {showAddForm ? (
          <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              Период (60-1000)
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="number"
                min="60"
                max="1000"
                value={newPeriod}
                onChange={(e) => setNewPeriod(parseInt(e.target.value) || 60)}
                className="flex-1 px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddIndicator}
                disabled={!newPeriod || newPeriod < 60 || newPeriod > 1000}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent-purple)' }}
              >
                Добавить
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewPeriod(60);
                }}
                className="px-3 py-2 rounded-lg text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--accent-purple)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Добавить VWMA
          </button>
        )}
      </div>
    </div>
  );
}

interface VWMAIndicatorItemProps {
  indicator: VWMAIndicator;
  onToggle: () => void;
  onRemove: () => void;
  onColorChange: (color: string) => void;
  onPeriodChange: (period: number) => void;
}

function VWMAIndicatorItem({
  indicator,
  onToggle,
  onRemove,
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

        {/* Период */}
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1">
            <input
              type="number"
              min="60"
              max="1000"
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
            className="flex-1 font-medium text-sm cursor-pointer hover:opacity-80"
            onClick={() => setIsEditing(true)}
            style={{ color: 'var(--text-primary)' }}
            title="Нажмите для редактирования периода"
          >
            VWMA({indicator.period})
          </div>
        )}

        {/* Кнопка удаления */}
        <button
          onClick={onRemove}
          className="p-1 rounded hover:bg-red-500/20 transition-colors"
          style={{ color: 'var(--accent-pink)' }}
          title="Удалить"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
