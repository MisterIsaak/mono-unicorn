# Unicorn Monorepo Scaffolding Plan (Revised)

## Context

Setting up a greenfield Vue 3 monorepo on a blank GitLab repository. The goal is a well-structured, industry-standard monorepo that new hires can onboard to quickly. Developer experience and performance needs to be a priority. Do not over engineer and clearly document how things work. The workspace includes a custom component library, its documentation site (Storybook), one or more Vue frontend apps, and shared tooling configs. The custom component library will start small but quickly reach 30 components or more. The component library will be published to an internal npm registry (via `pnpm publish`) and consumed by Vite-based apps both inside and outside this monorepo (no Webpack, no SSR, no non-Vite consumers). pnpm is the only package manager used across all projects.

**Environment**: Node 24.10, pnpm 10.26, Windows, GitLab-hosted.

---

## Tech Stack

| Category               | Tool                 | Version |
| ---------------------- | -------------------- | ------- |
| Runtime                | Node.js              | 24.10   |
| Package manager        | pnpm                 | 10.26   |
| Monorepo orchestration | Turborepo            | latest  |
| Framework              | Vue                  | 3.x     |
| Build tool             | Vite                 | latest  |
| Language               | TypeScript           | 5.x     |
| Routing                | Vue Router           | 4.x     |
| Linter                 | ESLint (flat config) | 9.x     |
| Formatter              | Prettier             | 3.x     |
| Component docs         | Storybook            | 10.x    |
| Storybook framework    | @storybook/vue3-vite | 10.x    |
| Testing                | Vitest               | latest  |
| Component testing      | @vue/test-utils      | latest  |
| Test DOM               | happy-dom            | latest  |
| Git hooks              | simple-git-hooks     | latest  |
| Staged file linting    | lint-staged          | latest  |
| Unused code detection  | knip                 | latest  |
| CI/CD                  | GitLab CI            | —       |

---

## Final Structure

```
unicorn/
├── apps/
│   ├── web/                        # Vue 3 + Vite app
│   │   ├── src/
│   │   │   ├── App.vue
│   │   │   ├── main.ts
│   │   │   ├── router/index.ts
│   │   │   ├── views/HomeView.vue
│   │   │   └── vite-env.d.ts
│   │   ├── index.html
│   │   ├── package.json            # @unicorn/web
│   │   ├── tsconfig.json
│   │   ├── tsconfig.app.json
│   │   ├── vite.config.ts
│   │   └── eslint.config.js
│   └── storybook/                  # Storybook for component development & docs
│       ├── .storybook/
│       │   ├── main.ts             # Storybook config (framework, stories glob)
│       │   └── preview.ts          # Global decorators and parameters
│       ├── stories/                # Story files (one per component)
│       │   └── Button.stories.ts
│       ├── package.json            # @unicorn/storybook
│       ├── tsconfig.json           # Extends ../../tsconfig.app.json
│       └── eslint.config.js
├── packages/
│   └── ui/                         # Shared Vue component library
│       ├── src/
│       │   ├── components/
│       │   │   └── Button/
│       │   │       ├── UButton.vue
│       │   │       ├── UButton.test.ts
│       │   │       └── index.ts
│       │   ├── composables/        # Shared composables (when needed)
│       │   │   └── index.ts
│       │   └── index.ts            # Top-level barrel (re-exports categories)
│       ├── vitest.config.ts
│       ├── package.json            # @unicorn/ui (category-level subpath exports)
│       ├── tsconfig.json
│       ├── vite.config.ts          # lib mode build
│       └── eslint.config.js
├── .vscode/
│   └── extensions.json             # Recommended extensions (Volar, ESLint)
├── .editorconfig
├── .gitattributes
├── .gitignore
├── .gitlab-ci.yml
├── .npmrc
├── eslint.config.js                # Root shared ESLint flat config
├── knip.json                       # Unused code/dependency detection config
├── prettier.config.js              # Root shared Prettier config
├── tsconfig.json                   # Root with project references
├── tsconfig.base.json              # Shared base TypeScript compiler options
├── tsconfig.app.json               # For Vue apps (extends base)
├── tsconfig.lib.json               # For libraries (extends base)
├── turbo.json
├── pnpm-workspace.yaml             # Workspaces + dependency catalog
├── package.json                    # Root workspace config (packageManager field)
├── README.md
└── CLAUDE.md
```

### Changes from original plan

- **Removed `packages/eslint-config/`, `packages/prettier-config/`, `packages/tsconfig/`**. Config files live at the repo root. No consumers outside this repo exist yet; extracting into packages is trivial to do later if needed. This cuts ~12 files and removes a layer of indirection for onboarding.
- **Replaced `apps/docs/` (VitePress) with `apps/storybook/`**. With 50+ components expected, Storybook provides more value than a markdown docs site: interactive prop controls, isolated component development, auto-generated API docs from TypeScript types, and a visual regression testing foundation. VitePress can be added later for prose documentation (guides, design principles).
- **Added Vitest** to `packages/ui/`. With 50+ components expected, testing should be part of the workflow from day one — not retrofitted later.
- **Added `.gitattributes`**. Required for consistent line endings on a Windows team.
- **Added `use-node-version=24.10.0` in `.npmrc`** + `engines` field in root `package.json`. pnpm manages the Node version directly — no need for nvm/fnm.
- **Added `.gitlab-ci.yml`**. The verification steps should run in CI from day one, not just locally.
- **Added pnpm catalog** in `pnpm-workspace.yaml`. All dependency versions declared once centrally — prevents version drift as packages multiply.
- **Added `packageManager` field** in root `package.json`. Pins the exact pnpm version via Corepack.
- **Added simple-git-hooks + lint-staged**. Pre-commit hook lints and formats staged files only. Full type-check and test suite run in CI.
- **Added knip**. Detects unused files, dependencies, and exports — essential as the component count grows.
- **Added `.vscode/extensions.json`**. Prompts new hires to install Volar and ESLint extensions on first open.
- **Added TypeScript project references**. Root `tsconfig.json` references each package/app for incremental type-checking.

---

## Steps

### 1. Root workspace files

Create root-level configuration files:

- **`package.json`** — Private workspace root. Includes:
  - Scripts: `dev`, `build`, `lint`, `type-check`, `test`, `format`, `repo:check`. All delegate to Turborepo except `repo:check` which runs knip directly.
  - `"packageManager": "pnpm@10.26.2"` — Pins the exact pnpm version. When a contributor runs `corepack enable && pnpm install`, Corepack automatically installs this version. No manual pnpm install step.
  - `"engines": { "node": ">=24.10.0" }` — Guardrail for anything that bypasses pnpm.
  - `"simple-git-hooks": { "pre-commit": "pnpm lint-staged" }` — Runs fast, file-scoped checks on staged files only. Full type-check and test suite run in CI. See step 5 for details.
  - `"lint-staged": { "*.{ts,vue}": ["eslint --fix"], "*.{ts,vue,js,json,md,yaml}": ["prettier --write"] }` — Scoped to changed files for fast commits.
  - `"prepare": "simple-git-hooks"` — Installs the git hooks after `pnpm install`.
- **`pnpm-workspace.yaml`** — Declares `apps/*` and `packages/*`. Includes a **catalog** section that centralizes all dependency versions. Packages reference versions via `catalog:` instead of hardcoded strings. See [Appendix B](#appendix-b-pnpm-catalog) for details.
- **`turbo.json`** — Task pipeline: `build` depends on `^build` (upstream packages first), `dev` is persistent/no-cache, `lint`/`type-check`/`test` are independent.
- **`.npmrc`** — Contains `use-node-version=24.10.0` so pnpm manages the Node version automatically. Also includes `store-dir=.pnpm-store` so the pnpm store is local to the project (required for CI caching — pnpm's default store is global and won't be captured by CI cache paths). Do NOT set `strict-peer-dependencies=false` — in a greenfield repo, peer dependency conflicts indicate a version mismatch that should be fixed, not suppressed. Only add this flag later if a specific dependency forces it.
- **`.editorconfig`** — 2-space indent, UTF-8, LF line endings, final newline, trim trailing whitespace.
- **`.gitignore`** — Node modules, `dist/`, Vite cache, editor files, OS files, `.turbo/`.
- **`.gitattributes`** — `* text=auto eol=lf`. Prevents line-ending inconsistencies across the team, which would cause Prettier `--check` failures and noisy diffs on Windows.
- **`.vscode/extensions.json`** — Recommends `Vue.volar` and `dbaeumer.vscode-eslint`. VS Code prompts contributors to install these on first open.
- **`knip.json`** — Configuration for knip (unused code detection). Points entry files to each package/app's source. Ignores generated files and test utilities. See step 5 for details.

### 2. Shared TypeScript configs (root level)

Create tsconfig files at the repo root:

- **`tsconfig.json`** — Root project references file. Does not contain compiler options — only `references` pointing to each package and app:
  ```json
  {
    "references": [
      { "path": "./packages/ui" },
      { "path": "./apps/web" },
      { "path": "./apps/storybook" }
    ]
  }
  ```
  This enables incremental type-checking: `vue-tsc --build` only rechecks packages that changed. Becomes increasingly valuable as the monorepo grows.
- **`tsconfig.base.json`** — Shared compiler options: strict mode, ES2024 target (Node 24 supports it; browser downleveling is Vite's job), bundler module resolution, Vue JSX support, `composite: true`. Does NOT set `declaration` — that differs between apps and libraries.
- **`tsconfig.app.json`** — Extends base. Adds DOM lib, `noEmit: true` (Vite handles the build; TypeScript is only used for type-checking). Consumed by apps via `"extends": "../../tsconfig.app.json"`.
- **`tsconfig.lib.json`** — Extends base. Adds `declaration: true`, `declarationMap: true`, `outDir: "./dist"` (emit `.d.ts` files for published consumers). Consumed by packages via `"extends": "../../tsconfig.lib.json"`.

### 3. Shared ESLint config (root level)

Create a single `eslint.config.js` at the repo root using ESLint 9 flat config:

- TypeScript-ESLint recommended rules.
- `eslint-plugin-vue` recommended rules with TypeScript parser for `<script>` blocks.
- `eslint-config-prettier` to disable formatting rules that conflict with Prettier.
- Ignores `dist/`, `node_modules/`, `.turbo/`.

Each package/app has its own thin `eslint.config.js` that imports and re-exports the root config (required by ESLint's flat config resolution). These are one-liners.

Root `package.json` devDependencies: `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-vue`, `eslint-config-prettier`.

### 4. Shared Prettier config (root level)

Create `prettier.config.js` at the repo root:

- Single quotes, 2-space indent, trailing commas (`all`), 100 char print width, semicolons.
- Referenced from root `package.json` is not needed since Prettier auto-discovers `prettier.config.js` at the root.

No separate package. If another repo needs the same config, extract it then.

### 5. Repo health tooling

Set up tooling that keeps the codebase clean as it grows:

- **simple-git-hooks + lint-staged** — Configured in root `package.json`. The `prepare` script runs `simple-git-hooks` after `pnpm install` to install the pre-commit hook. The pre-commit hook runs `pnpm lint-staged`, which lints and formats only staged files. This keeps commits fast (seconds, not minutes). Full type-check and test suite run in CI, not on every commit — with 30+ components, running the full suite pre-commit would significantly slow iteration. Lighter than husky (single dependency, no `.husky/` directory).
- **knip** — Configured via `knip.json` at the root. Detects unused files, unused dependencies in `package.json`, and unused exports. Run via `pnpm repo:check` (which runs `knip`). Especially valuable with 30+ components — catches dead exports when components are refactored or removed. Add to CI once the initial scaffolding is stable.

### 6. Component library (`packages/ui/`)

Create `@unicorn/ui`:

- **Vite lib mode** build config outputting ESM with multiple entry points (one per category).
- **Starter component**: `UButton.vue` — a simple, typed button component demonstrating props, emits, and slots. The `U` prefix follows the Vue convention of namespacing components to avoid collisions with native HTML elements and third-party libraries (`U` for Unicorn). Includes a `UButton.test.ts` (Vitest unit test) co-located in the component directory. The corresponding `Button.stories.ts` lives in `apps/storybook/stories/`. Together these form the template for all future components.
- **Category-level subpath exports** (see [Appendix A](#appendix-a-category-level-subpath-exports) for a detailed explanation). The `package.json` `exports` field exposes categories, not individual components:
  ```json
  "exports": {
    ".": "./src/index.ts",
    "./components": "./src/components/index.ts",
    "./composables": "./src/composables/index.ts"
  },
  "publishConfig": {
    "exports": {
      ".": "./dist/index.mjs",
      "./components": "./dist/components/index.mjs",
      "./composables": "./dist/composables/index.mjs"
    }
  }
  ```
  **In the monorepo**, exports point directly to TypeScript source — no build step required, no conditional resolution, all tools (Vite, TypeScript, Vitest, Storybook) resolve source without special configuration. **When published** to the internal npm registry, pnpm swaps `exports` with `publishConfig.exports`, so external consumers get the built `dist/` output. This avoids the `"development"` condition footgun where tools silently fall back to `dist/` and break if the library isn't built.
  Consumers import from a category: `import { UButton, UInput } from '@unicorn/ui/components'`. Tree-shaking eliminates unused components in production builds.
- **Barrel files within each category.** `src/components/index.ts` re-exports all components. This follows the same pattern used by Vuetify v0, Radix Vue, and other major Vue component libraries. New components are added by creating a directory under `src/components/` and adding one re-export line to `src/components/index.ts`.
- **Vitest** configured via `vitest.config.ts`. Uses `@vue/test-utils` for component mounting. Test files are co-located with components (`UButton.test.ts` next to `UButton.vue`).
- **`package.json`** — Peer dependency on `vue`. Scripts: `build`, `test`, `lint`, `type-check`. devDependencies: `vitest`, `@vue/test-utils`, `happy-dom` (lightweight DOM environment for tests).

### 7. Web application (`apps/web/`)

Create `@unicorn/web`:

- **Vue 3 + Vite + Vue Router + TypeScript**.
- **`src/App.vue`** — Root component with `<RouterView>`.
- **`src/views/HomeView.vue`** — Landing page importing `UButton` from `@unicorn/ui/components`.
- **`src/router/index.ts`** — Basic router setup with history mode.
- **`vite.config.ts`** — Standard Vue + Vite config.
- **`package.json`** — Depends on `@unicorn/ui`, `vue`, `vue-router`. Scripts: `dev`, `build`, `preview`, `lint`, `type-check`.

### 8. Storybook (`apps/storybook/`)

Create `@unicorn/storybook` using Storybook 10 with the `@storybook/vue3-vite` framework:

- **`.storybook/main.ts`** — Framework set to `@storybook/vue3-vite` with `vue-component-meta` docgen explicitly configured (this does not work out of the box — it requires the `docgen` option in framework options with a `tsconfig` path). The path must point to the storybook app's own `tsconfig.json` (which extends `tsconfig.app.json` and has the right compiler options), not the root `tsconfig.json` (which only contains project references and no compiler options):
  ```ts
  framework: {
    name: '@storybook/vue3-vite',
    options: {
      docgen: {
        plugin: 'vue-component-meta',
        tsconfig: './tsconfig.json', // resolves to apps/storybook/tsconfig.json
      },
    },
  },
  ```
  Stories glob: `../stories/**/*.stories.ts`. No addons required — Storybook 10 includes Controls, Actions, and Docs out of the box.
- **`.storybook/preview.ts`** — Global parameters (e.g., controls matchers for color/date props). Add global decorators here later if needed (e.g., theme provider wrapper).
- **`stories/`** — Story files live here, one per component (e.g., `Button.stories.ts`). This follows the Vuetify v0 convention of keeping stories in the storybook app rather than co-located with components. Stories import components from `@unicorn/ui/components`.
- **`package.json`** — Depends on `@unicorn/ui`. devDependencies: `storybook`, `@storybook/vue3-vite`. Scripts: `dev` (runs `storybook dev -p 6006`), `build` (runs `storybook build`).
- **Story format**: CSF3 with Vue 3 composition API. Types (`Meta`, `StoryObj`) import from `@storybook/vue3-vite`. Autodocs enabled via `tags: ['autodocs']` on each story meta.

### 9. GitLab CI (`.gitlab-ci.yml`)

Create a minimal pipeline that runs the verification steps on every push and merge request:

```yaml
image: node:24.10.0

stages:
  - validate

validate:
  stage: validate
  before_script:
    - corepack enable
    - pnpm install --frozen-lockfile
  script:
    - pnpm lint
    - pnpm type-check
    - pnpm test
    - pnpm build
    - pnpm format --check
  cache:
    key: pnpm-$CI_COMMIT_REF_SLUG
    paths:
      - .pnpm-store/
```

This ensures the scaffolding works in a clean environment, not just locally.

### 10. CLAUDE.md

Create a `CLAUDE.md` at the root with:

- Project overview and architecture.
- Available commands (`pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm test`, `pnpm repo:check`, etc.).
- Package dependency graph (`@unicorn/web` → `@unicorn/ui`, `@unicorn/storybook` → `@unicorn/ui`).
- Conventions: `U` component prefix, category-level imports (`@unicorn/ui/components`), file structure patterns.
- How to add a new component to `@unicorn/ui` (create component + test in `packages/ui/`, create story in `apps/storybook/stories/`).
- How to add a new dependency (add to pnpm catalog first, then reference with `catalog:` in the package).
- How to add a new app to `apps/` (including adding it to `tsconfig.json` project references).
- How `publishConfig.exports` works (source in monorepo, built output when published).
- Pre-commit hook behavior (lint-staged runs lint + format on staged files only; full type-check and tests run in CI).
- Note: VitePress can be added later for prose documentation (design principles, getting started guides) that doesn't fit in Storybook.

### 11. README.md

Replace the default GitLab README with a proper project README:

- Prerequisites (Node 24.10+, pnpm 10+, Windows developer mode enabled for pnpm symlinks).
- Getting started instructions (`pnpm install`, `pnpm dev`).
- Project structure overview.
- How to run Storybook (`pnpm --filter @unicorn/storybook dev`) for browsing components.
- IDE setup: recommend Volar extension for VS Code, note that `vue-tsc` is used for type checking.

---

## Key Decisions

| Decision              | Choice                                           | Rationale                                                                                                                                   |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Package manager       | pnpm 10 + workspaces + catalog                   | Centralized version management; prevents drift across packages                                                                              |
| pnpm version pinning  | `packageManager` field + Corepack                | Ensures every contributor uses the exact same pnpm version                                                                                  |
| Orchestration         | Turborepo                                        | Minimal config, build caching, easy to remove if unwanted                                                                                   |
| Package scope         | `@unicorn/`                                      | Consistent internal namespace                                                                                                               |
| ESLint                | v9 flat config at root                           | Current standard; no separate package until there's a second repo                                                                           |
| Prettier              | Root config file                                 | Auto-discovered by Prettier; extract to package only when needed externally                                                                 |
| TS configs            | Root-level files + project references            | `extends` via relative paths; root `tsconfig.json` with `references` for incremental type-checking                                          |
| Component lib imports | Category-level subpath exports + `publishConfig` | Source in monorepo, built output when published; no `"development"` condition footgun                                                       |
| Component prefix      | `U` (for Unicorn)                                | Vue convention to avoid collisions with HTML elements and third-party components                                                            |
| TS target             | ES2024                                           | Matches Node 24 runtime; Vite handles browser downleveling                                                                                  |
| Component docs        | Storybook 10                                     | Controls/Actions/Docs built in (no addons needed), vue-component-meta docgen, visual testing foundation; add VitePress later for prose docs |
| State management      | Deferred                                         | Add Pinia when needed, not before                                                                                                           |
| Testing               | Vitest + @vue/test-utils from day one            | 50+ components can't be retrofitted with tests later; co-located test files next to components                                              |
| CI                    | Included from day one                            | Catches "works on my machine" issues immediately                                                                                            |
| Git hooks             | simple-git-hooks + lint-staged                   | Pre-commit runs lint/format on staged files only; type-check + test run in CI                                                               |
| Unused code detection | knip                                             | Catches dead exports, unused deps, orphaned files as component count grows                                                                  |
| IDE setup             | `.vscode/extensions.json`                        | Prompts Volar + ESLint install on first open; zero-friction onboarding                                                                      |
| Line endings          | LF enforced via `.gitattributes`                 | Prevents cross-platform line ending issues and Prettier check failures                                                                      |
| Node version          | `use-node-version` in `.npmrc` + `engines`       | pnpm manages Node directly; no nvm/fnm needed                                                                                               |

---

## Verification

After scaffolding, run these commands to verify everything works. All generated code must pass these checks before committing — expect to iterate if ESLint rules or Prettier formatting disagree with the generated code.

1. `pnpm install` — All dependencies resolve without errors (catalog versions, no `strict-peer-dependencies=false` needed). Git hooks are installed via the `prepare` script.
2. `pnpm build` — Turborepo builds `@unicorn/ui` first, then downstream packages. Exits 0.
3. `pnpm dev` — Dev server starts for `@unicorn/web` (port 5173). `UButton` renders correctly on the home page.
4. `pnpm --filter @unicorn/storybook dev` — Storybook starts. UButton stories render with interactive controls.
5. `pnpm lint` — ESLint runs across all packages with no errors.
6. `pnpm type-check` — `vue-tsc` compiles with no errors (using project references for incremental checking).
7. `pnpm test` — Vitest runs the UButton test and passes.
8. `pnpm format --check` — Prettier reports no formatting issues.
9. `pnpm repo:check` — knip reports no unused files, dependencies, or exports.

After local verification, push and confirm the GitLab CI pipeline passes.

---

## Appendix A: Category-Level Subpath Exports

### The problem

A component library needs to expose its code to consumers. The naive approach is a single barrel file at the package root that re-exports everything:

```ts
// packages/ui/src/index.ts
export * from './components/Button'
export * from './components/Input'
export * from './components/Dialog'
export * from './composables/useForm'
export * from './composables/useTheme'
// ... 50+ more lines
```

Consumers write `import { UButton } from '@unicorn/ui'`. This works, but it has a cost: any tool that processes this import (bundler, TypeScript, dev server) must load and resolve _every_ export in the barrel, even if the consumer only uses `UButton`.

### The three strategies

There are three common ways to structure package exports, each with different trade-offs:

**1. Single barrel (flat)**

```
@unicorn/ui → src/index.ts (re-exports everything)
```

```ts
import { UButton, useTheme } from '@unicorn/ui'
```

- Simplest for consumers — one import path for everything.
- Worst for tooling — everything is pulled in through one entry point.
- Used by: many small libraries where the total export count is low.

**2. Per-item entry points (granular)**

```
@unicorn/ui/Button     → src/components/Button/index.ts
@unicorn/ui/Input      → src/components/Input/index.ts
@unicorn/ui/useTheme   → src/composables/useTheme/index.ts
```

```ts
import { UButton } from '@unicorn/ui/Button'
import { useTheme } from '@unicorn/ui/useTheme'
```

- Best for tooling — only the exact module you import is resolved.
- Worst for maintenance — every new component requires a new entry in the `exports` map. With 50+ components this becomes a long list.
- Worse DX — importing 5 components means 5 import lines.
- Used by: some icon libraries, lodash-es.

**3. Category-level subpath exports (what we're using)**

```
@unicorn/ui             → src/index.ts (re-exports categories)
@unicorn/ui/components  → src/components/index.ts (re-exports all components)
@unicorn/ui/composables → src/composables/index.ts (re-exports all composables)
```

```ts
import { UButton, UInput, UDialog } from '@unicorn/ui/components'
import { useTheme, useForm } from '@unicorn/ui/composables'
```

- Middle ground — a small number of entry points (3-6), each scoped to a category.
- Consumer DX is clean — one import line per category, multiple named imports.
- Maintenance is easy — adding a component means one line in `src/components/index.ts`, not in `package.json`.
- Tree-shaking works — bundlers (Vite/Rollup) eliminate unused named exports from barrel files in production builds.
- Used by: **Vuetify v0**, Radix Vue, and other mature Vue libraries.

### How it works in practice

#### File structure

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── UButton.vue
│   │   │   └── index.ts          # exports UButton
│   │   ├── Input/
│   │   │   ├── UInput.vue
│   │   │   └── index.ts          # exports UInput
│   │   ├── Dialog/
│   │   │   ├── UDialog.vue
│   │   │   ├── UDialogContent.vue
│   │   │   └── index.ts          # exports UDialog, UDialogContent
│   │   └── index.ts              # CATEGORY BARREL — re-exports all components
│   ├── composables/
│   │   ├── useTheme/
│   │   │   └── index.ts
│   │   ├── useForm/
│   │   │   └── index.ts
│   │   └── index.ts              # CATEGORY BARREL — re-exports all composables
│   └── index.ts                  # TOP-LEVEL BARREL — re-exports categories
└── package.json
```

#### The barrel files

Each level re-exports the level below it:

```ts
// src/components/Button/index.ts — component entry
export { default as UButton } from './UButton.vue'
export type { ButtonProps, ButtonEmits } from './UButton.vue'
```

```ts
// src/components/index.ts — category barrel
export * from './Button'
export * from './Input'
export * from './Dialog'
```

```ts
// src/index.ts — top-level barrel
export * from './components'
export * from './composables'
```

#### The package.json exports map

```json
{
  "name": "@unicorn/ui",
  "exports": {
    ".": "./src/index.ts",
    "./components": "./src/components/index.ts",
    "./composables": "./src/composables/index.ts"
  },
  "publishConfig": {
    "exports": {
      ".": "./dist/index.mjs",
      "./components": "./dist/components/index.mjs",
      "./composables": "./dist/composables/index.mjs"
    }
  }
}
```

This map only grows when you add a new _category_ (rare), not when you add a new component (frequent).

**How `publishConfig` works:** In the monorepo, `exports` points to source — all tools (Vite, TypeScript, Vitest, Storybook) resolve source files directly with no special configuration. When you run `pnpm publish`, pnpm automatically replaces `exports` with `publishConfig.exports`, so the published package points to built `dist/` output. External consumers installing from the npm registry get the built files.

This avoids the `"development"` condition pattern where tools like TypeScript may silently fall back to `dist/` and break if the library isn't built.

#### Consumer usage

```vue
<script setup lang="ts">
// Import from a specific category (preferred — scoped resolution)
import { UButton, UDialog } from '@unicorn/ui/components'
import { useTheme } from '@unicorn/ui/composables'

// Or import from the top-level barrel (convenient but resolves everything)
import { UButton, useTheme } from '@unicorn/ui'
</script>

<template>
  <UButton variant="primary">Click me</UButton>
</template>
```

Both work. The category import (`@unicorn/ui/components`) is preferred because it limits the resolution scope — TypeScript and the dev server only process that category's exports, not the entire library.

### Adding a new component (workflow)

1. Create the component directory with a test file:

   ```
   packages/ui/src/components/Tooltip/
   ├── UTooltip.vue
   ├── UTooltip.test.ts
   └── index.ts
   ```

2. Export from the component's `index.ts`:

   ```ts
   export { default as UTooltip } from './UTooltip.vue'
   export type { TooltipProps } from './UTooltip.vue'
   ```

3. Add one line to the category barrel (`src/components/index.ts`):

   ```ts
   export * from './Tooltip'
   ```

4. Create a story file in `apps/storybook/stories/Tooltip.stories.ts`.

The component is now importable via `import { UTooltip } from '@unicorn/ui/components'`, browsable in Storybook, and tested by Vitest. No changes to `package.json` or build config required.

### Dev performance escape hatch

If the dev server feels slow with 30+ components going through the barrel, add the specific subpath imports you use to Vite's `optimizeDeps.include` in the consuming app's `vite.config.ts`:

```ts
export default defineConfig({
  optimizeDeps: {
    include: ['@unicorn/ui/components', '@unicorn/ui/composables'],
  },
})
```

Each entry must match the actual import path used in your code (e.g., `@unicorn/ui/components`, not `@unicorn/ui`). This tells Vite to pre-bundle each category barrel into a single module at dev server startup, eliminating the per-module waterfall. It's a config change, not an architecture change.

---

## Appendix B: pnpm Catalog

### The problem

In a monorepo, multiple packages depend on the same libraries (e.g., `vue`, `typescript`, `eslint`). Without centralized version management, each `package.json` declares its own version string. Over time, versions drift — one package uses `vue@3.5.0`, another uses `vue@3.5.12` — leading to subtle bugs and bloated `node_modules`.

### How the catalog works

pnpm's catalog feature lets you declare dependency versions once in `pnpm-workspace.yaml`. Individual `package.json` files reference `catalog:` instead of a version string.

**`pnpm-workspace.yaml`:**

```yaml
packages:
  - apps/*
  - packages/*

catalog:
  vue: ^3.5.0
  vue-router: ^4.5.0
  typescript: ^5.8.0
  eslint: ^9.0.0
  prettier: ^3.0.0
  vite: ^6.0.0
  vitest: ^3.0.0
  storybook: ^10.1.0
  '@storybook/vue3-vite': ^10.1.0
  '@vue/test-utils': ^2.4.0
  happy-dom: ^18.0.0
  simple-git-hooks: ^2.11.0
  knip: ^5.0.0
  vue-tsc: ^2.2.0
  turbo: ^2.0.0
```

**Individual `package.json` (e.g., `packages/ui/package.json`):**

```json
{
  "peerDependencies": {
    "vue": "catalog:"
  },
  "devDependencies": {
    "vitest": "catalog:",
    "@vue/test-utils": "catalog:",
    "happy-dom": "catalog:"
  }
}
```

### What `catalog:` does

When pnpm resolves dependencies, it replaces `catalog:` with the version from the catalog in `pnpm-workspace.yaml`. The result:

- **One place to update versions** — bump `vue` in the catalog and every package gets the new version on the next `pnpm install`.
- **No version drift** — impossible for two packages to accidentally use different versions of the same dependency.
- **Cleaner diffs** — version bumps are a one-line change in `pnpm-workspace.yaml` instead of scattered across many `package.json` files.

### Adding a new dependency

1. Add the version to the catalog in `pnpm-workspace.yaml`:

   ```yaml
   catalog:
     pinia: ^3.0.0
   ```

2. Reference it in the package that needs it:

   ```json
   "dependencies": {
     "pinia": "catalog:"
   }
   ```

3. Run `pnpm install`.
