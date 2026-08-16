# Terminology

This table fixes the unified English-Chinese renderings for this repository's terminology.

**General rules:**
- The "Chinese" column is the default in-prose wording for Chinese text. When that column holds English, the English term is kept untranslated in Chinese prose.
- Write the first occurrence per the "First mention" column (with its parenthetical gloss); later occurrences use only the part before the parenthetical gloss (which may be Chinese or English), without the gloss.
- The "Do not translate as" column lists strictly forbidden renderings.
- If a term has already been glossed as part of another term (for example, an `agent loop` first mention that already glosses `agent`), it needs no separate gloss when it later appears alone.

## Abbreviations (abbreviated in both English and Chinese text)

| English | Chinese | First mention | Do not translate as | Notes |
|---|---|---|---|---|
| ACP | ACP | ACP (Agent Client Protocol) | | |
| AI | AI | AI (artificial intelligence) | | |
| API | API | | | |
| CI | CI | | | |
| CLI | CLI | CLI (command-line interface) | | |
| e2e | e2e | | | |
| HMR | HMR | HMR (hot module replacement) | | |
| JSON Schema | JSON Schema | | | |
| JSONL | JSONL | | | |
| LLM | LLM | LLM (large language model) | | |
| MCP | MCP | | | |
| PR | PR | PR (Pull Request) | | |
| RAG | RAG | RAG (retrieval-augmented generation) | | |
| SDK | SDK | | | Refers only to the JSON-RPC client/server protocol used by the supported Python and TypeScript SDKs; the Coco Harness project itself is not an SDK |
| SSE | SSE | SSE (Server-Sent Events) | | |

## English-kept terms (English in both English and Chinese text)

| English | Chinese | First mention | Do not translate as | Notes |
|---|---|---|---|---|
| agent | agent | agent | | |
| Agent Note | Agent Note | | glossed renderings of the name | A repository-defined document type covering proposals, implemented decisions, and rejected proposals; the Chinese counterpart H1 keeps the fixed prefix `# Agent Note: ` with no term gloss in the heading |
| agent harness | agent harness | agent harness | | Agent compounds (agent harness/workflow/loop/skill and the like) stay in English as a whole; when agent itself has not yet been glossed, the first mention follows the compound's row or the agent row |
| agent loop | agent loop | agent loop | | |
| blob hash | blob hash | | | The result of `git hash-object` |
| coding agent | coding agent | coding agent | | An agent compound; kept in English in prose |
| Cordis | Cordis | | | |
| dispose | dispose | dispose (resource release) | | |
| doc-sync | doc-sync | doc-sync (documentation sync gate) | | |
| fiber | fiber | | | |
| fixture | fixture | fixture | | |
| fork | fork | | | |
| Function Calling | Function Calling | Function Calling (function calling) | | |
| harness | harness | | | |
| harness engineering | harness engineering | | | |
| KV Cache | KV Cache | | | Proper technical name; keep the casing and the space |
| lint | lint | | | |
| mock | mock | | | Kept in English; refers to a test double |
| loader | loader | | | |
| manifest | manifest | manifest | | |
| monorepo | monorepo | | | |
| Round | Round | | turn; goal turn; Ralph turn | When the outer policy uses Rounds, the domain hierarchy is Session > Round > Turn > Step; a Round is an optional outer policy iteration, not a generic level every session turn has. Goal Round and Ralph Round stay in English. One Round carries one turn, and steps belong to that turn; an explicit zero-step Round keeps its meaning. |
| schema | schema | | | |
| schema DSL | schema DSL | | | |
| seam | seam | | joint | A whole replaceable capability comprising the three roles Service Definition / Service Provider / Consumer; split into separate packages only when the roles must evolve independently, and one package may play several roles. `packages/shell` is the reference example; a Service Definition is a Cordis `Service` (abstract class or concrete registry service), not a TypeScript interface. No single role, ordinary boundary, or extension point may be called a seam. This repository keeps the word in English in prose; it is a different concept from `extension point` |
| Service Provider | Service Provider | | Service provider | The named role of a capability seam; the singular is always written Service Provider and the plural Service Providers. Does not apply to providers of services in the generic sense |
| skill | skill | skill | | |
| slot | slot | | pit, hole (literal renderings) | A named registrable position in the client architecture; kept in English |
| spill | spill | | | The mechanism that spills oversized tool output to disk; compounds are written as `spill file` and `spill path` |
| spawn | spawn | | | |
| steering | steering | steering (mid-run guidance) | | |
| job id | job id | | task id | Kept in English |
| subagent | subagent | | | |
| transcript | transcript | transcript | | The complete text a session renders to the user or editor, as distinct from the event log |
| Typert | Typert | | TypeRT, typeRT, Type RT | The product spelling for Coco Harness's type graph, generator, loader, and runtime registry |
| waterfall | waterfall | waterfall | | |
| wheel | wheel package | | | Python packaging format |
| worktree | worktree | | | A git working-tree concept |
| Zstandard | Zstandard | | | RFC 8878 compression format; `zstd` remains a code value. |

## Translated terms (each language uses its own word)

| English | Chinese | First mention | Do not translate as | Notes |
|---|---|---|---|---|
| adapter | adapter | | | |
| adapter contract | adapter contract | adapter contract | | |
| append-only | append-only | | | |
| artifact | artifact | | product (manufactured-goods sense) | |
| backend | backend | | | |
| binder | binder | | | Named role: binds a declared interface to the caller's context or lifecycle |
| config | config | | | Named role: a single resolved configuration value or a strictly bounded configuration record |
| controller | controller | | | Named role: accepts intent and changes an existing domain or presentation state |
| directory | directory | | | Named role: exposes entries and metadata for discovery or selection |
| engine | engine | | | Named role: implements a domain algorithm or a stateful execution model |
| gateway | gateway | | | Named role: adapts a process, network, RPC, or API boundary |
| handle | handle | | | Named role: references and controls or observes a live resource |
| policy | policy | | | Named role: decides what is allowed, selected, restricted, or observed |
| presenter | presenter | | | Named role: purely transforms domain values into render intent |
| resolver | resolver | | | Named role: computes or locates an answer from input |
| store | store | | | Named role: owns a set of data and primarily provides data operations |
| background job | background job | | | |
| block | block | | | |
| build target | build target | | | |
| cancel | cancel | | | |
| canary test | canary test | | canary-bird test | This repo keeps `canary` |
| capability | capability | | | Must be distinguished from `feature` |
| capability seam | capability seam | | feature seam, capability joint | This repository's named architectural concept for a complete replaceable capability composed of the three roles Service Definition, Service Provider, and Consumer; a plain `seam` still follows its own row |
| feature | feature | | capability | A manageable product unit in the SDK product and engineering model |
| feature option | feature option | | variant | A limited, selectable implementation or configuration within one SDK feature |
| checkpoint | checkpoint | | | |
| chunk | chunk | | | |
| compaction | compaction | compaction | | |
| companion tool | companion tool | | | |
| composition bundle | composition bundle | | | Constrains only the application/plugin composition context, not every use of `bundle` |
| Cordis plugin config | Cordis plugin config | | | The `Config` object or configuration shape a Cordis plugin exposes |
| config key | config key | | | A single field in a Cordis plugin config |
| consumer | consumer | | consumer (person sense) | |
| content block | content block | | | |
| Cookbook | cookbook | | | Document-title usage |
| context | context | | | |
| counterpart | counterpart | | corresponding object, paired object | Bilingual-pairing context; a generic "the other side" may be used for the non-pairing sense |
| configurable-provider directory | configurable-provider directory | | | The directory maintained by `registerConfigurableProviders()` in the llm seam; follows the Service Catalog → service catalog precedent |
| context compaction | context compaction | context compaction | | |
| contract | contract | | | For example, `pairing contract` |
| Cordis config entry | Cordis config entry | | | One entry in the `cordis.yml` plugin list; a plugin implementation is written as a Cordis plugin |
| Cordis plugin | Cordis plugin | | | A plugin implementation loaded by Cordis, not an entry in `cordis.yml` |
| crash recovery | crash recovery | | | |
| deploy root | deploy root | | | |
| dormant | dormant | | sleeping, hibernating | Refers to a provider that is declared as configurable but has no route currently registered |
| durability | durability | | | |
| feature requirement | feature dependency | | | The relationship a feature or feature option declares via `requires` |
| event | event | | | |
| event log | event log | | | |
| event stream | event stream | | | |
| event-sourced | event-sourced | | | Follows the rendering customary in the DDD community |
| Executive summary | executive summary | | | Postmortem heading usage |
| executor | executor | | | |
| expected output | expected output | | gold standard | Refers to the snapshot comparison artifact; human-calibrated translation samples are not covered |
| extension | extension | | | |
| extension point | extension point | | | Take care to distinguish from `seam` |
| fail-fast | fail-fast | | | |
| fenced code block | fenced code block | | | Follows the MDN Chinese translation |
| fingerprint | fingerprint | | | A generic content fingerprint; the bilingual pairing mechanism uses a sidecar record to record both sides' blob hashes |
| finish reason | finish reason | | | |
| fold | fold | | | Configuration-UI context: a field section collapsed by default |
| foreground run | foreground run | | | |
| freshness | freshness | | | Follows the MDN Chinese translation; in this project it refers to how in sync a translation is with its source |
| hook | hook | | | |
| implementation | implementation | | | |
| inference | inference | inference | | Retain the parenthetical English term when distinguishing from `reasoning` |
| info string | info string | | | Follows the CommonMark Chinese translation; the language annotation after ``` on a code fence |
| injection | injection | | | |
| integration | integration | | | |
| interface | interface | | | |
| language switcher | language switcher | | | i18n pairing term: the mutual-link line at the top of a paired bilingual file |
| merge | merge | | | |
| message | message | | | |
| mod | mod | | | |
| model provider | model provider | | | |
| model selection | model selection | | model target | The agent-facing choice of provider, model, and optional reasoning effort. |
| module | module | | | |
| non-escalation | non-escalation | | non-upgrade, non-upgradable | Security and permission context only: a principal must not gain permissions beyond those already granted; ordinary upgrades do not use this row |
| npm dependency | npm dependency | | | A package relationship in `package.json`; the `dependencies` and `devDependencies` fields stay as is |
| opt-out ratio | opt-out ratio | | opt-out check ratio | |
| orphan | legacy remnant | | orphan (outside the process idiom), isolated | Refers to a `.zh.md` whose English source no longer exists (a legacy translation); in a process context, follow the OS idiom (orphan process) |
| orphan branch | orphan branch | | the literal orphan-word rendering | Follows the official git Chinese translation |
| package | package | | | Refers to an npm package (`@coco-harness/cch-*`); code identifiers like `package.json` stay as is |
| pairing | pairing | | | |
| parent-subset grants | parent-subset grants | | parent-set grants | Grants whose scope is limited to a subset of the parent's own grants |
| peer dependency | peer dependency | peer dependency | | |
| permission | permission | | | |
| persistence | persistence | | | |
| pipeline | pipeline | | | |
| plugin | plugin | | | |
| postmortem | postmortem | postmortem | after-the-fact analysis, incident record | An incident record and analysis document; `postmortem` in directory or path names stays in code form |
| prompt | prompt | | | |
| provider | provider | | | |
| provider-neutral | provider-neutral | | the "neutral" variant | |
| quality gate | quality gate | | | |
| quiescence | quiescence | | silent, static state | The state after all lifecycle work has settled |
| reasoning | reasoning | reasoning | | Retain the parenthetical English term when distinguishing from `inference` |
| reasoning_content | reasoning content | | | |
| registry | registry | | | |
| replay | replay | | | |
| resume | resume | | | |
| runtime | runtime | | | |
| same-world subprocess | same-world subprocess | | the literal same-world rendering | |
| sandbox | sandbox | | | |
| service | service | | | |
| serving interface | serving interface | | | |
| session | session | | | |
| session event | session event | | | |
| setup card | setup card | | | The configuration card expanded directly in place of the row card on first run |
| sidecar file | sidecar file | | | An ordinary companion file in the same directory as the document |
| sidecar record | sidecar record | | side-mounted record | The companion record file in the same directory as the document |
| smoke test | smoke test | | | |
| snapshot | snapshot | | | |
| source of truth | source of truth | | source of facts, sole source | |
| spine | spine | | | |
| stale | stale | | expired | The counterpart of `fresh`; gate output keeps `stale` in English untranslated; `expired` is the rendering for actually expired content |
| step | step | | | |
| stream | stream | | | |
| structural signature | structural signature | | | i18n pairing term: the ordered structure sequence the gate extracts when comparing the two sides (heading levels, code blocks, lists, and so on) |
| Summary | summary | | | Postmortem heading usage |
| system prompt | system prompt | | | |
| taxonomy | taxonomy | | | |
| token usage | token usage | | | |
| tool | tool | | | |
| tool call | tool call | | | |
| tool result | tool result | | | |
| tool schema | tool schema | | | |
| toolkit | toolkit | | | |
| turn | turn | | | |
| VFS | VFS | virtual file system (VFS) | | |
| typecheck | typecheck | | | |
| vocabulary | vocabulary | | | |
| wire format | wire format | wire format | | |
| workflow | workflow | | | |
| wrapper | wrapper | | | A software-layer or SDK wrapper layer |
| wrapper script | wrapper script | | | An executable-script wrapper layer |
