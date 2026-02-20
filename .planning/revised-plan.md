# Unicorn Monorepo Scaffolding Plan (Revised v2)

## Context

Setting up a greenfield Vue 3 monorepo on a blank GitLab repository. The goal is a well-structured, industry-standard monorepo that new hires can onboard to quickly. Developer experience and performance needs to be a priority. Do not over engineer and clearly document how things work. The workspace includes a custom component library, its documentation site (Storybook), one or more Vue frontend apps, and shared tooling configs. The custom component library will start small but quickly reach 30 components or more. The component library will be published to an internal npm registry (via `pnpm publish`) and consumed by Vite-based apps both inside and outside this monorepo (no Webpack, no SSR, no non-Vite consumers). pnpm is the only package manager used across all projects.

**Environment**: Node 24.10, pnpm 10.26, Windows, GitLab-hosted.

---

## Tech Stack

| Category               | Tool                          | Version     |
| ---------------------- | ----------------------------- | ----------- |
| Runtime                | Node.js                       | 24.10       |
| Package manager        | pnpm                          | 10.26       |
| Monorepo orchestration | Turborepo                     | latest      |
| Framework              | Vue                           | 3.6 (beta)  |
| Build tool             | Vite                          | 8.x (beta)  |
| Language               | TypeScript                    | ~5.9        |
| TS config base         | @vue/tsconfig                 | 0.8.x       |
| TS config (node)       | @tsconfig/node24              | latest      |
| Routing                | Vue Router                    | 5.x         |
| Linter (fast)          | OxLint                        | ~1.42       |
| Linter (rules)         | ESLint (flat config)          | 9.x         |
| ESLint Vue+TS          | @vue/eslint-config-typescript | 14.x        |
| Formatter              | Oxfmt                         | 0.x (alpha) |
| Component docs         | Storybook                     | 10.x        |
| Storybook framework    | @storybook/vue3-vite          | 10.x        |
| Testing                | Vitest                        | latest      |
| Component testing      | @vue/test-utils               | latest      |
| Test DOM               | jsdom                         | ^27         |
| Dev tools              | vite-plugin-vue-devtools      | latest      |
| Git hooks              | simple-git-hooks              | latest      |
| Staged file linting    | lint-staged                   | latest      |
| Unused code detection  | knip                          | latest      |
| CI/CD                  | GitLab CI                     | —           |

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
│   │   │   └── views/HomeView.vue
│   │   ├── env.d.ts
│   │   ├── index.html
│   │   ├── package.json            # @unicorn/web
│   │   ├── tsconfig.json           # references only
│   │   ├── tsconfig.app.json
│   │   ├── tsconfig.node.json
│   │   ├── vite.config.ts
│   │   └── eslint.config.ts
│   └── storybook/                  # Storybook for component development & docs
│       ├── .storybook/
│       │   ├── main.ts             # Storybook config (framework, stories glob)
│       │   └── preview.ts          # Global decorators and parameters
│       ├── stories/                # Story files (one per component)
│       │   └── Button.stories.ts
│       ├── package.json            # @unicorn/storybook
│       ├── tsconfig.json           # references only
│       ├── tsconfig.app.json
│       ├── tsconfig.node.json
│       └── eslint.config.ts
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
│       ├── tsconfig.json           # references only
│       ├── tsconfig.lib.json
│       ├── tsconfig.node.json
│       ├── tsconfig.vitest.json
│       ├── vite.config.ts          # lib mode build (multi-entry)
│       └── eslint.config.ts
├── .vscode/
│   ├── extensions.json             # Recommended extensions (Volar, ESLint, OXC)
│   └── settings.json               # File nesting, format-on-save, auto-fix
├── .editorconfig
├── .gitattributes
├── .gitignore
├── .gitlab-ci.yml
├── .npmrc
├── .oxfmtrc.json                   # Oxfmt formatter config
├── .oxlintrc.json                  # OxLint linter config (plugins, categories)
├── eslint.config.ts                # Root shared ESLint flat config (TypeScript)
├── knip.json                       # Unused code/dependency detection config
├── tsconfig.json                   # Root with project references + files: []
├── tsconfig.app.json               # For Vue apps (extends @vue/tsconfig)
├── tsconfig.lib.json               # For libraries (extends @vue/tsconfig)
├── tsconfig.node.json              # For config files (extends @tsconfig/node24)
├── turbo.json
├── pnpm-workspace.yaml             # Workspaces + catalog + useNodeVersion
├── package.json                    # Root workspace config (packageManager field)
├── README.md
└── CLAUDE.md
```

### Changes from original plan

- **Removed `packages/eslint-config/`, `packages/prettier-config/`, `packages/tsconfig/`**. Config files live at the repo root. No consumers outside this repo exist yet; extracting into packages is trivial to do later if needed. This cuts ~12 files and removes a layer of indirection for onboarding.
- **Replaced `apps/docs/` (VitePress) with `apps/storybook/`**. With 50+ components expected, Storybook provides more value than a markdown docs site: interactive prop controls, isolated component development, auto-generated API docs from TypeScript types, and a visual regression testing foundation. VitePress can be added later for prose documentation (guides, design principles).
- **Added Vitest** to `packages/ui/`. With 50+ components expected, testing should be part of the workflow from day one — not retrofitted later.
- **Added `.gitattributes`**. Required for consistent line endings on a Windows team.
- **Added `useNodeVersion` in `pnpm-workspace.yaml`** + `engines` field in root `package.json`. pnpm manages the Node version directly — no need for nvm/fnm.
- **Added `.gitlab-ci.yml`**. The verification steps should run in CI from day one, not just locally.
- **Added pnpm catalog** in `pnpm-workspace.yaml`. All dependency versions declared once centrally — prevents version drift as packages multiply.
- **Added `packageManager` field** in root `package.json`. Pins the exact pnpm version via Corepack.
- **Added simple-git-hooks + lint-staged**. Pre-commit hook lints and formats staged files only. Full type-check and test suite run in CI.
- **Added knip**. Detects unused files, dependencies, and exports — essential as the component count grows.
- **Added `.vscode/extensions.json`**. Prompts new hires to install Volar and ESLint extensions on first open.
- **Added TypeScript project references**. Root `tsconfig.json` references each package/app for incremental type-checking.

### Changes from v1 revision

- **Moved `useNodeVersion` from `.npmrc` to `pnpm-workspace.yaml`**. In pnpm 10, `useNodeVersion` is only valid in `pnpm-workspace.yaml` — placing it in `.npmrc` is silently ignored.
- **Rewrote TypeScript config section**. Replaced hand-rolled `tsconfig.base.json` with `@vue/tsconfig` — maintained by the Vue team and kept in sync with Vue/Volar/vue-tsc releases. This provides all necessary compiler options (`strict`, `noEmit`, `skipLibCheck`, `verbatimModuleSyntax`, `moduleDetection`, `forceConsistentCasingInFileNames`, etc.) without manual tracking. Changed target from `ES2024` to `ESNext` (Vue ecosystem convention). Moved `composite: true` from shared base to per-project configs. Added `tsBuildInfoFile` per project. Removed `outDir` from shared `tsconfig.lib.json` (each package sets its own).
- **Added `"types"` conditions to `publishConfig.exports`**. Without explicit `"types"` conditions, external TypeScript consumers can't reliably resolve `.d.ts` files from subpath exports.
- **Added explicit Vite lib mode config** for `packages/ui/`. The multi-entry build with nested output paths requires specific entry key naming — this was previously unspecified and is a common source of bugs.
- **Switched test DOM from happy-dom to jsdom**. happy-dom has known issues with event bubbling and form interactions that affect Vue component testing. jsdom has broader API coverage and is more battle-tested. Switching back to happy-dom is a one-line config change if jsdom proves too slow.
- **Updated `vue-tsc` catalog version** from `^2.2.0` to `^3.2.0` (current major version).
- **Fixed `turbo.json` terminology** — uses `tasks` key (current format), not `pipeline` (deprecated v1 format).
- **Fixed CI cache key** to use lockfile hash instead of branch slug for proper cache invalidation.
- **Added Corepack Windows caveats** and future Node 25 note.
- **Added knip Vue compiler note** for accurate `.vue` file analysis.
- **Added `vue-component-meta` docgen verification note** — config shape should be verified during implementation.
- **Added `files` and `prepublishOnly`** to UI library `package.json` for publish readiness.
- **Revised dev performance escape hatch** — `optimizeDeps.include` may not pre-bundle linked workspace deps; documented the actual workaround.
- **Replaced Prettier with Oxfmt**. Oxfmt is a Rust-based formatter from the Oxc project (same ecosystem as Rolldown/Vite 8). ~30x faster than Prettier, Prettier-compatible output for JS/TS, built-in import sorting and package.json sorting. Uses Oxfmt defaults (double quotes, 100 char print width, 2-space indent, semicolons, trailing commas). Vue SFC support is functional but "js-in-xxx" support is still being refined — this is a known alpha limitation. Config via `.oxfmtrc.json`; `eslint-config-prettier` still works.
- **Upgraded Vue to 3.6 beta**. Adds Vapor Mode (opt-in per component via `<script setup vapor>`, bypasses VDOM for better performance). Standard VDOM code is fully backwards-compatible with 3.5. Requires `@vitejs/plugin-vue@^6.0.0` for Vapor HMR support. `vue-router` updated to `^5.0.0`. Vue pre-release version requires `pnpm.overrides` for peer dep compatibility.
- **Upgraded Vite to 8 beta** (Rolldown). `build.rollupOptions` → `build.rolldownOptions`. Storybook peer dep override required.

### Changes from v2 revision (aligned with vue-exp reference project)

- **Added OxLint** alongside ESLint. OxLint is a Rust-based linter (~100x faster than ESLint) that handles `correctness` rules. ESLint handles Vue-specific and TypeScript rules that OxLint doesn't cover. `eslint-plugin-oxlint` disables ESLint rules already covered by OxLint to avoid duplicate diagnostics. Linting runs sequentially: `oxlint` first, then `eslint`.
- **Switched ESLint config to `@vue/eslint-config-typescript`**. Replaces raw `typescript-eslint` + `eslint-plugin-vue` setup. Uses `defineConfigWithVueTs()` and `vueTsConfigs.recommended` — maintained by the Vue team, handles parser configuration automatically.
- **Changed `eslint.config.js` → `eslint.config.ts`**. TypeScript ESLint config with `jiti` as the loader. Provides type safety and autocompletion in the config file.
- **Added `tsconfig.node.json`** (extends `@tsconfig/node24`). Covers config files (`vite.config.ts`, `vitest.config.ts`, `eslint.config.ts`) that run in Node, not the browser. Each project that has config files gets its own `tsconfig.node.json`.
- **Added `tsconfig.vitest.json`** for test files. Extends `tsconfig.app.json`, adds `jsdom` types, excludes non-test source. Ensures test files get proper type coverage without polluting the app tsconfig.
- **Added `.vscode/settings.json`**. File nesting patterns (cleaner explorer), format-on-save via OXC extension, auto-fix on save. Matches the reference project's IDE setup.
- **Changed `vite-env.d.ts` → `env.d.ts`** at each app's root (not inside `src/`). Follows `create-vue` convention. Contains `/// <reference types="vite/client" />`.
- **Moved `pnpm.overrides` from `package.json` to `pnpm-workspace.yaml`**. pnpm 10 supports `overrides` directly in `pnpm-workspace.yaml` — no need for the `"pnpm"` key in `package.json`.
- **Override all Vue sub-packages individually**. The reference project overrides `@vue/compiler-core`, `@vue/compiler-dom`, `@vue/compiler-sfc`, `@vue/runtime-core`, `@vue/runtime-dom`, `@vue/shared`, etc. to `beta`. This ensures all transitive Vue dependencies resolve to the same pre-release version. Added `peerDependencyRules.allowAny: [vue]` to suppress peer dep warnings.
- **Added `onlyBuiltDependencies`** to `pnpm-workspace.yaml`. Whitelists packages that run install scripts (e.g., `esbuild`). pnpm 10 blocks install scripts by default for security.
- **Added `type: "module"`** to root `package.json`. Aligns with the reference project and modern Node conventions.
- **Added `vite-plugin-vue-devtools`** to the web app's Vite config. Provides in-browser component inspector and state debugging.
- **Updated Oxfmt config** to `semi: false`, `singleQuote: true` (matching the reference project) instead of empty defaults. Added `$schema` for IDE autocompletion.
- **Updated TypeScript** to `~5.9` (tilde pin to minor version, matching reference).
- **Split lint scripts** into `lint` (check-only, for CI) and `lint:fix` (auto-fix, for local dev and pre-commit).
- **Updated `.gitignore`** to include `*.tsbuildinfo` and `.eslintcache`.
- **Added `--cache` flag** to ESLint for faster repeat runs.

---

## Steps

### 1. Root workspace files

Create root-level configuration files:

- **`package.json`** — Private workspace root. Includes:
  - `"type": "module"` — ESM by default.
  - Scripts:
    ```json
    "scripts": {
      "dev": "turbo dev",
      "build": "turbo build",
      "lint": "oxlint . && eslint . --cache",
      "lint:fix": "oxlint . --fix && eslint . --fix --cache",
      "test": "turbo test",
      "type-check": "vue-tsc --build",
      "format": "oxfmt .",
      "format:check": "oxfmt --check .",
      "repo:check": "knip",
      "prepare": "simple-git-hooks"
    }
    ```
    `dev`, `build`, and `test` delegate to Turborepo. `lint` runs OxLint then ESLint in check-only mode (fails on errors — used in CI). `lint:fix` runs both with `--fix` (used locally and in pre-commit hook). `type-check` runs `vue-tsc --build` directly (project references handle the dependency graph; `--noEmit` is redundant since `@vue/tsconfig` sets `noEmit: true`). `format` runs Oxfmt (writes), `format:check` runs Oxfmt in check mode (CI). `repo:check` runs knip directly.
  - `"packageManager": "pnpm@10.26.2"` — Pins the exact pnpm version. When a contributor runs `corepack enable && pnpm install`, Corepack automatically installs this version. No manual pnpm install step. **Corepack caveat**: Corepack has known issues on Windows with `.msi` Node installations — contributors may need to remove existing Corepack shims via Windows app settings. Additionally, Corepack will not ship with Node 25+ — document this as a future migration step. For now (Node 24), Corepack works.
  - `"engines": { "node": ">=24.10.0" }` — Guardrail for anything that bypasses pnpm.
  - `"simple-git-hooks": { "pre-commit": "pnpm lint-staged" }` — Runs fast, file-scoped checks on staged files only. Full type-check and test suite run in CI. See step 5 for details.
  - `"lint-staged": { "*.{ts,vue}": ["oxlint --fix", "eslint --fix --cache"], "*": ["oxfmt --no-error-on-unmatched-pattern"] }` — OxLint and ESLint run with `--fix` on staged TS/Vue files (pre-commit should fix, not just report). Oxfmt runs on all staged files (skips unsupported types via `--no-error-on-unmatched-pattern`). Oxfmt defaults to `--write` mode.
  - `"prepare": "simple-git-hooks"` — Installs the git hooks after `pnpm install`.
- **`pnpm-workspace.yaml`** — Declares `apps/*` and `packages/*`. Full structure:

  ```yaml
  useNodeVersion: '24.10.0'

  packages:
    - apps/*
    - packages/*

  onlyBuiltDependencies:
    - esbuild

  overrides:
    '@vue/compiler-core': beta
    '@vue/compiler-dom': beta
    '@vue/compiler-sfc': beta
    '@vue/compiler-ssr': beta
    '@vue/compiler-vapor': beta
    '@vue/reactivity': beta
    '@vue/runtime-core': beta
    '@vue/runtime-dom': beta
    '@vue/runtime-vapor': beta
    '@vue/server-renderer': beta
    '@vue/shared': beta
    vue: beta

  peerDependencyRules:
    allowAny:
      - vue
      - vite

  catalog:
    # ... (see Appendix B)
  ```

  Key fields:
  - **`useNodeVersion`** — pnpm manages the Node version automatically (this setting is only valid in `pnpm-workspace.yaml`, not in `.npmrc`).
  - **`onlyBuiltDependencies`** — pnpm 10 blocks install scripts by default for security. Whitelist packages that need them (e.g., `esbuild` for its native binary).
  - **`overrides`** — Forces all Vue sub-packages to `beta` channel. This ensures transitive dependencies (e.g., `@vue/compiler-sfc` used by `@vitejs/plugin-vue`) resolve to the same pre-release version. When Vue 3.6 goes stable, remove all overrides. **Note**: Vite 8 does not need an override here — Storybook's peer dep on `vite` is handled by `peerDependencyRules`, and the catalog version is what gets installed.
  - **`peerDependencyRules.allowAny: [vue, vite]`** — Suppresses peer dep warnings. Vue: packages declaring `vue: ^3.5.0` won't match `3.6.0-beta.x` due to strict semver pre-release matching. Vite: Storybook 10 declares `vite: "^5 || ^6 || ^7"` which doesn't match Vite 8.
  - **`catalog`** — Centralizes all dependency versions. See [Appendix B](#appendix-b-pnpm-catalog) for details.

- **`turbo.json`** — Task definitions using the `tasks` key (not `pipeline`, which is the deprecated v1 format):
  ```json
  {
    "$schema": "https://turbo.build/schema.json",
    "tasks": {
      "build": {
        "dependsOn": ["^build"],
        "outputs": ["dist/**"]
      },
      "dev": {
        "cache": false,
        "persistent": true
      },
      "test": {}
    }
  }
  ```
  `build` depends on `^build` (upstream packages first). `dev` is persistent/no-cache. `test` is independent and cacheable. `type-check`, `lint`, and `format` are NOT in turbo.json — `type-check` runs via `vue-tsc --build` (project references handle dependencies), `lint` runs OxLint + ESLint from the root across all files, and `format` runs Oxfmt from the root (it scans the whole tree). These root-level tools already handle the entire monorepo in one pass — no per-package orchestration needed.
- **`.npmrc`** — Contains `store-dir=.pnpm-store` so the pnpm store is local to the project (required for CI caching — pnpm's default store is global and won't be captured by CI cache paths). Does NOT contain `use-node-version` (that's in `pnpm-workspace.yaml`). Does NOT contain overrides (those are also in `pnpm-workspace.yaml` in pnpm 10). Do NOT set `strict-peer-dependencies=false` — peer dependency conflicts should be fixed via targeted rules, not globally suppressed.
- **`.editorconfig`** — 2-space indent, UTF-8, LF line endings, final newline, trim trailing whitespace.
- **`.gitignore`** — Node modules, `dist/`, Vite cache, editor files, OS files, `.turbo/`, `*.tsbuildinfo`, `.eslintcache`.
- **`.gitattributes`** — `* text=auto eol=lf`. Prevents line-ending inconsistencies across the team, which would cause formatter `--check` failures and noisy diffs on Windows. The `text=auto` heuristic correctly handles binary files, but add explicit binary markers for safety:
  ```
  * text=auto eol=lf
  *.png binary
  *.jpg binary
  *.ico binary
  *.woff binary
  *.woff2 binary
  ```
- **`.vscode/extensions.json`** — Recommends `Vue.volar`, `vitest.explorer`, `dbaeumer.vscode-eslint`, `EditorConfig.EditorConfig`, and `oxc.oxc-vscode`. VS Code prompts contributors to install these on first open.
- **`.vscode/settings.json`** — Project-level VS Code settings:
  ```json
  {
    "explorer.fileNesting.enabled": true,
    "explorer.fileNesting.patterns": {
      "tsconfig.json": "tsconfig.*.json, env.d.ts",
      "vite.config.*": "vitest.config.*",
      "package.json": "pnpm*, .eslint*, eslint*, .oxlint*, .oxfmt*, .editorconfig"
    },
    "editor.codeActionsOnSave": {
      "source.fixAll": "explicit"
    },
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "oxc.oxc-vscode"
  }
  ```
  File nesting keeps the explorer clean by collapsing related config files under their parent. Format-on-save uses the OXC extension (Oxfmt). Auto-fix on save runs ESLint fixes.
- **`.oxlintrc.json`** — OxLint configuration:
  ```json
  {
    "$schema": "./node_modules/oxlint/configuration_schema.json",
    "plugins": ["eslint", "typescript", "unicorn", "oxc", "vue"],
    "env": {
      "browser": true
    },
    "categories": {
      "correctness": "error"
    }
  }
  ```
  Enables Vue, TypeScript, and Unicorn plugins. Only the `correctness` category is active — these are rules with zero false positives. `eslint-plugin-oxlint` (in the ESLint config) automatically disables the corresponding ESLint rules so there's no duplication.
- **`knip.json`** — Configuration for knip (unused code detection). Points entry files to each package/app's source. Ignores generated files and test utilities. **Note**: knip's built-in Vue support uses regex-based extraction which may produce false positives for `.vue` component exports. If knip reports Vue component exports as unused, configure a custom compiler using `@vue/compiler-sfc` in `knip.json` for accurate `.vue` file analysis. Start with the defaults and adjust if needed.

### 2. Shared TypeScript configs (root level)

Create tsconfig files at the repo root. These extend `@vue/tsconfig` — the official TypeScript config package maintained by the Vue team, kept in sync with Vue/Volar/vue-tsc releases. This eliminates the need for a hand-rolled `tsconfig.base.json` and ensures the project stays aligned with the Vue ecosystem's compiler options (`strict`, `noEmit`, `ESNext` target, `verbatimModuleSyntax`, `moduleDetection: "force"`, `skipLibCheck`, `forceConsistentCasingInFileNames`, `noUncheckedIndexedAccess`, etc.) without manual tracking.

- **`tsconfig.json`** — Root project references file. Does not contain compiler options — only `files: []` (prevents accidental inclusion of root-level files) and `references` pointing to each package and app:

  ```json
  {
    "files": [],
    "references": [
      { "path": "./packages/ui" },
      { "path": "./apps/web" },
      { "path": "./apps/storybook" },
      { "path": "./tsconfig.node.json" }
    ]
  }
  ```

  This enables incremental type-checking: `vue-tsc --build` only rechecks packages that changed. Becomes increasingly valuable as the monorepo grows.

- **No `tsconfig.base.json`** — `@vue/tsconfig` replaces it. The package provides:
  - `@vue/tsconfig/tsconfig.json` — Base config with all recommended Vue compiler options (ESNext target, bundler module resolution, strict mode, noEmit, verbatimModuleSyntax, etc.).
  - `@vue/tsconfig/tsconfig.dom.json` — Extends base, adds DOM lib.
  - `@vue/tsconfig/tsconfig.lib.json` — Extends base, overrides `noEmit: false`, adds `declaration: true`, `emitDeclarationOnly: true`.

  Key options provided by `@vue/tsconfig` (no need to set manually):
  - **`target: "ESNext"`** — With `noEmit: true`, the target doesn't affect emitted code — Vite/esbuild handles all transforms.
  - **`verbatimModuleSyntax`** — Enforces `import type` for type-only imports, preventing runtime elision surprises in Vue SFCs.
  - **`moduleDetection: "force"`** — All `.ts` files treated as modules.
  - **`allowImportingTsExtensions`** — Allows `.ts`/`.vue` imports when `noEmit` or `emitDeclarationOnly` is set.
  - **`skipLibCheck`** — Skips `.d.ts` checking in `node_modules` for performance.
  - **`forceConsistentCasingInFileNames`** — Critical on Windows (case-insensitive FS + case-sensitive Git).
  - **`noUncheckedIndexedAccess`** — Indexed access returns `T | undefined`.

- **`tsconfig.app.json`** — Extends `@vue/tsconfig/tsconfig.dom.json`. Consumed by apps via `"extends": "../../tsconfig.app.json"`:

  ```json
  {
    "extends": "@vue/tsconfig/tsconfig.dom.json"
  }
  ```

- **`tsconfig.lib.json`** — Extends `@vue/tsconfig/tsconfig.lib.json`. Adds `declarationMap` for source navigation. Does NOT set `outDir` — each library sets its own. Consumed by packages via `"extends": "../../tsconfig.lib.json"`:

  ```json
  {
    "extends": "@vue/tsconfig/tsconfig.lib.json",
    "compilerOptions": {
      "declarationMap": true
    }
  }
  ```

  `@vue/tsconfig/tsconfig.lib.json` already sets `noEmit: false`, `declaration: true`, `emitDeclarationOnly: true`. We add `declarationMap` so "Go to Definition" in IDEs navigates to the original `.vue` source instead of `.d.ts` files.

- **`tsconfig.node.json`** — Extends `@tsconfig/node24`. Covers config files that run in Node (not the browser): `vite.config.ts`, `vitest.config.ts`, `eslint.config.ts`. Each project that has config files gets its own `tsconfig.node.json`. The root-level `tsconfig.node.json`:

  ```json
  {
    "extends": "@tsconfig/node24/tsconfig.json",
    "include": ["vite.config.*", "vitest.config.*", "eslint.config.*"],
    "compilerOptions": {
      "composite": true,
      "noEmit": true,
      "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
      "module": "ESNext",
      "moduleResolution": "Bundler",
      "types": ["node"]
    }
  }
  ```

  Per-project `tsconfig.node.json` files follow the same pattern, adjusting `include` to cover only that project's config files. This is referenced from each project's `tsconfig.json` as an additional project reference.

- **Each project's own `tsconfig.json`** is a references-only file (matching the `create-vue` pattern). It contains `"files": []` and `"references"` pointing to the project's sub-configs. The sub-configs (`tsconfig.app.json`, `tsconfig.lib.json`, `tsconfig.node.json`, `tsconfig.vitest.json`) are where the actual compiler options live. Each sub-config must set:
  - `"composite": true` — Required for TypeScript project references. Since TypeScript 5.2, `composite` works with `noEmit: true` (for type-check-only projects) and with `emitDeclarationOnly: true` (for libraries).
  - `"tsBuildInfoFile"` — Path for incremental build info. Use `"./node_modules/.tmp/tsconfig.<name>.tsbuildinfo"` (following the create-vue convention) to keep build artifacts out of the source tree. Each sub-config needs a unique filename.
  - `"include"` — Source files for this config.
  - For libraries: `"rootDir"` and `"outDir"` for declaration output.

  Example — `packages/ui/tsconfig.json`:

  ```json
  {
    "files": [],
    "references": [
      { "path": "./tsconfig.lib.json" },
      { "path": "./tsconfig.node.json" },
      { "path": "./tsconfig.vitest.json" }
    ]
  }
  ```

  Example — `packages/ui/tsconfig.lib.json` (the main source config):

  ```json
  {
    "extends": "../../tsconfig.lib.json",
    "compilerOptions": {
      "composite": true,
      "rootDir": "./src",
      "outDir": "./dist",
      "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.lib.tsbuildinfo"
    },
    "include": ["src/**/*", "src/**/*.vue"],
    "exclude": ["src/**/__tests__/*"]
  }
  ```

  Example — `packages/ui/tsconfig.node.json`:

  ```json
  {
    "extends": "@tsconfig/node24/tsconfig.json",
    "include": ["vite.config.*", "vitest.config.*", "eslint.config.*"],
    "compilerOptions": {
      "composite": true,
      "noEmit": true,
      "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
      "module": "ESNext",
      "moduleResolution": "Bundler",
      "types": ["node"]
    }
  }
  ```

  Example — `packages/ui/tsconfig.vitest.json`:

  ```json
  {
    "extends": "./tsconfig.lib.json",
    "include": ["src/**/__tests__/*"],
    "exclude": [],
    "compilerOptions": {
      "composite": true,
      "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.vitest.tsbuildinfo",
      "lib": [],
      "types": ["node", "jsdom"]
    }
  }
  ```

  The vitest tsconfig extends the project's main config but overrides `include` to cover test files and adds `jsdom` types. Note: no `env.d.ts` needed here — the UI package is a library, not a Vite app.

  Example — `apps/web/tsconfig.json`:

  ```json
  {
    "files": [],
    "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]
  }
  ```

  Example — `apps/web/tsconfig.app.json`:

  ```json
  {
    "extends": "../../tsconfig.app.json",
    "compilerOptions": {
      "composite": true,
      "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
      "paths": {
        "@/*": ["./src/*"]
      }
    },
    "include": ["env.d.ts", "src/**/*", "src/**/*.vue"]
  }
  ```

  **Constraint**: All packages and apps must be exactly one directory deep under `apps/` or `packages/` for the `../../tsconfig.*.json` relative path to work. Document this in CLAUDE.md.

### 3. Shared ESLint config (root level)

Create a single `eslint.config.ts` at the repo root using ESLint 9 flat config in TypeScript (requires `jiti` as a devDependency for the TS config loader):

```ts
import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  globalIgnores(['**/dist/**', '**/coverage/**', '**/.turbo/**']),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  {
    ...pluginVitest.configs.recommended,
    files: ['**/__tests__/*'],
  },

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  skipFormatting,
)
```

Key aspects:

- **`@vue/eslint-config-typescript`** — Maintained by the Vue team. `defineConfigWithVueTs()` handles TypeScript parser configuration for `.vue` files automatically. `vueTsConfigs.recommended` provides the recommended TypeScript rules.
- **`eslint-plugin-vue` `flat/essential`** — Vue-specific rules. Use `essential` (not `recommended`) to avoid overly opinionated rules; tighten later if desired.
- **`@vitest/eslint-plugin`** — Vitest-specific rules, scoped to test files only.
- **`eslint-plugin-oxlint`** — `buildFromOxlintConfigFile()` reads `.oxlintrc.json` and disables the ESLint rules already covered by OxLint. This must be near the end of the config array so it can override earlier rule definitions.
- **`eslint-config-prettier/flat`** — Disables formatting rules that conflict with Oxfmt. Must be last.

Each package/app has its own thin `eslint.config.ts` that imports and re-exports the root config (required by ESLint's flat config resolution). These are one-liners.

Root `package.json` devDependencies: `eslint`, `@vue/eslint-config-typescript`, `eslint-plugin-vue`, `@vitest/eslint-plugin`, `eslint-plugin-oxlint`, `eslint-config-prettier`, `oxlint`, `jiti`.

### 4. Formatter config (root level)

Create `.oxfmtrc.json` at the repo root:

```json
{
  "$schema": "./node_modules/oxfmt/configuration_schema.json",
  "semi": false,
  "singleQuote": true
}
```

- **`$schema`** — Enables autocompletion and validation in IDEs.
- **`semi: false`** — No semicolons (matches the reference project style).
- **`singleQuote: true`** — Single quotes (matches the reference project style).
- Other Oxfmt defaults remain: 2-space indent, trailing commas (`all`), 100 char print width. Oxfmt also reads `.editorconfig` for indent/line-ending settings.

Key Oxfmt behaviors enabled by default:

- **`experimentalSortPackageJson`** — Automatically sorts keys in `package.json` files (deps, scripts, etc.). No plugin needed.
- **`experimentalSortImports`** — Disabled by default. Enable in `.oxfmtrc.json` if desired.

**Vue SFC caveat**: Oxfmt's "js-in-xxx" support (JavaScript/TypeScript inside Vue `<script>` blocks) is still being refined and is one of the last alpha-to-beta blockers. If formatting produces unexpected results in `.vue` files, check [oxc-project/oxc#16608](https://github.com/oxc-project/oxc/issues/16608) for updates. Falling back to Prettier for `.vue` files via an `.oxfmtrc.json` override is possible if needed.

**Migration**: If migrating from an existing Prettier setup, run `oxfmt --migrate=prettier` to convert config automatically.

### 5. Repo health tooling

Set up tooling that keeps the codebase clean as it grows:

- **simple-git-hooks + lint-staged** — Configured in root `package.json`. The `prepare` script runs `simple-git-hooks` after `pnpm install` to install the pre-commit hook. The pre-commit hook runs `pnpm lint-staged`, which lints and formats only staged files. This keeps commits fast (seconds, not minutes). Full type-check and test suite run in CI, not on every commit — with 30+ components, running the full suite pre-commit would significantly slow iteration. Lighter than husky (single dependency, no `.husky/` directory).
- **knip** — Configured via `knip.json` at the root. Detects unused files, unused dependencies in `package.json`, and unused exports. Run via `pnpm repo:check` (which runs `knip`). Especially valuable with 30+ components — catches dead exports when components are refactored or removed. **Note**: knip's default Vue support uses regex-based extraction. If it produces false positives for Vue component exports, add a custom compiler entry in `knip.json` using `@vue/compiler-sfc`. Start with defaults and adjust only if needed. Add knip to CI once the initial scaffolding is stable.

### 6. Component library (`packages/ui/`)

Create `@unicorn/ui`:

- **Vite lib mode** build config outputting ESM with multiple entry points (one per category). The `vite.config.ts` must use the object-form entry with slashes in the keys to produce nested output paths matching the `publishConfig.exports`. Vite 8 uses Rolldown (replacing Rollup), so build options use `rolldownOptions` instead of `rollupOptions`:

  ```ts
  import { resolve } from 'node:path'
  import { defineConfig } from 'vite'
  import vue from '@vitejs/plugin-vue'

  export default defineConfig({
    plugins: [vue()],
    build: {
      lib: {
        entry: {
          index: resolve(__dirname, 'src/index.ts'),
          'components/index': resolve(__dirname, 'src/components/index.ts'),
          'composables/index': resolve(__dirname, 'src/composables/index.ts'),
        },
        formats: ['es'],
      },
      rolldownOptions: {
        external: ['vue'],
        output: {
          entryFileNames: '[name].mjs',
        },
      },
    },
  })
  ```

  This produces `dist/index.mjs`, `dist/components/index.mjs`, and `dist/composables/index.mjs`. The entry key naming with slashes (`'components/index'`) is what creates the nested directory structure — this is non-obvious and must match the paths in `publishConfig.exports`.

- **Declaration generation**: The `build` script runs two steps: `vite build` for `.mjs` output, then `vue-tsc --project tsconfig.lib.json` for `.d.ts` output. Since `tsconfig.lib.json` extends the root `tsconfig.lib.json` (which has `emitDeclarationOnly: true`), vue-tsc emits only `.d.ts` and `.d.ts.map` files to `dist/`, preserving the directory structure relative to `rootDir` (`src/`). The build script:

  ```json
  "build": "vite build && vue-tsc --project tsconfig.lib.json"
  ```

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
      ".": {
        "types": "./dist/index.d.ts",
        "import": "./dist/index.mjs"
      },
      "./components": {
        "types": "./dist/components/index.d.ts",
        "import": "./dist/components/index.mjs"
      },
      "./composables": {
        "types": "./dist/composables/index.d.ts",
        "import": "./dist/composables/index.mjs"
      }
    }
  }
  ```

  **In the monorepo**, exports point directly to TypeScript source — no build step required, no conditional resolution, all tools (Vite, TypeScript, Vitest, Storybook) resolve source without special configuration. **When published** to the internal npm registry, pnpm swaps `exports` with `publishConfig.exports`, so external consumers get the built `dist/` output with explicit `"types"` conditions for TypeScript resolution. The `"types"` condition must come first in each entry — TypeScript requires this ordering to resolve `.d.ts` files correctly.

  This avoids the `"development"` condition pattern where any tool that doesn't recognize the custom condition falls back to `"default"` (the `dist/` build), which may be stale or missing. The plan's approach (source in `exports`, built output only in `publishConfig`) is simpler and avoids this class of misconfiguration entirely.

  Consumers import from a category: `import { UButton, UInput } from '@unicorn/ui/components'`. Tree-shaking eliminates unused components in production builds.

- **Barrel files within each category.** `src/components/index.ts` re-exports all components. This follows the same pattern used by Vuetify v0, Radix Vue, and other major Vue component libraries. New components are added by creating a directory under `src/components/` and adding one re-export line to `src/components/index.ts`.

- **Vitest** configured via `vitest.config.ts` (separate file that merges with vite config, matching the `create-vue` pattern):

  ```ts
  import { fileURLToPath } from 'node:url'
  import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
  import viteConfig from './vite.config'

  export default mergeConfig(
    viteConfig,
    defineConfig({
      test: {
        environment: 'jsdom',
        exclude: [...configDefaults.exclude, 'e2e/**'],
        root: fileURLToPath(new URL('./', import.meta.url)),
      },
    }),
  )
  ```

  Uses `@vue/test-utils` for component mounting with **jsdom** as the DOM environment. jsdom has broader API coverage and fewer known issues than happy-dom for Vue component testing (event bubbling, form interactions, CSS selectors). If jsdom proves too slow with 30+ component tests, switching to happy-dom is a one-line change. Test files are co-located with components (`UButton.test.ts` next to `UButton.vue`).

- **`package.json`** — Peer dependency on `vue`. Scripts: `build` (see above), `test`, `lint`, `type-check`. devDependencies: `vitest`, `@vue/test-utils`, `jsdom`, `@types/jsdom`. Additional fields for publish readiness:
  ```json
  "files": ["dist"],
  "scripts": {
    "prepublishOnly": "pnpm build"
  }
  ```
  `"files": ["dist"]` ensures only the built output is included in the published tarball (source stays out). `"prepublishOnly"` ensures the library is built before publishing.

### 7. Web application (`apps/web/`)

Create `@unicorn/web`:

- **Vue 3 + Vite + Vue Router + TypeScript**.
- **`env.d.ts`** — At the app root (not inside `src/`). Contains `/// <reference types="vite/client" />`. Included in `tsconfig.app.json`'s `include` array.
- **`src/App.vue`** — Root component with `<RouterView>`.
- **`src/views/HomeView.vue`** — Landing page importing `UButton` from `@unicorn/ui/components`.
- **`src/router/index.ts`** — Basic router setup with history mode.
- **`vite.config.ts`** — Vue + Vite config with `vite-plugin-vue-devtools`:

  ```ts
  import { fileURLToPath, URL } from 'node:url'
  import { defineConfig } from 'vite'
  import vue from '@vitejs/plugin-vue'
  import vueDevTools from 'vite-plugin-vue-devtools'

  export default defineConfig({
    plugins: [vue(), vueDevTools()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  })
  ```

- **`package.json`** — Depends on `@unicorn/ui`, `vue`, `vue-router`. devDependencies: `vite-plugin-vue-devtools`. Scripts: `dev`, `build`, `preview`, `lint`, `type-check`.

### 8. Storybook (`apps/storybook/`)

Create `@unicorn/storybook` using Storybook 10 with the `@storybook/vue3-vite` framework:

- **`.storybook/main.ts`** — Framework set to `@storybook/vue3-vite` with `vue-component-meta` docgen configured. The docgen config requires explicit `tsconfig` pointing to the storybook app's own `tsconfig.app.json` (which has the actual compiler options), not `tsconfig.json` (which only contains project references):

  ```ts
  framework: {
    name: '@storybook/vue3-vite',
    options: {
      docgen: {
        plugin: 'vue-component-meta',
        tsconfig: './tsconfig.app.json', // resolves to apps/storybook/tsconfig.app.json
      },
    },
  },
  ```

  **Implementation note**: The docgen config object shape (`{ plugin, tsconfig }`) should be verified against the installed Storybook version during implementation. If it doesn't work, try the simpler string form `docgen: 'vue-component-meta'` first. The Storybook docs show both forms, and the API may have changed between minor versions. Also verify that `vue-component-meta` can resolve `@unicorn/ui` component types through the storybook app's tsconfig — if it can't, the tsconfig may need explicit `paths` entries pointing to the UI package source.

  Stories glob: `../stories/**/*.stories.ts`. No addons required — Storybook 10 includes Controls, Actions, and Docs out of the box.

- **`.storybook/preview.ts`** — Global parameters (e.g., controls matchers for color/date props). Add global decorators here later if needed (e.g., theme provider wrapper).
- **`stories/`** — Story files live here, one per component (e.g., `Button.stories.ts`). This follows the Vuetify v0 convention of keeping stories in the storybook app rather than co-located with components. Stories import components from `@unicorn/ui/components`.
- **`package.json`** — Depends on `@unicorn/ui`. devDependencies: `storybook`, `@storybook/vue3-vite`. Scripts: `dev` (runs `storybook dev -p 6006`), `build` (runs `storybook build`).
- **Story format**: CSF3 with Vue 3 composition API. Types (`Meta`, `StoryObj`) import from `@storybook/vue3-vite`. Autodocs enabled via `tags: ['autodocs']` on each story meta.
- **Vite 8 caveat**: Storybook's `storybook build` (production build) fails when story files contain **top-level `await`** statements, due to Rolldown handling module chunking differently than Rollup ([storybookjs/storybook#33797](https://github.com/storybookjs/storybook/issues/33797)). Avoid top-level `await` in story files. This does not affect `storybook dev`.

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
    - pnpm install
  script:
    - pnpm format:check
    - pnpm lint
    - pnpm type-check
    - pnpm test
    - pnpm build
  cache:
    key:
      files:
        - pnpm-lock.yaml
    paths:
      - .pnpm-store/
```

Notes:

- **Cache key** uses `key:files` with `pnpm-lock.yaml` — GitLab automatically hashes the lockfile, giving cache invalidation exactly when dependencies change. This is more correct than branch-based keys which cause stale caches or unnecessary misses.
- **`pnpm install` without `--frozen-lockfile`** — in pnpm 10, `--frozen-lockfile` defaults to `true` in CI environments (when a lockfile is present). The flag is redundant but harmless if you prefer being explicit.
- **`format:check` runs first** — Oxfmt is ~30x faster than Prettier, giving near-instant feedback. Doesn't depend on build output.
- **`type-check` runs `vue-tsc --build`** — uses project references for cross-package type validation.
- All checks run sequentially in one job. This is acceptable for the initial scaffolding. As the repo grows, split into parallel jobs for faster feedback.

This ensures the scaffolding works in a clean environment, not just locally.

### 10. CLAUDE.md

Create a `CLAUDE.md` at the root with:

- Project overview and architecture.
- Available commands (`pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm test`, `pnpm type-check`, `pnpm repo:check`, etc.).
- Package dependency graph (`@unicorn/web` → `@unicorn/ui`, `@unicorn/storybook` → `@unicorn/ui`).
- Conventions: `U` component prefix, category-level imports (`@unicorn/ui/components`), file structure patterns.
- How to add a new component to `@unicorn/ui` (create component + test in `packages/ui/`, create story in `apps/storybook/stories/`).
- How to add a new dependency (add to pnpm catalog first, then reference with `catalog:` in the package).
- How to add a new app to `apps/` (including adding it to root `tsconfig.json` project references). **Constraint**: all packages/apps must be exactly one level deep under `apps/` or `packages/` for the tsconfig `extends` paths to work.
- How `publishConfig.exports` works (source in monorepo, built output with `types` conditions when published).
- Pre-commit hook behavior (lint-staged runs lint + format on staged files only; full type-check and tests run in CI).
- Note: VitePress can be added later for prose documentation (design principles, getting started guides) that doesn't fit in Storybook.

### 11. README.md

Replace the default GitLab README with a proper project README:

- Prerequisites (Node 24.10+, pnpm 10+, Windows developer mode enabled for pnpm symlinks).
- Getting started instructions (`corepack enable && pnpm install`, `pnpm dev`). Note: Corepack on Windows may require removing existing Corepack shims via Windows app settings if using `.msi` Node installations.
- Project structure overview.
- How to run Storybook (`pnpm --filter @unicorn/storybook dev`) for browsing components.
- IDE setup: recommend Volar extension for VS Code, note that `vue-tsc` is used for type checking.

---

## Key Decisions

| Decision              | Choice                                                  | Rationale                                                                                                                                                                        |
| --------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package manager       | pnpm 10 + workspaces + catalog                          | Centralized version management; prevents drift across packages                                                                                                                   |
| pnpm version pinning  | `packageManager` field + Corepack                       | Ensures every contributor uses the exact same pnpm version. Note: Corepack removed from Node 25+                                                                                 |
| Orchestration         | Turborepo                                               | Minimal config, build caching, easy to remove if unwanted                                                                                                                        |
| Package scope         | `@unicorn/`                                             | Consistent internal namespace                                                                                                                                                    |
| Linting               | OxLint + ESLint (dual)                                  | OxLint (Rust, ~100x faster) handles correctness rules; ESLint handles Vue/TS-specific rules. `eslint-plugin-oxlint` prevents duplicate rules                                     |
| ESLint config         | `@vue/eslint-config-typescript` + `eslint.config.ts`    | Vue team's official config; TypeScript config file with `jiti` for type safety                                                                                                   |
| Formatter             | Oxfmt (alpha), `semi: false`, `singleQuote: true`       | ~30x faster than Prettier, Prettier-compatible JS/TS output, built-in package.json sorting. Vue SFC support functional but still being refined (alpha caveat)                    |
| TS configs            | `@vue/tsconfig` + root-level files + project references | Extends the Vue team's official config package; root `tsconfig.json` with `references` for incremental type-checking via `vue-tsc --build`                                       |
| TS compiler options   | `@vue/tsconfig` (upstream-maintained)                   | All modern defaults (`verbatimModuleSyntax`, `moduleDetection`, `skipLibCheck`, `forceConsistentCasingInFileNames`, etc.) maintained by the Vue team — no manual tracking needed |
| Build tool            | Vite 8 beta (Rolldown)                                  | Rolldown replaces Rollup/esbuild; `build.rolldownOptions` instead of `build.rollupOptions`. Storybook peer dep mismatch handled via `peerDependencyRules.allowAny`               |
| Component lib imports | Category-level subpath exports + `publishConfig`        | Source in monorepo, built output with `"types"` conditions when published                                                                                                        |
| Component prefix      | `U` (for Unicorn)                                       | Vue convention to avoid collisions with HTML elements and third-party components                                                                                                 |
| TS target             | `ESNext`                                                | Vue ecosystem convention; with `noEmit: true`, the target doesn't affect output — Vite handles all transforms                                                                    |
| Component docs        | Storybook 10                                            | Controls/Actions/Docs built in (no addons needed), vue-component-meta docgen, visual testing foundation; add VitePress later for prose docs                                      |
| Vue version           | 3.6 beta (Vapor Mode)                                   | Vapor is opt-in per component; VDOM code unchanged from 3.5. `@vitejs/plugin-vue@6` adds Vapor HMR. Pre-release peer deps handled via `overrides` in `pnpm-workspace.yaml`       |
| State management      | Deferred                                                | Add Pinia when needed, not before                                                                                                                                                |
| Testing               | Vitest + @vue/test-utils + jsdom from day one           | 50+ components can't be retrofitted with tests later; jsdom over happy-dom for broader API coverage and stability                                                                |
| CI                    | Included from day one                                   | Catches "works on my machine" issues immediately                                                                                                                                 |
| Git hooks             | simple-git-hooks + lint-staged                          | Pre-commit runs lint/format on staged files only; type-check + test run in CI                                                                                                    |
| Unused code detection | knip                                                    | Catches dead exports, unused deps, orphaned files as component count grows                                                                                                       |
| IDE setup             | `.vscode/extensions.json` + `settings.json`             | Extensions: Volar, ESLint, OXC, Vitest, EditorConfig. Settings: file nesting, format-on-save (Oxfmt), auto-fix-on-save (ESLint)                                                  |
| Line endings          | LF enforced via `.gitattributes`                        | Prevents cross-platform line ending issues and formatter check failures                                                                                                          |
| Node version          | `useNodeVersion` in `pnpm-workspace.yaml` + `engines`   | pnpm manages Node directly; no nvm/fnm needed. Setting is only valid in `pnpm-workspace.yaml` (not `.npmrc`)                                                                     |

---

## Verification

After scaffolding, run these commands to verify everything works. All generated code must pass these checks before committing — expect to iterate if ESLint rules or Oxfmt formatting disagree with the generated code.

1. `pnpm install` — All dependencies resolve without errors (catalog versions, Vue beta overrides in `pnpm-workspace.yaml`). Git hooks are installed via the `prepare` script.
2. `pnpm build` — Turborepo builds `@unicorn/ui` first (Vite produces `.mjs`, vue-tsc produces `.d.ts`), then downstream packages. Exits 0.
3. `pnpm dev` — Dev server starts for `@unicorn/web` (port 5173). `UButton` renders correctly on the home page.
4. `pnpm --filter @unicorn/storybook dev` — Storybook starts. UButton stories render with interactive controls.
5. `pnpm lint` — OxLint and ESLint run across all packages with no errors.
6. `pnpm type-check` — `vue-tsc --build` compiles with no errors (using project references for incremental checking).
7. `pnpm test` — Vitest runs the UButton test and passes.
8. `pnpm format:check` — Oxfmt reports no formatting issues.
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
- Tree-shaking works — bundlers (Vite/Rolldown) eliminate unused named exports from barrel files in production builds.
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
      ".": {
        "types": "./dist/index.d.ts",
        "import": "./dist/index.mjs"
      },
      "./components": {
        "types": "./dist/components/index.d.ts",
        "import": "./dist/components/index.mjs"
      },
      "./composables": {
        "types": "./dist/composables/index.d.ts",
        "import": "./dist/composables/index.mjs"
      }
    }
  },
  "files": ["dist"]
}
```

This map only grows when you add a new _category_ (rare), not when you add a new component (frequent).

**How `publishConfig` works:** In the monorepo, `exports` points to source — all tools (Vite, TypeScript, Vitest, Storybook) resolve source files directly with no special configuration. When you run `pnpm publish`, pnpm automatically replaces `exports` with `publishConfig.exports`, so the published package points to built `dist/` output with explicit `"types"` conditions for TypeScript resolution. External consumers installing from the npm registry get the built files with proper type resolution.

The `"types"` condition must come first in each export entry — this is a TypeScript requirement. Without it, external TypeScript consumers may fail to resolve `.d.ts` files for subpath exports.

**How the nested `dist/` output is produced:** The Vite lib mode config uses the object-form entry with slashes in the keys (via `build.rolldownOptions` in Vite 8):

```ts
entry: {
  'index': resolve(__dirname, 'src/index.ts'),
  'components/index': resolve(__dirname, 'src/components/index.ts'),
  'composables/index': resolve(__dirname, 'src/composables/index.ts'),
},
```

Combined with `entryFileNames: '[name].mjs'`, this produces `dist/index.mjs`, `dist/components/index.mjs`, etc. The `.d.ts` files are generated by `vue-tsc` using `rootDir: "./src"` and `outDir: "./dist"`, which preserves the same directory structure.

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

### Dev performance notes

Vite treats linked workspace dependencies as source code and resolves each module individually through the barrel files. With 30+ components, this means the dev server resolves all re-exports in the category barrel on first load.

In practice, this is fast enough for most use cases — Vite's native ESM handling is efficient. If the dev server startup or HMR becomes noticeably slow:

1. **Build the library in watch mode**: Run `pnpm --filter @unicorn/ui build --watch` in a separate terminal. Consumers then resolve from `dist/` instead of source. This is a workflow change, not an architecture change.
2. **Split large categories**: If the `components` barrel grows very large, consider splitting into subcategories (`@unicorn/ui/forms`, `@unicorn/ui/layout`). This is a one-time `package.json` exports change.

Note: `optimizeDeps.include` in consuming apps' `vite.config.ts` may NOT pre-bundle linked workspace dependencies — Vite treats them as source regardless of this setting. This escape hatch only works for packages resolved from `node_modules`, not for linked workspace packages.

---

## Appendix B: pnpm Catalog

### The problem

In a monorepo, multiple packages depend on the same libraries (e.g., `vue`, `typescript`, `eslint`). Without centralized version management, each `package.json` declares its own version string. Over time, versions drift — one package uses `vue@3.5.0`, another uses `vue@3.5.12` — leading to subtle bugs and bloated `node_modules`.

### How the catalog works

pnpm's catalog feature lets you declare dependency versions once in `pnpm-workspace.yaml`. Individual `package.json` files reference `catalog:` instead of a version string.

**`pnpm-workspace.yaml`** (full file):

```yaml
useNodeVersion: '24.10.0'

packages:
  - apps/*
  - packages/*

onlyBuiltDependencies:
  - esbuild

overrides:
  '@vue/compiler-core': beta
  '@vue/compiler-dom': beta
  '@vue/compiler-sfc': beta
  '@vue/compiler-ssr': beta
  '@vue/compiler-vapor': beta
  '@vue/reactivity': beta
  '@vue/runtime-core': beta
  '@vue/runtime-dom': beta
  '@vue/runtime-vapor': beta
  '@vue/server-renderer': beta
  '@vue/shared': beta
  vue: beta

peerDependencyRules:
  allowAny:
    - vue
    - vite

catalog:
  # Framework
  vue: ^3.5.27
  vue-router: ^5.0.0
  '@vitejs/plugin-vue': ^6.0.0
  vite-plugin-vue-devtools: ^8.0.0

  # Build
  vite: beta
  turbo: ^2.0.0

  # TypeScript
  typescript: ~5.9.0
  '@vue/tsconfig': ^0.8.0
  '@tsconfig/node24': ^24.0.0
  '@types/node': ^24.0.0
  vue-tsc: ^3.2.0

  # Linting & Formatting
  eslint: ^9.0.0
  '@vue/eslint-config-typescript': ^14.6.0
  eslint-plugin-vue: ~10.7.0
  '@vitest/eslint-plugin': ^1.6.0
  eslint-plugin-oxlint: ~1.42.0
  eslint-config-prettier: ^10.0.0
  oxlint: ~1.42.0
  oxfmt: ^0.27.0
  jiti: ^2.6.0

  # Testing
  vitest: ^4.0.0
  '@vue/test-utils': ^2.4.0
  jsdom: ^27.0.0
  '@types/jsdom': ^27.0.0

  # Storybook
  storybook: ^10.1.0
  '@storybook/vue3-vite': ^10.1.0

  # Tooling
  simple-git-hooks: ^2.11.0
  lint-staged: ^16.0.0
  knip: ^5.0.0
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
    "jsdom": "catalog:"
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
