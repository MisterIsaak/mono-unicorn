# Unicorn Monorepo Scaffolding Plan

## Context

Setting up a greenfield Vue 3 monorepo on a blank GitLab repository. The goal is a well-structured, industry-standard monorepo that new hires can onboard to quickly. The workspace includes a custom component library, its documentation site, one or more Vue frontend apps, and shared tooling configs.

**Environment**: Node 24.10, pnpm 10.26, Windows, GitLab-hosted.

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
│   └── docs/                       # VitePress docs for component library
│       ├── .vitepress/config.ts
│       ├── index.md
│       ├── components/             # Component documentation pages
│       │   └── button.md
│       ├── package.json            # @unicorn/docs
│       └── eslint.config.js
├── packages/
│   ├── ui/                         # Shared Vue component library
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── Button/
│   │   │   │       ├── UButton.vue
│   │   │   │       └── index.ts
│   │   │   └── index.ts            # barrel export
│   │   ├── package.json            # @unicorn/ui
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts          # lib mode build
│   │   └── eslint.config.js
│   ├── eslint-config/              # Shared ESLint flat config (publishable)
│   │   ├── base.js                 # TS + general rules
│   │   ├── vue.js                  # Vue-specific rules (extends base)
│   │   └── package.json            # @unicorn/eslint-config
│   ├── prettier-config/            # Shared Prettier config (publishable)
│   │   ├── index.js                # Config object
│   │   └── package.json            # @unicorn/prettier-config
│   └── tsconfig/                   # Shared TypeScript configs (publishable)
│       ├── base.json               # Strict shared compiler options
│       ├── app.json                # For Vue apps (extends base)
│       ├── lib.json                # For libraries (extends base)
│       └── package.json            # @unicorn/tsconfig
├── .gitignore
├── .npmrc
├── .editorconfig
├── turbo.json
├── pnpm-workspace.yaml
├── package.json                    # Root workspace config
├── README.md
└── CLAUDE.md
```

---

## Steps

### 1. Root workspace files

Create root-level configuration files:

- **`package.json`** — Private workspace root. Scripts: `dev`, `build`, `lint`, `type-check`, `test`, `format`. All delegate to Turborepo.
- **`pnpm-workspace.yaml`** — Declares `apps/*` and `packages/*`.
- **`turbo.json`** — Task pipeline: `build` depends on `^build` (upstream packages first), `dev` is persistent/no-cache, `lint`/`type-check`/`test` are independent.
- **`.npmrc`** — `strict-peer-dependencies=false` (common pnpm monorepo setting).
- **`.editorconfig`** — Ensures consistent whitespace/encoding across editors.
- **`.gitignore`** — Node modules, dist, Vite cache, editor files, OS files, turbo cache.

### 2. Shared TypeScript configs (`packages/tsconfig/`)

Create `@unicorn/tsconfig` with three config files:

- **`base.json`** — Strict mode, ES2022 target, bundler module resolution, Vue JSX support, path aliases.
- **`app.json`** — Extends base. Adds DOM lib, includes `src/**/*`.
- **`lib.json`** — Extends base. Adds declaration emit, includes `src/**/*`.

### 3. Shared ESLint config (`packages/eslint-config/`)

Create `@unicorn/eslint-config` using ESLint 9 flat config format:

- **`base.js`** — TypeScript-ESLint recommended rules + Prettier compat (eslint-config-prettier). Ignores dist/node_modules.
- **`vue.js`** — Extends base, adds eslint-plugin-vue recommended rules with TypeScript parser for `<script>` blocks.
- **`package.json`** — Dependencies: `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-vue`, `eslint-config-prettier`.

### 4. Shared Prettier config (`packages/prettier-config/`)

Create `@unicorn/prettier-config` as a publishable package:

- **`index.js`** — Exports a Prettier config object: single quotes, 2-space indent, trailing commas, 100 char print width, semi.
- **`package.json`** — Main entry points to `index.js`. No dependencies.
- The root `package.json` references this config via `"prettier": "@unicorn/prettier-config"`, and other external projects can install and reference it the same way.

### 5. Component library (`packages/ui/`)

Create `@unicorn/ui`:

- **Vite lib mode** build config outputting ESM.
- **Starter component**: `UButton.vue` — a simple, typed button component demonstrating props, emits, and slots.
- **Barrel export** in `src/index.ts`.
- **`package.json`** — Exports field pointing to `src/index.ts` (dev) and `dist/` (build). Peer dependency on `vue`.

### 6. Documentation site (`apps/docs/`)

Create `@unicorn/docs` using VitePress:

- **`.vitepress/config.ts`** — Site config with sidebar navigation pointing to component docs.
- **`index.md`** — Landing page.
- **`components/button.md`** — Documents the Button component with live usage examples.
- **`package.json`** — Depends on `@unicorn/ui`, scripts for `dev`/`build`/`preview`.

### 7. Web application (`apps/web/`)

Create `@unicorn/web`:

- **Vue 3 + Vite + Vue Router + TypeScript**.
- **`src/App.vue`** — Root component with `<RouterView>`.
- **`src/views/HomeView.vue`** — Landing page importing `UButton` from `@unicorn/ui`.
- **`src/router/index.ts`** — Basic router setup.
- **`vite.config.ts`** — Standard Vue + Vite config.
- **`package.json`** — Depends on `@unicorn/ui`, `vue`, `vue-router`.

### 8. CLAUDE.md

Create a `CLAUDE.md` at the root with:

- Project overview and architecture.
- Available commands (`pnpm dev`, `pnpm build`, `pnpm lint`, etc.).
- Package dependency graph.
- Conventions (naming, file structure, component patterns).
- How to add a new component to `@unicorn/ui`.
- How to add a new app to `apps/`.

### 9. README.md

Replace the default GitLab README with a proper project README:

- Prerequisites (Node 20+, pnpm 10+).
- Getting started instructions (`pnpm install`, `pnpm dev`).
- Project structure overview.
- Links to docs site.

---

## Key Decisions

| Decision              | Choice                                   | Rationale                                                                                 |
| --------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| Package manager       | pnpm 10 + workspaces                     | Industry standard for monorepos, fast, strict                                             |
| Orchestration         | Turborepo                                | Minimal config, build caching, easy to remove if unwanted                                 |
| Package scope         | `@unicorn/`                              | Consistent internal namespace                                                             |
| ESLint                | v9 flat config                           | Current standard, not the deprecated `.eslintrc` format                                   |
| Prettier              | `@unicorn/prettier-config` package       | Publishable to registry, reusable across projects outside this repo                       |
| TS configs            | Shared package                           | `extends` in tsconfig works with package references                                       |
| Component lib build   | Vite lib mode                            | Same toolchain as the apps, well-supported                                                |
| Docs                  | VitePress                                | Vue-native, markdown-based, supports live component demos                                 |
| State management      | Not included yet                         | Add Pinia when needed, not before                                                         |
| Config publishability | All 3 config packages designed for reuse | Can be published to GitLab npm registry or any private registry for use in other projects |

---

## Verification

After scaffolding, run these commands to verify everything works:

1. `pnpm install` — All dependencies resolve, no peer dep errors.
2. `pnpm build` — Turborepo builds `@unicorn/ui` first, then `apps/web` and `apps/docs`.
3. `pnpm dev` — All dev servers start (web on :5173, docs on :5174).
4. `pnpm lint` — ESLint runs across all packages with no errors.
5. `pnpm type-check` — TypeScript compiles with no errors.
6. `pnpm format --check` — Prettier reports no formatting issues.
