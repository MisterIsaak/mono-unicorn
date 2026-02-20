# Consolidated Architecture Review — Unicorn Monorepo

Three agents independently reviewed the codebase from different angles: performance, best practices, and devil's advocate. No critical issues were found by any reviewer. The architecture is sound for a greenfield project, but there are clear areas to address. Below are the findings merged and deduplicated, ordered by priority.

## High Priority

### 1. ~~Triple-beta foundation risk~~ SKIPPED

Vue 3.6-beta, Vite 8-beta, and TypeScript ~5.9 are all pre-release. The project already has a Vue patch and a `vue() as any` cast to paper over incompatibilities. When any of these release breaking changes, the entire toolchain can break simultaneously. Consider documenting an explicit "beta exit" strategy with fallback versions, or pinning at least 2 of the 3 to stable.

### 2. ~~Catalog vue version is misleading~~ RESOLVED

The catalog declared `vue: ^3.5.27` but overrides forced `vue: beta` (resolving to `3.6.0-beta.5`). The catalog entry was effectively dead code. **Fixed**: catalog entry updated to `vue: beta` to match the override.

### 3. No CSS/theming strategy

`UButton` uses hardcoded hex colors (`#3b82f6`, `#2563eb`). At 30+ components, managing colors via hardcoded values will be unmaintainable. A design token system or CSS custom properties should be established before adding component #2.

### 4. No accessibility testing

No axe-core, no pa11y, no `eslint-plugin-vuejs-accessibility`. For a component library, accessibility should be foundational.

## Medium Priority

### 5. ~~Add `"sideEffects": false` to `@unicorn/ui`~~ RESOLVED

The root `index.mjs` had a side-effect import of the components barrel. **Fixed**: `"sideEffects": false` added to `packages/ui/package.json`. Bundlers will now safely tree-shake unused components when consumers import from the root `@unicorn/ui` entry point.

### 6. ~~OxLint only enables `correctness` category~~ RESOLVED

The `suspicious`, `pedantic`, and `style` categories are all off. At minimum, enabling `suspicious: "warn"` would catch likely bugs and extract more value from the dual-linter setup.

### 7. ~~Oxfmt alpha risk~~ SKIPPED

Oxfmt's Vue SFC support is still maturing, it has near-zero community ecosystem, and new hires will find no documentation. The 30x speed benefit is irrelevant at this repo's size. Keep the Prettier fallback ready.

### 8. Web app has zero test infrastructure

No vitest config, no test script, no test files in `apps/web`. Setting up the skeleton now prevents debt later.

### 9. `vue` peer dependency range may need attention

`catalog:` in `peerDependencies` now resolves to `beta`. If the library relies on Vue 3.6 APIs, the published peer constraint should be explicit (e.g., `^3.6.0`). If it doesn't, the range should be broadened to support stable consumers.

### 10. Storybook `vue-component-meta` docgen is 12% of build time

This will grow with component count. Worth monitoring. The alternative `vue-docgen-api` plugin is faster but less accurate.

## Low Priority

### 11. Empty `.npmrc`

The CI cache config references `.pnpm-store/` which assumes `store-dir=.pnpm-store` in `.npmrc`, but the file is empty. CI caching may not work as intended.

### 12. Turborepo `test` task has no `inputs`/`outputs`

Adding explicit `inputs` narrows cache invalidation. Adding `"outputs": []` makes intent clear.

### 13. ~~Consider `happy-dom` over `jsdom`~~ RESOLVED

Environment setup is 990ms vs 35ms for actual tests. `happy-dom` is 2-10x faster for simple DOM tests.

### 14. Missing E2E, visual regression, versioning tooling

No Cypress (despite `.gitignore` entries for it), no Chromatic/Percy, no changesets. Address before first publish.

### 15. ~~Single sequential CI job~~ RESOLVED

All validation ran sequentially in one GitLab CI job. **Fixed**: split into 3 stages (install, validate, build) with 4 parallel validation jobs (format, lint, type-check, test). Install artifacts are shared via GitLab artifacts. pnpm store is configured project-local in CI only (`pnpm config set store-dir`) to avoid polluting `.npmrc`.

## What's Working Well

All three reviewers called out these positives:

- `__VUE_OPTIONS_API__: 'false'` in all Vite configs (smaller bundles)
- TypeScript project references are well-structured with incremental builds
- `esnext` build target avoids unnecessary transpilation
- Vue correctly externalized from library build
- Clean publish config with dual source/dist exports
- `onlyBuiltDependencies` restricts install scripts (security)
- Pre-commit hooks are lightweight (lint only, tests in CI)
- `noUncheckedIndexedAccess: true` (strict TypeScript)
- Production web bundle is 32 kB gzipped — very lean
- Co-located tests with solid patterns

## The Fundamental Tension

The config-to-code ratio is roughly **30:1**. This is a "build for scale from day one" bet. The architecture is well-designed for 30+ components but creates significant cognitive overhead for the current reality of 1 button. This is defensible if the growth projection holds, but the team should be honest about the ramp-up cost for new contributors.
