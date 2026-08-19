# Agent Note: Attribute DeepSeek creation and the dsh former name in project docs

Status: implemented

## Problem

The root README credited DeepSeek AI as the project's current developer, and the third-party memory example's disclaimer named DeepSeek as the non-endorsing party. The project was initially created by DeepSeek as DeepSeek Harness (`dsh`) and is now developed and maintained by this repository's maintainers, so both statements misattributed current stewardship, and the former name `dsh` appeared nowhere in the documentation.

## Decision

The root README owns the provenance fact in one sentence: Coco Harness (`cch`) is an open-source agent harness, initially created by DeepSeek AI under the name DeepSeek Harness (`dsh`), now developed and maintained in this repository as Coco Harness. Endorsement disclaimers in example documentation name the Coco Harness maintainers as the deciding party. The LICENSE copyright line stays with DeepSeek, which holds the copyright to what it created.

## Alternatives considered

**Keep DeepSeek as the named developer.** Credit for current development belongs to the maintainers who develop it; DeepSeek's contribution is creation, which the provenance sentence states.

**Repeat the provenance sentence in every self-describing document.** One home per fact: the README is the documentation entry point, and other documents already speak as the current maintainers without restating project history.

**Characterize the handover as a fork or rename.** The repository records no transfer mechanism, so the docs state creation and current stewardship only.

## Consequences

Readers learn the project's origin and former name (`dsh`) from the README alone; searches for "DeepSeek Harness" land on an accurate attribution instead of an absent or misleading one. Any additional copyright line for later contributions is a separate maintainer decision, not part of this attribution change.
