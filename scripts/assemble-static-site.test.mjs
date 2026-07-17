import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { getStableApps } from '../packages/app-manifest/manifest.js'
import {
  STATIC_ROUTE_FALLBACKS,
  assembleStaticSite,
  auditStaticSite,
} from './assemble-static-site.mjs'

test('assembles every stable app into one public static site', () => {
  const temporaryRoot = mkdtempSync(join(tmpdir(), 'toolbox-static-site-test-'))
  const outputDirectory = join(temporaryRoot, 'site')

  try {
    const result = assembleStaticSite(outputDirectory)
    assert.ok(result.fileCount > getStableApps().length)
    assert.ok(result.totalBytes > 0)
    assert.equal(existsSync(join(outputDirectory, 'index.html')), true)

    for (const app of getStableApps()) {
      const appRoot = app.path === '/' ? outputDirectory : join(outputDirectory, app.id)
      assert.equal(existsSync(join(appRoot, 'index.html')), true, `${app.id} index is missing`)
    }

    for (const [appId, routes] of Object.entries(STATIC_ROUTE_FALLBACKS)) {
      const canonicalIndex = readFileSync(join(outputDirectory, appId, 'index.html'))
      for (const route of routes) {
        const routeIndex = join(outputDirectory, appId, route, 'index.html')
        assert.equal(existsSync(routeIndex), true, `${appId}/${route} fallback is missing`)
        assert.deepEqual(readFileSync(routeIndex), canonicalIndex)
      }
    }

    assert.deepEqual(auditStaticSite(outputDirectory), result)
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true })
  }
})
