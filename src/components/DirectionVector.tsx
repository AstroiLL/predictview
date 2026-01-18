import { useCryptoStore } from '../lib/store';

interface DirectionVectorProps {
  className?: string;
}

export function DirectionVector({ className = '' }: DirectionVectorProps) {
  const currentQuote = useCryptoStore((state) => state.getCurrentQuote());

  if (!currentQuote) {
    return (
      <div className={`flex items-center justify-center bg-gray-900/50 rounded-lg ${className}`}>
        <span className="text-gray-500">Нет данных</span>
      </div>
    );
  }

  const dir = currentQuote.dir;

  // Определение направления и стилей
  // dir: 0 = вниз, 1 = вверх
  let direction: 'up' | 'down';
  let color: string;
  let rotation: number;
  let label: string;

  if (dir === 1) {
    direction = 'up';
    color = 'text-green-500';
    rotation = 0;
    label = 'ВВЕРХ';
  } else {
    direction = 'down';
    color = 'text-red-500';
    rotation = 180;
    label = 'ВНИЗ';
  }

  return (
    <div className={`flex flex-col items-center justify-center bg-gray-900/50 rounded-lg p-6 ${className}`}>
      <div className="text-center">
        {/* Вектор (стрелка) */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          className="mx-auto mb-4"
        >
          {/* Круглый фон для вектора */}
          <circle
            cx="40"
            cy="40"
            r="35"
            fill="none"
            stroke={direction === 'up' ? '#22c55e' : '#ef4444'}
            strokeWidth="2"
            opacity="0.3"
          />
          {/* Стрелка */}
          <g
            transform={`translate(40, 40) rotate(${rotation}) translate(-40, -40)`}
            style={{ transition: 'transform 0.5s ease-out' }}
          >
            <path
              d="M 40 15 L 55 35 L 47 35 L 47 55 L 33 55 L 33 35 L 25 35 Z"
              fill={direction === 'up' ? '#22c55e' : '#ef4444'}
              style={{ transition: 'fill 0.3s ease' }}
            />
          </g>
        </svg>

        {/* Текст направления */}
        <div className={`text-2xl font-bold mb-2 ${color}`}>
          {label}
        </div>

        {/* Текущая цена */}
        <div className="text-gray-400 text-sm mb-1">
          Цена: <span className="text-white font-mono">${currentQuote.close.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>

        {/* Объем */}
        <div className="text-gray-400 text-sm">
          Объем: <span className="text-white font-mono">{currentQuote.vol.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>

        {/* Время */}
        <div className="text-gray-500 text-xs mt-2">
          {new Date(currentQuote.time).toLocaleString('ru-RU')}
        </div>
      </div>
    </div>
  );
}
