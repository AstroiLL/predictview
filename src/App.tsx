import { useEffect } from 'react';
import { Chart } from './components/Chart';
import { DirectionVector } from './components/DirectionVector';
import { useCryptoStore } from './lib/store';

function App() {
  const fetchInitialData = useCryptoStore((state) => state.fetchInitialData);
  const pollNewData = useCryptoStore((state) => state.pollNewData);
  const isLoading = useCryptoStore((state) => state.isLoading);
  const error = useCryptoStore((state) => state.error);

  // Загрузка начальных данных
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Настройка polling (каждые 10 секунд)
  useEffect(() => {
    const interval = setInterval(() => {
      pollNewData();
    }, 10000);

    return () => clearInterval(interval);
  }, [pollNewData]);

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <h1 className="text-2xl font-bold text-amber-500">BTCAI PredictView</h1>
        <p className="text-gray-400 text-sm">Bitcoin: Цена, Объемы, VWMA, Вектор направления</p>
      </header>

      {/* Main content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Chart area */}
        <div className="flex-1 p-4">
          {error ? (
            <div className="h-full flex items-center justify-center text-red-500">
              Ошибка: {error}
            </div>
          ) : isLoading ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              Загрузка данных...
            </div>
          ) : (
            <Chart className="w-full h-full" />
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-80 bg-gray-900/30 border-l border-gray-800 p-4 overflow-y-auto">
          {/* Direction Vector */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
              Вектор движения
            </h2>
            <DirectionVector className="w-full aspect-square" />
          </div>

          {/* VWMA Period Control */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
              Настройки VWMA
            </h2>
            <div className="bg-gray-800 rounded-lg p-4">
              <label className="block text-sm text-gray-300 mb-2">
                Период: <span id="vwma-period-value">20</span>
              </label>
              <input
                type="range"
                min="5"
                max="50"
                defaultValue="20"
                onChange={(e) => {
                  const period = parseInt(e.target.value);
                  document.getElementById('vwma-period-value')!.textContent = period.toString();
                  useCryptoStore.getState().setVWMAPeriod(period);
                }}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5</span>
                <span>50</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div>
            <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
              О проекте
            </h2>
            <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-400">
              <p className="mb-2">
                <strong className="text-gray-300">VWMA</strong> — Volume Weighted Moving Average,
                взвешенное по объему скользящее среднее.
              </p>
              <p className="mb-2">
                <strong className="text-gray-300">Вектор</strong> — направление движения
                на основе ML-предсказаний.
              </p>
              <p>
                Данные обновляются каждые 10 секунд через polling.
              </p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
