import { useCryptoStore } from '../lib/store';

interface VWMAStatusProps {
  className?: string;
}

export function VWMAStatus({ className = '' }: VWMAStatusProps) {
  const vwmaIndicators = useCryptoStore((state) => state.vwmaIndicators);
  const getVWMALastValues = useCryptoStore((state) => state.getVWMALastValues);

  const lastValues = getVWMALastValues();

  // Получаем значения для сравнения (серый не учитывается)
  const blueValue = lastValues.get('vwma-blue');
  const greenValue = lastValues.get('vwma-green');
  const redValue = lastValues.get('vwma-red');

  // Получаем цвета индикаторов
  const blueIndicator = vwmaIndicators.find(ind => ind.id === 'vwma-blue');
  const greenIndicator = vwmaIndicators.find(ind => ind.id === 'vwma-green');
  const redIndicator = vwmaIndicators.find(ind => ind.id === 'vwma-red');

  const blueColor = blueIndicator?.color || '#0066ff';
  const greenColor = greenIndicator?.color || '#00ff00';
  const redColor = redIndicator?.color || '#ff0000';

  // Проверяем, есть ли данные
  const hasData = blueValue !== undefined && greenValue !== undefined && redValue !== undefined;

  if (!hasData) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" style={{ color: 'var(--accent-blue)' }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0 1 1 0 002 0zm-1 4a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
          </svg>
          <span className="card-title">Состояние VWMA</span>
        </div>
        <div className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>
          <p className="text-sm">Нет данных</p>
        </div>
      </div>
    );
  }

  // Определяем состояния
  const blueAboveGreen = blueValue > greenValue;
  const blueAboveRed = blueValue > redValue;
  const greenAboveRed = greenValue > redValue;

  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" style={{ color: 'var(--accent-blue)' }} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0 1 1 0 002 0zm-1 4a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
        </svg>
        <span className="card-title">Состояние VWMA</span>
      </div>

      <div className="space-y-2">
        {/* Синий vs Зеленый */}
        <ComparisonRow
          label1="Синий"
          label2="Зеленый"
          color1={blueColor}
          color2={greenColor}
          isAbove={blueAboveGreen}
        />

        {/* Синий vs Красный */}
        <ComparisonRow
          label1="Синий"
          label2="Красный"
          color1={blueColor}
          color2={redColor}
          isAbove={blueAboveRed}
        />

        {/* Зеленый vs Красный */}
        <ComparisonRow
          label1="Зеленый"
          label2="Красный"
          color1={greenColor}
          color2={redColor}
          isAbove={greenAboveRed}
        />
      </div>

      {/* Итоговый сигнал */}
      <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <div className="text-center">
          <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
            Общий сигнал
          </div>
          <SignalBadge
            blueAboveGreen={blueAboveGreen}
            blueAboveRed={blueAboveRed}
            greenAboveRed={greenAboveRed}
          />
        </div>
      </div>
    </div>
  );
}

interface ComparisonRowProps {
  label1: string;
  label2: string;
  color1: string;
  color2: string;
  isAbove: boolean;
}

function ComparisonRow({ label1, label2, color1, color2, isAbove }: ComparisonRowProps) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color1 }} />
        <span className="text-sm font-medium" style={{ color: color1 }}>
          {label1}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {isAbove ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" style={{ color: '#22c55e' }} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs" style={{ color: '#22c55e' }}>выше</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" style={{ color: '#ef4444' }} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 112 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs" style={{ color: '#ef4444' }}>ниже</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium" style={{ color: color2 }}>
          {label2}
        </span>
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color2 }} />
      </div>
    </div>
  );
}

interface SignalBadgeProps {
  blueAboveGreen: boolean;
  blueAboveRed: boolean;
  greenAboveRed: boolean;
}

function SignalBadge({ blueAboveGreen, blueAboveRed, greenAboveRed }: SignalBadgeProps) {
  // Определяем сигнал на основе всех трех сравнений
  let signal: { text: string; color: string; bgColor: string };

  if (blueAboveGreen && blueAboveRed && greenAboveRed) {
    // Все быстрые выше медленных - сильный бычий сигнал
    signal = { text: 'СИЛЬНЫЙ РОСТ', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.2)' };
  } else if (!blueAboveGreen && !blueAboveRed && !greenAboveRed) {
    // Все быстрые ниже медленных - сильный медвежий сигнал
    signal = { text: 'СИЛЬНОЕ ПАДЕНИЕ', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.2)' };
  } else if (blueAboveGreen && greenAboveRed) {
    // Синий выше зеленого, зеленый выше красного - бычий тренд
    signal = { text: 'РОСТ', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)' };
  } else if (!blueAboveGreen && !greenAboveRed) {
    // Синий ниже зеленого, зеленый ниже красного - медвежий тренд
    signal = { text: 'ПАДЕНИЕ', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' };
  } else {
    // Смешанные сигналы - боковик/неопределенность
    signal = { text: 'БОКОВИК', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.2)' };
  }

  return (
    <div
      className="inline-block px-3 py-1 rounded-lg text-sm font-bold"
      style={{
        color: signal.color,
        backgroundColor: signal.bgColor,
        border: `1px solid ${signal.color}`,
      }}
    >
      {signal.text}
    </div>
  );
}
