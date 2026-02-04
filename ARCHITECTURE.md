# Архитектура и поток данных BTCAI PredictView

Документация для разработчиков и сопровождения программы.

## Общая архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                         Пользовательский интерфейс              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │   Sidebar   │  │ Chart (main) │  │     Info Panel         │ │
│  │  (навиг.)   │  │  (график)    │  │ (VWMA, Вектор, Инфо)   │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         State Management (Zustand)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  quotations  │  │ vwmaIndicators│  │   chartState         │  │
│  │  (данные)    │  │ (настройки)   │  │  (положение зума)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Data Layer                              │
│  ┌─────────────────┐  ┌────────────────────────────────────────┐│
│  │   Supabase API  │  │     VWMA Calculation Engine            ││
│  │  (fetch/поллинг)│  │   (Volume Weighted Moving Average)     ││
│  └─────────────────┘  └────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         External Services                       │
│                    ┌──────────────────────┐                     │
│                    │   Supabase Database  │                     │
│                    │   (таблица quotes)   │                     │
│                    └──────────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

## Компоненты системы

### 1. Компоненты UI (`src/components/`)

#### Chart.tsx
- **Назначение:** Отображение финансового графика цены BTC
- **Библиотека:** `lightweight-charts` от TradingView
- **Функционал:**
  - Линейный график цены (Line Series)
  - Гистограмма объемов (Histogram Series)
  - VWMA линии (динамическое добавление/удаление)
  - Автомасштабирование при загрузке данных

#### DirectionVector.tsx
- **Назначение:** Визуализация ML-предсказания направления
- **Источник данных:** Поле `dir` из последней котировки
- **Отображение:**
  - Стрелка вверх (зеленая) при `dir === 1`
  - Стрелка вниз (красная) при `dir === 0`
  - Текущая цена, объем, время

#### VWMAStatus.tsx
- **Назначение:** Сравнение VWMA индикаторов между собой
- **Логика:**
  - Сравнивает 3 индикатора: синий (60), зеленый (240), красный (960)
  - Определяет общий сигнал: РОСТ / ПАДЕНИЕ / БОКОВИК
  - Отображает отношения "выше/ниже" между парами

#### VWMAManager.tsx
- **Назначение:** Управление настройками VWMA индикаторов
- **Функционал:**
  - Включение/выключение видимости
  - Изменение цвета линии
  - Изменение периода расчета (10-2000)
  - Персистентность в localStorage

### 2. State Management (`src/lib/store.ts`)

#### Zustand Store Structure

```typescript
interface CryptoState {
  // Данные
  quotations: Quotation[];           // Массив котировок (3000 записей)
  currentDirection: number;          // Последнее значение dir
  vwmaIndicators: VWMAIndicator[];   // Настройки 4 индикаторов
  
  // Состояние UI
  isLoading: boolean;
  error: string | null;
  chartState: ChartState;            // Позиция таймлайна
  
  // Actions
  fetchInitialData: () => Promise<void>;
  pollNewData: () => Promise<void>;
  updateVWMAIndicator: (id, updates) => void;
  toggleVWMAIndicator: (id) => void;
  
  // Computed
  getVWMAForIndicator: (indicator) => number[];
  getCurrentQuote: () => Quotation | null;
  getVWMALastValues: () => Map<string, number>;
}
```

#### Оптимизации Store

1. **VWMA Кэширование:**
   ```typescript
   // Кэш пересчитывается только при изменении:
   // - Количества котировок
   // - Периода/видимости индикаторов
   ```

2. **Селекторы для минимизации ререндеров:**
   ```typescript
   const quotations = useCryptoStore((state) => state.quotations);
   ```

### 3. Data Layer

#### Supabase Integration (`src/lib/supabase.ts`)

```typescript
// Начальная загрузка
fetchQuotations() → SELECT * FROM quotations 
                     ORDER BY time DESC 
                     LIMIT 3000

// Поллинг новых данных
fetchQuotations(after: Date) → SELECT * FROM quotations 
                                WHERE time > $after 
                                ORDER BY time ASC
```

**Буфер данных:** 3000 последних записей

#### VWMA Calculation (`src/lib/vwma.ts`)

```typescript
// Формула: VWMA = Σ(Price × Volume) / Σ(Volume)
// Периоды по умолчанию:
// - Серый: 30
// - Синий: 60  
// - Зеленый: 240
// - Красный: 960
```

## Поток данных

### 1. Инициализация приложения

```
App.mount
    │
    ├──► useEffect[fetchInitialData]
    │         │
    │         ▼
    │    fetchQuotations()
    │         │
    │         ▼
    │    Supabase API
    │         │
    │         ▼
    │    Store.quotations = data
    │         │
    │         ▼
    │    Компоненты пересчитывают:
    │    - Chart: строит график
    │    - VWMAStatus: пересчитывает VWMA
    │    - DirectionVector: показывает dir
    │
    └──► useEffect[polling]
              │
              └──► setInterval(60000ms) → pollNewData()
```

### 2. Поллинг новых данных

```
setInterval(60s)
    │
    ▼
pollNewData()
    │
    ├──► fetchQuotations(lastTime)
    │         │
    │         ▼
    │    Supabase: SELECT WHERE time > lastTime
    │         │
    │         ▼
    │    [новые данные]
    │         │
    │         ▼
    │    Store.quotations = [...old, ...new]
    │         │
    │         ▼
    │    VWMA Cache invalidated
    │         │
    │         ▼
    │    Chart.updateData()
    │    VWMAStatus пересчет
    │
    └──► (если нет новых данных) ничего не происходит
```

### 3. Взаимодействие пользователя

```
Пользователь
    │
    ├──► Клик "To End"
    │         │
    │         ▼
    │    resetChartState()
    │    pollNewData()
    │
    ├──► Изменение VWMA периода
    │         │
    │         ▼
    │    updateVWMAIndicator(id, {period})
    │         │
    │         ▼
    │    localStorage.save()
    │    VWMA Cache invalidated
    │         │
    │         ▼
    │    Chart перерисовывает линию
    │
    └──► Toggle автообновление
              │
              ▼
         setAutoUpdate(!autoUpdate)
              │
              ▼
         clearInterval() / setInterval()
```

## Типы данных

### Quotation (котировка)

```typescript
interface Quotation {
  time: Date;        // Время записи
  close: number;     // Цена закрытия
  vol: number;       // Объем торгов
  dir: number;       // ML-предсказание (0=вниз, 1=вверх)
  liq: number|null;  // Ликвидность (опционально)
}
```

### VWMAIndicator

```typescript
interface VWMAIndicator {
  id: string;       // Уникальный ID (vwma-gray, vwma-blue, etc.)
  period: number;   // Период усреднения (30-2000)
  color: string;    // Цвет линии (#RRGGBB)
  visible: boolean; // Видимость на графике
}
```

## Хранение состояния

### LocalStorage Keys

```typescript
STORAGE_KEYS = {
  VWMA_INDICATORS: 'btcai_vwma_indicators',
  CHART_STATE: 'btcai_chart_state'
}
```

### Миграция данных

При загрузке модуля `store.ts` выполняется:
1. Проверка старых индикаторов (не из фиксированного набора)
2. Автоматическая миграция на стандартный набор из 4 индикаторов
3. Сохранение пользовательских настроек (цвет, период, visible)

## Внешние зависимости

### Production

| Библиотека | Назначение |
|------------|-----------|
| `react` | UI фреймворк |
| `zustand` | State management |
| `lightweight-charts` | Финансовые графики |
| `@supabase/supabase-js` | Клиент для БД |

### Development

| Библиотека | Назначение |
|------------|-----------|
| `vite` | Сборка и dev сервер |
| `typescript` | Типизация |
| `tailwindcss` | Стилизация |
| `eslint` | Линтинг |

## Конфигурация окружения

```bash
# .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Производительность

### Оптимизации

1. **Мемоизация VWMA:** Кэширование расчетов при неизменных данных
2. **Селекторы Zustand:** Подписка только на нужные части состояния
3. **useMemo/useCallback:** Предотвращение лишних ререндеров
4. **Ограничение буфера:** 3000 записей (баланс памяти/истории)

### Потенциальные узкие места

- **VWMA(960)** на 3000 точках: 2041 значение × 4 индикатора = ~8000 расчетов
- **Обновление графика:** `setData()` перерисовывает все серии
- **localStorage:** Синхронные операции при каждом изменении настройки

## Расширение функционала

### Добавление нового индикатора

1. Добавить в `FIXED_VWMA_INDICATORS` (store.ts)
2. Добавить перевод в `INDICATOR_NAMES` (VWMAManager.tsx)
3. При необходимости - обновить логику `VWMAStatus.tsx`

### Изменение периода поллинга

```typescript
// App.tsx
setInterval(() => {
  pollNewData();
}, 60000); // <-- изменить значение (мс)
```

### Увеличение буфера данных

```typescript
// supabase.ts
.limit(5000) // <-- изменить лимит (макс ~10000 для производительности)
```

## Отладка

### Полезные консольные команды

```javascript
// Посмотреть текущие котировки
useCryptoStore.getState().quotations

// Посмотреть VWMA кэш
useCryptoStore.getState().getVWMALastValues()

// Принудительное обновление
useCryptoStore.getState().pollNewData()

// Сброс настроек VWMA
localStorage.removeItem('btcai_vwma_indicators')
location.reload()
```

## Частые проблемы

### Блоки исчезают после загрузки
- **Причина:** Ошибка в runtime (часто из-за `require()` в production)
- **Решение:** Проверить консоль, убедиться что все imports статические

### VWMA линии не отображаются
- **Причина:** Недостаточно данных (нужно минимум period точек)
- **Решение:** Проверить количество записей в БД

### Производительность при большом буфере
- **Причина:** Слишком много VWMA расчетов
- **Решение:** Уменьшить буфер или оптимизировать периоды

---

**Последнее обновление:** 2026-02-04  
**Версия приложения:** 0.0.0
