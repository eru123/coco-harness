import { Service } from '@coco-harness/cordis'

/** Service whose public annotations are intentionally absent. */
export class WritableService extends Service {
  value = 1

  echo(input = 'value') {
    return input
  }
}

declare module '@coco-harness/cordis' {
  interface Context {
    writable: WritableService
  }
}

export default WritableService
