# Unicorn

Vue 3.6 (beta) monorepo using pnpm 10 workspaces, Turborepo, Vite 8 (beta), and TypeScript ~5.9.

## Architecture

Package dependency graph:

- `@unicorn/web` -> `@unicorn/ui` (runtime dep)
- `@unicorn/storybook` -> `@unicorn/ui` (runtime dep)
- `@unicorn/ui` — standalone component library with `vue` as peer dep

## Commands

| Command                                | Description                                              |
| -------------------------------------- | -------------------------------------------------------- |
| `pnpm dev`                             | Start all dev servers (Turborepo)                        |
| `pnpm build`                           | Build all packages (Turborepo, builds @unicorn/ui first) |
| `pnpm lint`                            | Run OxLint + ESLint in check mode                        |
| `pnpm lint:fix`                        | Run OxLint + ESLint with auto-fix                        |
| `pnpm test`                            | Run Vitest across all packages                           |
| `pnpm type-check`                      | Run vue-tsc --build (project references)                 |
| `pnpm format`                          | Format with Oxfmt                                        |
| `pnpm format:check`                    | Check formatting with Oxfmt (CI)                         |
| `pnpm repo:check`                      | Run knip (unused code detection)                         |
| `pnpm --filter @unicorn/storybook dev` | Start Storybook on port 6006                             |

## Conventions

- Component prefix: `U` (e.g. `UButton`, `UCard`)
- Category-level imports: `import { UButton } from '@unicorn/ui/components'`
- Co-located tests: `UButton.test.ts` next to `UButton.vue`
- Stories live in `apps/storybook/stories/` (one per component)
- No semicolons, single quotes (Oxfmt: `semi: false`, `singleQuote: true`)
- Oxfmt sorts imports automatically; `@unicorn/` imports are classified as internal
- OxLint categories: `correctness` (error), `suspicious` (warn), `pedantic` (warn)
- ESLint uses `vueTsConfigs.recommendedTypeChecked` (type-aware rules) and Vue `flat/recommended`
- `eslint-plugin-oxlint` auto-disables ESLint rules already covered by OxLint
- 2-space indentation
- All packages use `type: "module"`

## Adding a new component to @unicorn/ui

1. Create directory: `packages/ui/src/components/ComponentName/`
2. Add `UComponentName.vue`, `UComponentName.test.ts`, `index.ts`
3. Re-export from `packages/ui/src/components/index.ts`
4. Create story in `apps/storybook/stories/ComponentName.stories.ts`

## Adding a new dependency

1. Add version to catalog in `pnpm-workspace.yaml`
2. Reference with `catalog:` in the target `package.json`

## Adding a new app to apps/

1. Create directory under `apps/` (must be exactly one level deep)
2. Add to root `tsconfig.json` references array
3. Must include: `tsconfig.json` (references-only), `tsconfig.app.json`, `tsconfig.node.json`, `eslint.config.ts`
4. Note: `tsconfig extends` paths assume one level of nesting (`../../tsconfig.app.json`)

## TypeScript architecture

- Per-project `tsconfig.json` is references-only (`"files": []`)
- Actual configs: `tsconfig.app.json` (browser), `tsconfig.lib.json` (library), `tsconfig.node.json` (config files), `tsconfig.vitest.json` (tests)
- All sub-configs need `"composite": true`
- `vue-tsc --build` uses project references for cross-package validation

## Publishing (@unicorn/ui)

- Dev: `exports` point to `./src/*.ts` (source)
- Published: `publishConfig.exports` swaps in `./dist/*.mjs` + `./dist/*.d.ts` with `"types"` condition first
- `pnpm publish` triggers `prepublishOnly` which builds first

## Pre-commit hooks

lint-staged runs `oxlint --fix` + `eslint --fix --cache` on `*.{ts,vue}` and `oxfmt` on all files. Full type-check and tests only in CI.

## Future additions

VitePress for prose docs, Pinia for state management (when needed).
