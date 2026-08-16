import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_CCH_HOME_DISPLAY,
  CCH_HOME_DIR_NAME,
  canonicalizeWatchPath,
  defaultDshHome,
  cchHomeDisplay,
  cchHomePath,
  expandHomePath,
  resolveDshHome,
} from '@coco-harness/cch-home-paths'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('cch path helpers', () => {
  it('owns the shared default DSH home directory name', () => {
    expect(CCH_HOME_DIR_NAME).toBe('.cch')
    expect(DEFAULT_CCH_HOME_DISPLAY).toBe('~/.cch')
    expect(defaultDshHome()).toBe(join(homedir(), '.cch'))
  })

  it('expands tilde paths without changing non-tilde paths', () => {
    expect(expandHomePath('~')).toBe(homedir())
    expect(expandHomePath('~/.cch')).toBe(join(homedir(), '.cch'))
    expect(expandHomePath('~\\.cch')).toBe(join(homedir(), '.cch'))
    expect(expandHomePath('/tmp/.cch')).toBe('/tmp/.cch')
    expect(expandHomePath('~other/.cch')).toBe('~other/.cch')
  })

  it('resolves explicit path before CCH_HOME and the default', () => {
    const envHome = join(homedir(), 'env-cch')

    expect(resolveDshHome('/tmp/explicit-cch', { CCH_HOME: '~/env-cch' })).toBe(resolve('/tmp/explicit-cch'))
    expect(resolveDshHome(undefined, { CCH_HOME: '~/env-cch' })).toBe(envHome)
    expect(resolveDshHome(undefined, {})).toBe(defaultDshHome())
  })

  it('treats an empty or whitespace-only CCH_HOME as unset', () => {
    expect(resolveDshHome(undefined, { CCH_HOME: '' })).toBe(defaultDshHome())
    expect(resolveDshHome(undefined, { CCH_HOME: '   ' })).toBe(defaultDshHome())
  })

  it('joins child segments onto the resolved CCH_HOME', () => {
    vi.stubEnv('CCH_HOME', '~/env-cch')
    expect(cchHomePath()).toBe(join(homedir(), 'env-cch'))
    expect(cchHomePath('storages', 'cache')).toBe(join(homedir(), 'env-cch', 'storages', 'cache'))
  })

  it('labels a resolved home by whether it is the default root', () => {
    expect(cchHomeDisplay(resolve(defaultDshHome()))).toBe('~/.cch')
    expect(cchHomeDisplay('/some/other/root')).toBe('$CCH_HOME')
  })

  it('canonicalizes a watcher ancestor while preserving a missing suffix', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cch-watch-path-'))
    const target = join(root, 'target')
    const alias = join(root, 'alias')
    try {
      await mkdir(target)
      await symlink(target, alias, process.platform === 'win32' ? 'junction' : 'dir')
      await expect(canonicalizeWatchPath(join(alias, 'later', 'config.yml'))).resolves.toBe(
        join(await realpath(target), 'later', 'config.yml'),
      )
      const file = join(root, 'file')
      await writeFile(file, 'not a directory')
      await expect(canonicalizeWatchPath(join(file, 'child'))).rejects.toMatchObject({ code: 'ENOTDIR' })
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
