#!/usr/bin/env node

import { Context } from '@coco-harness/cordis'
import { pathToFileURL } from 'node:url'
import Loader from '@coco-harness/cordis-plugin-loader'

const ctx = new Context()
ctx.baseUrl = pathToFileURL(process.cwd()).href + '/'

await ctx.plugin(Loader)
await ctx.loader.create({
  name: '@coco-harness/cordis-plugin-include',
  config: {
    path: './cordis.yml',
  },
})
