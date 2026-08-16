# Translation style samples

This file is the calibration anchor for translation register: each sample group is one English source paragraph paired with one human-finalized Chinese translation, covering the main genres of this repository's documentation. **The register of translations is governed by these samples** — style samples outrank prose descriptions of tone, but the terminology table, faithfulness rules, and structure rules still take precedence. When translating or reviewing, work against the nearest style sample. This file is bilingual by construction and does not participate in pairing (see the exclusion list in [README.md](README.md)).

Maintenance: append newly review-calibrated gold paragraphs to the matching genre; fix semantic, structural, or terminology errors directly. Both additions and corrections go through PR review.

## ① Architectural narrative

> This document describes the architecture of the Coco Harness — the foundation of **DeepSeek Code**. The governing principle, from the microkernel design discussion: **everything is a plugin**. The core is deliberately tiny — a handful of abstract services plus one concrete loop plugin (`cch-agent-loop`) — and every product feature is a plugin against the extension API described here, without modifying the loop.

This document describes the overall architecture of the Coco Harness, the foundation layer of **DeepSeek Code**. The governing principle, established in the microkernel design discussion, is **everything is a plugin**. The core is deliberately minimal — a handful of abstract services plus one concrete loop plugin, `cch-agent-loop`. Every product feature is built as an independent plugin against the extension API defined here, without touching the main loop.

> Dependency rule: extension plugins depend on interfaces, never on `cch-agent-loop` (the loop is swappable); the sanctioned exception is the composition bundle `cch-agent-spine-demo`, whose job is assembling the concrete spine.

Dependency rule: extension plugins depend only on abstract interfaces and must never depend on `cch-agent-loop` directly (the loop is swappable); the one sanctioned exception is the composition bundle `cch-agent-spine-demo`, whose job is assembling the concrete spine.

> This document covers **behavior**; type definitions live in [subsystems/](../subsystems/core.md), the per-event/service reference lives in the generated regions of [subsystems/](../subsystems/core.md), and package contracts in the package READMEs state each package's required configuration and behavior ([map](../../packages/README.md)).

This document covers **behavior**; type definitions live in [subsystems/](../subsystems/core.md); the per-event and per-service reference lives in the generated regions of [subsystems/](../subsystems/core.md); the corresponding READMEs state each package's required configuration and behavior ([map](../../packages/README.md)).

## ② Defensive-pattern rules

> Hard-won bug-class rules: each pattern below is a class of defect that actually shipped or nearly shipped here, stated as the rule that prevents its recurrence. Read this before writing lifecycle, concurrency, subprocess, or teardown code.

These are hard-won bug-class rules: each pattern below corresponds to a class of defects that actually shipped or nearly shipped here, and each rule exists to prevent its recurrence. Read this document before writing lifecycle, concurrency, subprocess, or teardown code.

> **Dispose must reach quiescence, not just request it** — A teardown that issues kills/aborts but returns before the work stops leaves orphans. Make cleanup async and await the children's exit (kill → await `done`), and close listener/notification registries BEFORE killing so late completions stay silent. Tests prove disposal waited (pid gone right after `await fiber.dispose()`), not merely that the process eventually dies.

**Dispose must reach quiescence, not just request it**: a teardown that only issues kill or abort signals and returns before the work stops leaves orphans behind. Make cleanup async and wait for every child to exit fully (send the kill, then await `done`); close listener and notification registries BEFORE killing so late completions stay silent. Tests must prove that disposal waited for cleanup — the pid is gone right after `await fiber.dispose()` — not merely that the process eventually dies on its own.

> **Async state is not synchronous state** — `agent.followup()` does not flip status before returning; a background job's completion races turn boundaries; `reader.close()` fires for both EOF and disposal. Never gate control flow on a status you only just requested — drive lifecycle off the events/promises that actually fire (`agent/status`, `task.done`), and observe the transition (saw `running` THEN `idle`) instead of treating status as a per-follow-up result: several queued follow-ups run as consecutive turns under one `running` interval, while cancellation or disposal can discard unstarted items.

**Async state is not synchronous state**: calling `agent.followup()` does not flip status before returning; a background job's completion races turn boundaries; `reader.close()` fires for both EOF and disposal. Never gate control flow on a status you only just requested — drive lifecycle off the events/promises that actually fire (`agent/status`, `task.done`), and observe the full transition (saw `running` THEN `idle`) instead of treating status as a per-follow-up result: several queued follow-ups run as consecutive turns under one `running` interval, while cancellation or disposal can discard unstarted items.

## ③ Testing policy list

> **Coverage gate** (`pnpm run test:coverage`): the gating run, per-file 100% on `packages/*/*/src`. An uncovered line is often dead code the gate is correctly flagging for deletion, not a missing test to bolt on. Line coverage is necessary, never sufficient — it proves lines ran, not that the feature works as shipped.

Coverage gate (`pnpm run test:coverage`): as a merge gate it requires per-file 100% line coverage under `packages/*/*/src`. An uncovered line is usually dead code that the gate is correctly flagging for deletion, not a missing test to bolt on. Line coverage is necessary but far from sufficient: it proves the lines ran, not that the feature works as shipped.

> We are DeepSeek — do not ration real-API tests. A no-key test proves the plumbing; only a with-key run proves the agent works against a real model. Write many: real prompts that write files, multi-turn conversations, tool use, cancellation mid-stream. Cheapest and highest-value are **smoke tests** that boot the real example, send one real prompt, and check the world — they catch the "green unit tests, broken product" class that mocks structurally cannot. The self-skip exists only so secretless CI and keyless contributors aren't blocked; it is not a cost signal.

We are DeepSeek — real-API tests must not be rationed. A no-key test proves only the plumbing; only a run with a valid key proves that the agent works against a real model. Write many of them: real prompts that write files, multi-turn conversations, tool use, cancellation mid-stream.

Cheapest and highest-value are **smoke tests**: boot the complete real example, send one real prompt, and check externally observable results such as files and processes. They catch the class where every unit test is green but the product is actually broken — something mocks structurally cannot detect.

The built-in self-skip exists only so secretless CI environments and keyless contributors are not blocked by the pipeline; it is not license to cut investment in real-API tests.

> **Prefer the real implementation over a mock** — Mock only genuinely expensive or non-deterministic dependencies (the LLM adapter, the network, the clock); keep everything downstream real. A hand-rolled stand-in proves the bridge moves bytes, not that the shipping tool behaves as asserted — the two drift while the test stays green.

**Prefer the real implementation over a mock** — mock only genuinely expensive or non-deterministic dependencies (the LLM adapter, the network, the clock); keep everything downstream real. A hand-rolled stand-in proves the bridge moves bytes, not that the shipping tool behaves as asserted — over time the real logic and the mock drift apart while the test stays green.

## ④ Mechanism description

> Blob hashes, not commit hashes, so the record is computable for files edited in the same PR (`git hash-object foo.md`) and consistency is a pure content comparison. The recorded hash also recovers the exact last-confirmed text of either side (`git cat-file -p <hash>`), so an out-of-sync pair is updated by diffing the edited side against its last-confirmed state and patching the counterpart minimally — never by re-translating whole files.

The system records state with file blob hashes rather than commit hashes. When files are edited within the same PR, the blob hash is directly computable via `git hash-object foo.md`, and comparing content alone determines whether the bilingual documents are in sync. The recorded blob hash also recovers the exact text of either side as of the last confirmed alignment (`git cat-file -p <hash>`). When a bilingual pair is out of sync, diff the edited version against its last confirmed version and apply a minimal patch to the other side — never re-translate whole files.

## ⑤ Policy statement

> The gate's limit, stated plainly: a green gate means the pair was confirmed consistent at these exact contents, not that the confirmation was sound. It checks hashes and Markdown structure; it cannot judge whether the two sides actually say the same thing — that is the reviewer's half of the contract. A re-recorded pair with a sloppy counterpart passes the gate; it must not pass review.

The gate's limit, stated plainly: passing the gate only shows that both sides' current blob hashes match the sidecar record and that the Markdown structural signatures agree — that is, this content was at some point confirmed consistent; it does not mean the confirmation was sound. Reviewers must check whether the two languages actually say the same thing. Even a sloppy or inaccurate translation re-records the pair and passes the gate, but it must never pass human review.

## ⑥ Agent Note argumentation

> Comparing git timestamps of the pair (no record) — rejected: formatting-only edits would false-positive, and a counterpart committed after an unrelated edit would false-negative; content identity is the only signal that means what the gate claims.

Comparing git timestamps of the bilingual pair (a recordless design) — rejected: formatting-only edits would false-positive, and a counterpart committed after an unrelated edit would false-negative. Only an identifier grounded in the content itself — each side's blob hash compared against the sidecar record — can carry the meaning the gate claims.

## ⑦ Universal requirement (long-paragraph splitting demonstration)

> **Universal requirement**: every in-scope document merges as a complete bilingual pair. The manifest contains only explicit exclusions: it has no per-file rollout list, date cutoff, or README-specific policy class. […] Pairing is a continuing obligation: every later edit to either side updates the counterpart and consistency record in the same change.

**Universal requirement**: every in-scope document merges as a complete bilingual pair. The manifest contains only explicit exclusions: no per-file rollout list, date cutoff, or README-specific policy class. […] Pairing is a continuing obligation: every later edit to either side must update the counterpart and the consistency record in the same change.

## Key points distilled from the samples

- The register is normative institutional prose: full subject-predicate sentences and a definite tone; neither colloquial nor academic.
- Give sentences an explicit actor: English passives and abstract subjects become sentences with the system, the gate, the tool, or the reviewer as subject.
- Replace calques with established Chinese engineering idiom: false positive/negative take the conventional defect-report terms; ratchet becomes tighten-forward-never-loosen; reviewable act becomes the review-evidence term.
- Localize metaphors instead of transplanting them: bilingual from birth becomes bilingual-complete from creation onward; grandfathered becomes legacy carryover.
- Category nouns take the target language with a first-mention English gloss (cookbook, postmortem); directory or path references stay in code-formatted English.
- Split long paragraphs by semantic unit, one idea per paragraph; expand noun phrases into verbal sentences.
- A native rewrite is not a deletion: every semantic component of the source must land somewhere.
- When a sample conflicts with [terminology.md](terminology.md), the terminology table wins: correct terminology before adopting a sample (for example, agent, mock, and LLM stay in English; cancellation is translated).
- Code-formatted identifiers (event names like `agent/status`, status values like `running`, package names like `cch-bash-local`) keep their verbatim code spans in the translation and must never be paraphrased; Pass 2 must verify them sentence by sentence.
