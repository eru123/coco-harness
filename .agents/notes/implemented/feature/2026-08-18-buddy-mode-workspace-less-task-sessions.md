# Agent Note: Buddy mode: workspace-less task sessions in a Tasks bucket

Status: implemented

## Problem

Every Web UI session was a workspace session. The hero gated composing on a chosen workspace directory, the sidebar grouped sessions only under registered workspaces (plus an Ungrouped bucket for stray cwds), and creating a session without a workspace silently fell back to the Host's launch directory as its cwd — presenting a project that does not exist. A personal task such as sorting files or managing applications had no honest entry point.

## Decision

Buddy mode is the explicit no-workspace posture, carried by one observable fact: the session header has no `cwd`.

- `IWorkspaces.startBuddySession()` creates the session through `SessionsPort.create({ mode: 'buddy' })`. The api proxy resolves no directory for `mode: 'buddy'` — the Host-cwd fallback never fires and no project directory is created — and agent creation passes no `cwd` in its meta.
- The hero's **New task** button starts one; a buddy session composes freely, shows the **Tasks** chip, and never gates the composer on a workspace pick.
- The sidebar keys the **Tasks** bucket on `summary.cwd === undefined` and places it ahead of the workspaces; strays with a cwd no account owns remain **Ungrouped**. The Tasks bucket orders by recency.
- The workspace picker stays available from the hero; continuing into a project mints a new workspace session by design, because a buddy session never gains a cwd.

A cwd-less session's working identity — home-directory roots across the prompt variable, the tools, and the sandbox boundary — is owned by the follow-up [cwd-less sessions note](../bug-fix/2026-08-18-buddy-sessions-work-from-user-home.md).

## Alternatives considered

**Reuse the Ungrouped bucket.** Ungrouped already held sessions outside every workspace, but its meaning is "a cwd no account owns"; workspace-less personal tasks are a distinct posture with their own chrome and ordering.

**Register a personal pseudo-workspace.** Making buddy a workspace, or defaulting `cwd` to a real directory at creation, would fold buddy sessions into ordinary workspace grouping and break the hero's Tasks chrome; the follow-up note records the same rejection for a home-directory cwd.

**Keep the Host-cwd fallback for workspace-less creation.** That roots a "personal" session in the server's launch directory — the failure mode buddy mode exists to remove.

## Consequences

The hero serves two parallel entries — workspace sessions and workspace-less tasks — and session summaries distinguish them purely by `cwd === undefined`, one contract shared by the client tree, the hero, and the host (`SessionCwdConflict` widened to `string | undefined`). Subagent delegation from a cwd-less parent is rejected by out-of-process providers unless explicitly configured, so no child session silently changes roots. Moving a task into a project continues as a new session; there is deliberately no attach-a-cwd migration. The Tasks bucket and hero entry are pinned by the ui-workspace tree specs and the sidebar snapshot, the hero chrome by the ui-conversation skeleton specs.
