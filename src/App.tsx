import { useEffect, useRef, useState } from 'react';
import { Chart } from './components/Chart';
import { DirectionVector } from './components/DirectionVector';
import { VWMAManager } from './components/VWMAManager';
import { VWMAStatus } from './components/VWMAStatus';
import { useCryptoStore } from './lib/store';

function App() {
  const fetchInitialData = useCryptoStore((state) => state.fetchInitialData);
  const pollNewData = useCryptoStore((state) => state.pollNewData);
  const isLoading = useCryptoStore((state) => state.isLoading);
  const error = useCryptoStore((state) => state.error);
  const resetChartState = useCryptoStore((state) => state.resetChartState);
  const getCurrentQuote = useCryptoStore((state) => state.getCurrentQuote);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'chart' | 'settings'>('chart');
  const [autoUpdate, setAutoUpdate] = useState(true);

  const currentQuote = getCurrentQuote();

  // Загрузка начальных данных
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Настройка polling (каждую 1 минуту)
  useEffect(() => {
    if (!autoUpdate) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(() => {
      pollNewData();
    }, 60000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [pollNewData, autoUpdate]);

  // Обработчик кнопки "To End"
  const handleToEnd = () => {
    resetChartState();
    pollNewData();
  };

  // Форматирование цены
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-14 flex flex-col items-center py-4 gap-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div
          className={`sidebar-icon ${sidebarTab === 'chart' ? 'active' : ''}`}
          onClick={() => setSidebarTab('chart')}
          title="Chart"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
            <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
          </svg>
        </div>
        <div
          className={`sidebar-icon ${sidebarTab === 'settings' ? 'active' : ''}`}
          onClick={() => setSidebarTab('settings')}
          title="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" style={{ color: 'var(--accent-amber)' }} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <div>
              <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>BTCAI PredictView</h1>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Real-time Bitcoin Analysis</p>
            </div>
          </div>
          <button
            onClick={handleToEnd}
            className="px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-white"
            style={{ backgroundColor: 'var(--accent-amber)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-amber-light)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-amber)'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            To End
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chart Area */}
          <div className="flex-1 p-4 overflow-hidden">
            {error ? (
              <div className="h-full flex items-center justify-center rounded-lg" style={{ color: 'var(--accent-pink)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium">Ошибка загрузки</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{error}</p>
                </div>
              </div>
            ) : isLoading ? (
              <div className="h-full flex items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-amber)', borderTopColor: 'transparent' }}></div>
                  <p style={{ color: 'var(--text-secondary)' }}>Загрузка данных...</p>
                </div>
              </div>
            ) : (
              <Chart className="w-full h-full rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }} />
            )}
          </div>

          {/* Sidebar Panel */}
          <div className="w-80 overflow-y-auto p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            {/* Price Card */}
            {currentQuote && (
              <div className="card mb-4">
                <div className="card-header">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" style={{ color: 'var(--accent-amber)' }} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  <span className="card-title">Текущая цена</span>
                </div>
                <div className="stat-value" style={{ color: 'var(--accent-amber)' }}>
                  {formatPrice(currentQuote.close)}
                </div>
                <p className="stat-label">BTC/USD</p>
              </div>
            )}

            {/* VWMA Status */}
            <VWMAStatus className="mb-4" />

            {/* Direction Vector */}
            <div className="card mb-4">
              <div className="card-header">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" style={{ color: 'var(--accent-blue)' }} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                <span className="card-title">Вектор движения</span>
              </div>
              <DirectionVector className="w-full aspect-square" />
            </div>

            {/* VWMA Manager */}
            <VWMAManager className="mb-4" />

            {/* Auto Update Toggle */}
            <div className="card mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Автообновление</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Обновлять данные каждую минуту</p>
                </div>
                <div
                  className={`toggle-switch ${autoUpdate ? 'active' : ''}`}
                  onClick={() => setAutoUpdate(!autoUpdate)}
                ></div>
              </div>
            </div>

            {/* Info Card */}
            <div className="card">
              <div className="card-header">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" style={{ color: 'var(--accent-green)' }} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="card-title">О проекте</span>
              </div>
              <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <p>
                  <strong style={{ color: 'var(--text-primary)' }}>VWMA</strong> — Volume Weighted Moving Average
                </p>
                <p>
                  <strong style={{ color: 'var(--text-primary)' }}>Вектор</strong> — ML-предсказание направления
                </p>
                <p className="pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  Данные обновляются{autoUpdate ? ' каждую минуту' : ' вручную'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
