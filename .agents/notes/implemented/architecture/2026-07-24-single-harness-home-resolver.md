# Agent Note: One harness home resolver

Status: implemented

## Problem

The harness had two inconsistent conventions for "where does Coco Harness user data live":

- `@coco-harness/cch-home` resolved `configured ?? $CCH_HOME ?? ~/.cch`.
- `@coco-harness/cch-home-paths` shipped a **second** `resolveCchHome` with the same precedence plus tilde expansion — a near-duplicate of `cch-home` that no gate flagged because the two lived in different packages and had already drifted (only one expanded tildes).

Two resolvers for the same cross-cutting fact meant there was no single home policy.

## Decision

One resolver owns the harness home, in `@coco-harness/cch-home-paths`, single-root:

```
explicit configured path  >  $CCH_HOME  >  ~/.cch
```

An empty or whitespace-only `$CCH_HOME` is treated as unset; otherwise `resolve('')` would silently place the home at the current working directory. The harness keeps all user data under one root; there is no XDG config/data/cache split. `cchHomePath(...segments)` joins deployment-owned children onto that root, and `cch-app-boot` exposes it to Loader `!!js` config expressions before mounting entries, so shipped compositions derive `sessions` and `storages` without copying the resolver. `cchHomeDisplay()` names a resolved root symbolically for user-facing paths — `~/.cch` for the default home, `$CCH_HOME` for any configured home — so the user-global `AGENTS.md` label never leaks an absolute machine path. It replaces agent-instructions's bespoke default-vs-`$CCH_HOME` check.

`@coco-harness/cch-home` is deleted. Its three importers (`cch-tool-bash`, `cch-skill-filesystem`, `cch-agent-spine-demo`) import `resolveCchHome` from `cch-home-paths`.

`cch-telemetry` and its separate home policy are absent under the [SDK project toolchain removal](../simplification/2026-08-11-remove-sdk-project-toolchain.md), leaving this resolver as the sole home policy.

## Alternatives considered

**Leave the two `resolveCchHome` copies in place.** They had already drifted (one expands tildes, one didn't) and encode the same cross-cutting fact twice. Consolidation is the point of the `util/` layer; a duplicate resolver is a latent divergence bug.

**Adopt XDG (honor `$XDG_CONFIG_HOME`, or split config/data/cache into separate trees).** Considered and dropped in favor of one obvious root. A single `$CCH_HOME || ~/.cch` ground truth matches `~/.claude` / `~/.aws`, needs no per-kind reclassification of every `~/.cch` consumer, and leaves no resolver asymmetry to reconcile.

## Consequences

- One home fact, one resolver. `cch-home-paths` is the sole owner; the `util/` group loses the `home` package.
