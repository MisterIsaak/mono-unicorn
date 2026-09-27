# Git Branching & Versioning Strategy

**Trunk-based development with release branches (Release Flow), lockstep SemVer with rc pre-releases, and build-once artifact promotion.**

## Methodology

| Piece | Standard name | Reference |
|---|---|---|
| Everyone merges to `main` through short-lived branches | **Trunk-Based Development** | [trunkbaseddevelopment.com](https://trunkbaseddevelopment.com) |
| Cut `release/X.Y` from `main` to stabilize, retire it later | **Branch for release** (a TBD variant) | trunkbaseddevelopment.com → "Branch for release" |
| Fix on `main`, then cherry-pick to the release branch; never merge back | **Upstream first** | Same site, and Microsoft's *Release Flow* |
| `MAJOR.MINOR.PATCH-rc.N` | **Semantic Versioning 2.0.0** with **pre-release identifiers** | [semver.org](https://semver.org) |
| Tag the tested rc commit as final and re-tag the same images | **Build once, deploy many** / **artifact promotion** | *Continuous Delivery* (Humble & Farley) |
| One version for every component | **Lockstep** (or **fixed**) versioning | Term used by Lerna, Changesets and Nx |

The closest single named methodology is **Microsoft's Release Flow**. See "Release Flow: How We Do Branching on the VSTS Team."

## Branches

| Branch | Purpose | Lifetime |
|---|---|---|
| `main` | All development lands here through PRs. | Permanent |
| `feature/*`, `fix/*` | Short-lived work branches, squash-merged into `main`. | Hours to days |
| `release/X.Y` | Stabilization and hotfixes for one release line. | While that version is supported |

- Release branches are named `release/MAJOR.MINOR` (e.g. `release/1.2`). Patch releases are tags on that branch, not separate branches.
- At most 2–3 release lines are active at a time: the one in production and the one in QA.
- **Release branches are never merged back into `main`.** Once a version is no longer supported, delete the branch or lock it read-only. The tags keep the full history.

## Fixes: upstream first

1. Fix on `main` through a normal PR.
2. Cherry-pick it to the release branch: `git cherry-pick -x <sha>`.
3. For a production emergency, the fix may land on the release branch first, **but a matching PR to `main` is required.**

## Versioning

Format: `MAJOR.MINOR.PATCH-rc.N` (SemVer 2.0.0)

- **MAJOR**: breaking change · **MINOR**: new feature · **PATCH**: bug fix
- Use `rc.N` (a dot), not `rc-N`. That way `rc.9 < rc.10` sorts correctly.
- Git tags have a `v` prefix: `v1.2.0-rc.1`, `v1.2.0`.
- **Lockstep:** every component (component library, frontend, backend) shares one version.

### How the rc number is determined

CI works out the version from existing git tags. There is no counter file and no CI build number.

- Base version: the highest final tag on the line + 1 patch, or `X.Y.0` if none exists yet.
- rc number: the highest existing `rc.N` for that base + 1, starting at `rc.1`.
- **Reruns on the same commit reuse its existing rc tag.** The rc number only goes up for new commits.

### Lifecycle example (`release/1.2`)

| # | Event | Commit | Result |
|---|---|---|---|
| 1 | Cut `release/1.2` from main, build runs | A | tag `v1.2.0-rc.1` → staging |
| 2 | Rerun the build | A | reuses `v1.2.0-rc.1`, no new tag |
| 3 | Fix cherry-picked to the branch | B | tag `v1.2.0-rc.2` → staging |
| 4 | Another fix | C | tag `v1.2.0-rc.3` → staging |
| 5 | QA approves promotion | C | tag `v1.2.0` on **commit C** → production |
| 6 | Hotfix cherry-picked | D | tag `v1.2.1-rc.1` → staging |
| 7 | QA approves promotion | D | tag `v1.2.1` on commit D → production |

## Promotion (build once, deploy many)

Promotion **does not rebuild**.

1. Add the final tag (`v1.2.0`) to the **same commit** as the approved rc.
2. Re-tag the existing Docker images (`crane tag <image>:1.2.0-rc.3 1.2.0`). The digest stays the same.
3. Deploy by digest, with `APP_VERSION=1.2.0` set at deploy time.

**Exception:** a component library published to an npm registry is re-published as `1.2.0` from the same commit, because npm versions can't be changed after publishing. RC builds publish with `npm publish --tag next`.

## Version in `package.json`

- **Committed:** every `package.json` has `"version": "0.0.0-development"`. It is never changed in git.
- **During the build:** CI sets the full rc version in every workspace and doesn't commit it:
  ```bash
  npm version "$VERSION" --workspaces --include-workspace-root --no-git-tag-version --allow-same-version
  ```
- Internal dependencies use `workspace:*` (pnpm) or `*` (npm workspaces).
- Python `pyproject.toml` versions use PEP 440 form (`1.2.0rc3`). Tools accept `1.2.0-rc.3` and normalize it.

## Traceability & audit

The chain from a running service back to its code:

```
Deployment record → version → image digest → git tag → commit SHA → PR / ticket
```

| Link | How |
|---|---|
| Artifact → commit | OCI labels `org.opencontainers.image.version` and `org.opencontainers.image.revision` (full SHA) |
| Running app → version | `/version` endpoint returns `version`, `sha` and `display` (`1.2.0+sha.a1b2c3d4`) |
| Deployment → artifact | Deploy by image digest. CI records the digests (`promoted.txt`). |
| Commit → change | Squash-merge commits include the PR number and ticket ID. `cherry-pick -x` links back to the commit on `main`. |

- The commit SHA is carried as **build metadata** (`+sha.xxxx`) only for display. It isn't used in git tags, Docker tags (which don't allow `+`) or npm versions (which drop it).
- Release branches can be deleted safely. **Tags are the permanent record.**

## Protections

- `main` and `release/*`: protected. No direct pushes; PR and passing CI required.
- `v*` tags: protected. Only the CI release bot can create them, and they can't be moved or deleted.
- Release image tags (`X.Y.Z`): protected/immutable in the container registry.
- Tags are **annotated** and record who created them, when, and who approved them.

## CI (Jenkins)

| Job | File | Trigger | Steps |
|---|---|---|---|
| **RC build** (multibranch) | [`Jenkinsfile`](./Jenkinsfile) | Every commit on `release/X.Y` | Compute and tag the rc → set versions → build images → deploy to staging |
| **Promote** (plain pipeline) | [`Jenkinsfile.promote`](./Jenkinsfile.promote) | Run manually with `RC_VERSION=X.Y.Z-rc.N` | Validate → re-tag images → deploy to production → tag `vX.Y.Z` on the rc's commit |

- Only QA approvers have the Build permission on the promote job. Running it counts as the approval, and the approver is recorded in the tag message.
- Each RC build's description shows the value to use: `Promote with RC_VERSION=...`.
- The final tag is created last, so it only exists once production is running that version. If promotion fails partway through, rerun it with the same `RC_VERSION`.

### Example: the final release tag

What the promote job's **Tag release** stage produces for a promotion from `release/1.8`:

| Variable | Example value |
|---|---|
| `RC_VERSION` (job parameter) | `1.8.0-rc.3` |
| `FINAL_VERSION` | `1.8.0` |
| `RELEASE_SHA` (from `git rev-parse 'v1.8.0-rc.3^{commit}'`) | `4f2a9c1e8b7d6a5f3e2c1b0a9d8e7f6a5b4c3d2e` |
| `APPROVER` | `jdoe` |
| `BUILD_URL` | `https://jenkins.example.com/job/app-promote/42/` |

**1. `writeFile` creates `.tag-message`:**

```
Release 1.8.0

Promoted from 1.8.0-rc.3
Approved by jdoe
Build https://jenkins.example.com/job/app-promote/42/
```

**2. The shell commands that run:**

```bash
git -c user.name='release-bot' -c user.email='release-bot@example.com' \
  tag -a 'v1.8.0' -F .tag-message 4f2a9c1e8b7d6a5f3e2c1b0a9d8e7f6a5b4c3d2e
git push origin 'refs/tags/v1.8.0' || { git tag -d 'v1.8.0'; exit 1; }
```

The token doesn't appear in the command or the log. `gitUsernamePassword` passes it to git through a temporary credential helper, and Jenkins masks it in the console output.

**3. What `git show v1.8.0` shows afterwards:**

```
tag v1.8.0
Tagger: release-bot <release-bot@example.com>
Date:   Sun Sep 27 14:05:12 2026 +0000

Release 1.8.0

Promoted from 1.8.0-rc.3
Approved by jdoe
Build https://jenkins.example.com/job/app-promote/42/

commit 4f2a9c1e8b7d6a5f3e2c1b0a9d8e7f6a5b4c3d2e (tag: v1.8.0-rc.3, tag: v1.8.0, origin/release/1.8)
...
```

**Tags don't depend on branches.** `release/1.8` doesn't appear anywhere in the commands. The tag only refers to the commit SHA. The branch shows up in the `git show` output only because that commit happens to be the current tip of `origin/release/1.8`, and it also carries the `v1.8.0-rc.3` tag.

`^{commit}` resolves the annotated rc tag to its commit. Without it, `v1.8.0` would point to the rc tag object instead of the commit (a "nested tag").
