# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## Project Overview

BTCAI PredictView - Real-time Bitcoin price visualization with ML-based direction prediction. Built with Vite + React + TypeScript, using lightweight-charts for financial visualization and Supabase as the data source.

## Development Commands

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # TypeScript build + Vite production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

## Tech Stack

- **Framework**: Vite + React 18 + TypeScript
- **Charts**: lightweight-charts (TradingView)
- **State**: Zustand
- **Styling**: Tailwind CSS
- **Backend**: Supabase (quotations table)

## Architecture

### Data Flow

```
Supabase (quotations table)
    ↓ fetchQuotations()
Zustand Store (src/lib/store.ts)
    ↓ useCryptoStore()
Components (Chart, DirectionVector)
```

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/store.ts` | Zustand store with polling, VWMA computation |
| `src/lib/supabase.ts` | Supabase client, fetchQuotations() |
| `src/lib/vwma.ts` | calculateVWMA() - Volume Weighted MA |
| `src/types/quotations.ts` | TypeScript types for Quotation |

### State Management (Zustand)

The store (`useCryptoStore`) manages:
- `quotations[]` - array from Supabase
- `currentDirection` - latest dir value (0=down, 1=up)
- `vwmaPeriod` - configurable period (default 20)
- `isLoading`, `error` - UI state

Actions:
- `fetchInitialData()` - loads first batch
- `pollNewData()` - incremental fetch (uses `gt('time', afterDate)`)
- `setVWMAPeriod(n)` - update VWMA period

Computed getters:
- `getVWMA()` - returns calculated VWMA array
- `getCurrentQuote()` - returns latest quotation

### Supabase Integration

**Environment variables** (`.env`):
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

**Table schema** (`quotations`):
```sql
time     TIMESTAMP    -- Candle time
close    FLOAT8       -- Close price
vol      FLOAT8       -- Volume
dir      INTEGER      -- Direction (0=down, 1=up)
liq      INTEGER      -- Liquidity (nullable)
```

`fetchQuotations(after?: Date)` - returns records after given time, ordered ascending.

### Chart Components

**Chart.tsx** - lightweight-charts with:
- Line series (price)
- Histogram series (volume, colored green/red based on price movement)
- Line series (VWMA, configurable period)

**DirectionVector.tsx** - SVG arrow indicating price direction based on `dir` field:
- Green arrow up (dir = 1)
- Red arrow down (dir = 0)

### VWMA Calculation

Formula: `VWMA = Σ(Price × Volume) / Σ(Volume)` over N periods

Implemented in `src/lib/vwma.ts`. Returns `number | undefined` for each data point (undefined when insufficient data).

## Polling Strategy

App polls every 10 seconds (see `App.tsx` useEffect). Polling fetches only new records via `gt('time', lastTime)` to minimize data transfer.
