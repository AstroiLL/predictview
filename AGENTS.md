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

# AI Agent Instructions

Guidelines for AI assistants working on BTCAI PredictView - a React-based Bitcoin price visualization app.

## Build & Development Commands

```bash
# Development
npm run dev              # Start Vite dev server (http://localhost:5173)
npm run preview          # Preview production build locally

# Build
npm run build            # TypeScript check + Vite production build

# Linting
npm run lint             # ESLint check
```

**Note:** No test framework is currently configured. If adding tests, prefer Vitest for Vite compatibility.

## Project Structure

```
src/
├── components/          # React components
│   ├── Chart.tsx       # lightweight-charts integration
│   ├── DirectionVector.tsx  # Price direction indicator
│   └── VWMAManager.tsx # VWMA configuration UI
├── lib/                # Utilities and state
│   ├── store.ts        # Zustand state management
│   ├── supabase.ts     # Supabase client & queries
│   └── vwma.ts         # VWMA calculation
├── types/              # TypeScript definitions
│   └── quotations.ts   # Core data types
└── App.tsx             # Root component
```

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** - no implicit any, strict null checks
- Use explicit return types for exported functions
- Type imports: `import type { Foo } from './types'`
- Interfaces for props: `interface ChartProps { className?: string }`
- Prefer `interface` over `type` for object shapes
- Nullable types: `string | null` instead of optional for state

### React Components

- Functional components only
- Props interfaces named with `Props` suffix: `ChartProps`, `VWMAManagerProps`
- Destructure props in component signature: `function Chart({ className }: ChartProps)`
- Default props via destructuring: `{ className = '' }`
- Hooks order: useState, useEffect, useMemo, useRef, callbacks
- Store selectors: `const value = useCryptoStore(state => state.value)`

### Naming Conventions

- Components: PascalCase (`Chart.tsx`, `VWMAManager.tsx`)
- Functions: camelCase, descriptive (`fetchInitialData`, `calculateVWMA`)
- Constants: UPPER_SNAKE_CASE for module-level constants
- Types: PascalCase with descriptive names
- Files: Match exported component name

### Styling

- Tailwind CSS for all styling
- CSS variables for theme colors: `var(--accent-amber)`, `var(--bg-card)`
- Inline styles for dynamic theme values only
- Component className props for flexibility

### State Management (Zustand)

```typescript
// Store structure
interface StoreState {
  data: DataType[];
  isLoading: boolean;
  error: string | null;
  // Actions
  fetchData: () => Promise<void>;
  updateItem: (id: string) => void;
}

// Usage in components
const data = useCryptoStore(state => state.data);
```

### Error Handling

- Store async errors in state: `error: string | null`
- try/catch with specific error messages
- Console.error for debugging, user-friendly messages in UI
- Type guards: `error instanceof Error ? error.message : 'Unknown error'`

### Comments

- Russian language for business logic comments
- JSDoc for utility functions with @param and @returns
- TODO format: `// TODO: description`

### Imports Order

1. React imports
2. Third-party libraries (zustand, lightweight-charts)
3. Type imports
4. Local imports (components, lib, types)
5. Relative imports: `../lib/store`, `./Chart`

### Environment Variables

Prefix with `VITE_` for client-side access:
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## Before Committing

1. Run `npm run lint` - fix any ESLint errors
2. Run `npm run build` - ensure TypeScript compiles
3. Test in browser with `npm run dev`
4. Check for unused imports/variables (TypeScript strict mode catches these)

## Key Dependencies

- **React 18** - UI framework
- **Vite** - Build tool
- **TypeScript** - Type safety (strict mode)
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **lightweight-charts** - Financial charts
- **Supabase** - Backend/data

## Performance Notes

- Use `useMemo` for expensive calculations (VWMA, chart data)
- Memoize callbacks with `useCallback` if passed to children
- Chart uses refs to avoid re-renders
- Polling every 60 seconds for new data
