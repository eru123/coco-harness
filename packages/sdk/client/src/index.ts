/**
 * TypeScript client SDK for the Coco Harness runtime: spawn the
 * `cch-jsonrpc-agent` runtime as a subprocess and drive agent turns over
 * stdio JSON-RPC. `CocoHarness` is the high-level run API;
 * `HarnessClient` is the lower-level protocol client. A pure library — it
 * registers nothing on a Cordis context; the runtime process it spawns is a
 * complete harness configured by its own `cordis.yml`.
 *
 * @module @coco-harness/cch-sdk-client
 */

export { CocoHarness, HarnessSession } from './api.ts'
export type { RunOptions } from './api.ts'
export {
  HarnessClient,
  RequestTimeoutError,
  SdkProtocolError,
  TransportClosedError,
} from './client.ts'
export type { NotificationSubscription } from './client.ts'
export { JsonRpcResponseError } from '@coco-harness/cch-sdk-protocol'
export type {
  ContentBlock,
  CocoHarnessOptions,
  HarnessClientOptions,
  HarnessNotification,
  NotificationFilter,
  RunResult,
} from './types.ts'
