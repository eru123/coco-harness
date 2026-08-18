# Agent Note: A cwd-less session works from the user's home directory

Status: implemented

## Problem

Every turn on a Tasks (buddy) session failed with `prompt variable "{{cwd}}" has no value for this assembly (section "deployment:persona")`. Buddy sessions are cwd-less by design — the host creates them with `cwd: undefined` and the client's Tasks-bucket logic keys on `summary.cwd === undefined` — but the session's working identity had no owner: the `{{cwd}}` prompt variable read `session.header.cwd` directly and strict interpolation rejected `undefined`, while the shell, filesystem, search, and sandbox resolvers each fell back to a different root (`process.cwd()` or the configured sandbox root, i.e. the server's launch directory). The persona a buddy session would have shown was also the wrong claim: the agent's commands actually ran wherever `cch web` was started.

## Decision

A cwd-less agent session works from the user's home directory, uniformly. The default lives in the five resolvers that own a session's working identity, each as an explicit resolve step distinguishing agent-without-cwd from agentless:

- `cch-agent-loop` registers `{{cwd}}` as `session.header.cwd ?? homedir()`, so buddy personas assemble and state the real working directory.
- `cch-tool-bash` `resolveWorkdir` resolves a cwd-less agent's workdir to `canonicalPath(homedir())`; agentless calls keep the executor default.
- `cch-tool-fs` `sessionCwd` returns `homedir()` for a cwd-less agent; agentless calls keep the provider fallback.
- `cch-tool-fs-search` `runRipgrep` spawns from `homedir()` for a cwd-less agent; agentless calls keep `process.cwd()`.
- `cch-sandbox-policy` `resolve` gives a cwd-less session `homedir()` as its `workspace-write` boundary; the configured `workspaceRoot` remains the agentless fallback (and stays a config field — the home default is a semantic identity, not a deployment-varying tunable).

Buddy task sessions are therefore user-profile agents: file sorting, organization, and application-management tasks run over everything the user can access, with relative paths and sandbox confinement rooted at home. Subagent children are unaffected — out-of-process providers reject delegation from a cwd-less parent unless configured, so no child session silently changes roots.

## Alternatives considered

**Default `cwd` to home at session creation.** One write instead of five, but the Tasks-bucket and buddy detection on the client key on `summary.cwd === undefined`; a home-cwded buddy session would surface as a workspace session and break the hero's Tasks chrome.

**Default only the prompt variable.** Fixes the turn failure cheapest, but the persona would then claim a working directory the tools do not use — the original lie, kept.

**Leave the sandbox fallback configured-only.** Keeps buddy writes confined to the server's launch directory, contradicting the buddy role; the boundary follows the working identity.

## Consequences

- Tests that used a cwd-less agent to mean "provider/config default applies" now state their workspace through the session header cwd instead (`tool-fs` integration spec and with-key e2e, `tool-fs-search` spawn-cwd spec); the fs e2e harness doc names `fsCwd` the agentless fallback only.
- `agent-loop`'s strict-variable failure test uses a registered-but-valueless variable (`{{unset}}`) instead of a missing cwd, since `{{cwd}}` can no longer be valueless.
- A deployment that wants a different buddy root configures the preset persona text and the sandbox `workspaceRoot`; the home default itself is fixed semantics, like `process.cwd()` was.
