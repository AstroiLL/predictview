# BTCAI PredictView

Система визуализации цены Bitcoin с ML-предсказанием направления движения.

## Возможности

- **График цены** — отображение цены BTC в реальном времени (lightweight-charts)
- **Объемы торгов** — гистограмма с цветовой индикацией движения
- **VWMA индикатор** — взвешенные по объему скользящие средние (настраиваемый период)
- **Вектор направления** — визуализация ML-предсказания (вверх/вбок/вниз)
- **Автообновление** — polling каждые 10 секунд

## Технологический стек

| Компонент | Технология |
|-----------|------------|
| Framework | Vite + React 18 + TypeScript |
| Charts | lightweight-charts (TradingView) |
| State | Zustand |
| Styling | Tailwind CSS |
| Database | Supabase |

## Установка

```bash
npm install
```

## Настройка

Создайте файл `.env` с переменными Supabase:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Структура данных

Таблица `quotations` в Supabase:

```sql
CREATE TABLE quotations (
  time     TIMESTAMP    PRIMARY KEY,
  close    FLOAT8       NOT NULL,
  vol      FLOAT8       NOT NULL DEFAULT 0,
  dir      INTEGER      NOT NULL DEFAULT 0,
  liq      INTEGER
);
```

| Поле | Описание |
|------|----------|
| `time` | Время свечи |
| `close` | Цена закрытия |
| `vol` | Объем торгов |
| `dir` | Направление (0=вниз, 1=вверх) |
| `liq` | Ликвидность (опционально) |

## Запуск

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5173`

## Сборка

```bash
npm run build
npm run preview
```

## VWMA Формула

```
VWMA = Σ(Price × Volume) / Σ(Volume)
```

Период усреднения настраивается в UI (по умолчанию 20).

## Лицензия

MIT
