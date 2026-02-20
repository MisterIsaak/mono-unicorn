# Per-component entry points for @unicorn/ui

## Why

The `@unicorn/ui` component library will grow to ~30 components. Some will wrap heavy
third-party dependencies (e.g., a `UDataGrid` wrapping ag-grid). Today, all components
are exported through a single barrel at `@unicorn/ui/components`. When a consumer imports
from this barrel, their bundler must resolve the entire dependency graph — including ag-grid
— even if they only use `UButton`.

Tree-shaking can remove unused exports, but it requires:

1. All re-exports are statically analyzable
2. No side effects anywhere in the chain
3. `sideEffects: false` in package.json
4. The consumer's bundler to handle it correctly

Heavy dependencies like ag-grid often have side effects (CSS imports, global registrations)
that prevent reliable tree-shaking. Per-component entry points solve this definitively:
if a consumer never imports `@unicorn/ui/components/UDataGrid`, ag-grid is never encountered
by their bundler at all.

## What Vuetify does (for reference)

Vuetify 0 uses per-category entries via tsdown glob:

```ts
entry: ['./src/*/index.ts', './src/index.ts']
```

This creates entries for `components`, `composables`, `constants`, etc. — but NOT per-component.
Their package.json exports only expose category-level paths (`./components`), not deep paths
(`./components/Avatar`). Component isolation relies on tree-shaking.

Our proposal goes one level deeper than Vuetify.

## Tradeoffs

### Benefits

- Guarantees heavy dependency isolation (ag-grid, chart libraries, etc.)
- Zero-maintenance via glob entries and wildcard subpath exports
- Barrel exports still work — no regression for consumers who don't need granularity
- No meaningful build time or bundle size impact at 30 components

### Costs

- Commits `@unicorn/ui/components/ComponentName` as a stable public API path.
  Renaming a component directory becomes a breaking change for deep-path consumers.
- More files in `dist/` (~30 extra .mjs files). Negligible size impact.
- If two components share internal code, Rolldown extracts a shared chunk. A consumer
  importing only one component downloads that chunk too. Still far smaller than the
  alternative of pulling in an entire heavy dependency.

## Implementation

### 1. `packages/ui/vite.config.ts` — dynamic entry discovery

Replace hardcoded entries with a glob that finds all `index.ts` files under `src/`:

```ts
import { globSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const resolve = (path: string) => fileURLToPath(new URL(path, import.meta.url))

const entries = Object.fromEntries(
  globSync('src/**/index.ts', { cwd: fileURLToPath(new URL('.', import.meta.url)) }).map((file) => {
    // src/index.ts -> index
    // src/components/index.ts -> components/index
    // src/components/Button/index.ts -> components/Button/index
    const name = file === 'src/index.ts' ? 'index' : file.replace(/^src\//, '').replace(/\.ts$/, '')
    return [name, resolve(file)]
  }),
)

export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'esnext',
    lib: {
      entry: entries,
      formats: ['es'],
    },
    rolldownOptions: {
      external: ['vue'],
      output: {
        entryFileNames: '[name].mjs',
        chunkFileNames: '[name].mjs',
      },
    },
  },
})
```

This auto-discovers every `index.ts` under `src/`:

- `src/index.ts` -> `dist/index.mjs`
- `src/components/index.ts` -> `dist/components/index.mjs`
- `src/components/Button/index.ts` -> `dist/components/Button/index.mjs`
- `src/composables/index.ts` -> `dist/composables/index.mjs`

Adding a new component requires zero config changes.

### 2. `packages/ui/package.json` — wildcard subpath exports

Add wildcard patterns alongside existing category-level exports:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./components": "./src/components/index.ts",
    "./components/*": "./src/components/*/index.ts",
    "./composables": "./src/composables/index.ts",
    "./composables/*": "./src/composables/*/index.ts"
  },
  "publishConfig": {
    "exports": {
      ".": {
        "types": "./dist/index.d.ts",
        "import": "./dist/index.mjs"
      },
      "./components": {
        "types": "./dist/components/index.d.ts",
        "import": "./dist/components/index.mjs"
      },
      "./components/*": {
        "types": "./dist/components/*/index.d.ts",
        "import": "./dist/components/*/index.mjs"
      },
      "./composables": {
        "types": "./dist/composables/index.d.ts",
        "import": "./dist/composables/index.mjs"
      },
      "./composables/*": {
        "types": "./dist/composables/*/index.d.ts",
        "import": "./dist/composables/*/index.mjs"
      }
    }
  }
}
```

Consumer import paths:

- `@unicorn/ui` — everything (barrel)
- `@unicorn/ui/components` — all components (barrel)
- `@unicorn/ui/components/Button` — just UButton (isolated)
- `@unicorn/ui/composables/useTheme` — just useTheme (isolated)

### 3. External dependencies for heavy components

When adding a heavy component like `UDataGrid` wrapping ag-grid:

1. Add `ag-grid-vue3` (or similar) as a `peerDependency` and `devDependency`
2. Add it to `rolldownOptions.external` (either hardcoded or dynamically from peerDependencies)
3. Consumers who import `@unicorn/ui/components/UDataGrid` must install `ag-grid-vue3` themselves
4. Consumers who don't import it never encounter it

## Files modified

- `packages/ui/vite.config.ts`
- `packages/ui/package.json`

## Verification

1. `pnpm build` — confirm `dist/` contains per-component files:
   ```
   dist/
     index.mjs
     components/index.mjs
     components/Button/index.mjs
     composables/index.mjs
   ```
2. `pnpm type-check` — confirm type resolution works with wildcard exports
3. In `apps/web`, test both import styles resolve:
   - `import { UButton } from '@unicorn/ui/components'` (barrel)
   - `import { UButton } from '@unicorn/ui/components/Button'` (per-component)
4. `pnpm test` — confirm existing tests pass
