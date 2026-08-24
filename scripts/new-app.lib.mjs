const RESERVED_IDS = new Set([
  'homepage',
  'apps',
  'packages',
  'docs',
  'deploy',
  'config',
  'scripts',
])

export function validateId(id) {
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(id)) {
    return 'must be kebab-case (lowercase letters, digits, hyphens)'
  }
  if (id.length > 40) {
    return 'must be at most 40 characters'
  }
  if (RESERVED_IDS.has(id)) {
    return 'is a reserved id'
  }
  return null
}

export function displayName(id, override) {
  if (override) return override
  return id
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function smokePort(id) {
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.codePointAt(0)) >>> 0
  return 21000 + (hash % 9000)
}

export function manifestEntry(id, name) {
  return `  defineApp({
    id: '${id}',
    path: '/${id}/',
    name: '${name}',
    navLabel: { zh: '${name}', en: '${name}' },
    description: { zh: '${name}（补充一句中文说明）', en: '${name} (one-line English description)' },
    keywords: {
      zh: ['关键词'],
      en: ['keyword'],
    },
    icon: {
      viewBox: '0 0 48 48',
      svg: '<rect x="8" y="8" width="32" height="32" rx="6"/><path d="M16 24h16M24 16v16"/>',
    },
    status: 'hidden',
  }),
`
}

export function insertManifestEntry(source, entry) {
  const marker = '\n])\n'
  const cut = source.lastIndexOf(marker)
  if (cut < 0) {
    throw new Error('manifest.js does not end with the expected TOOLBOX_APPS terminator')
  }
  return source.slice(0, cut + 1) + entry + source.slice(cut + 1)
}

function readmeEn(id, name) {
  return `# ${name}

## Brief

\`\`\`yaml
id: ${id}
route: /${id}/
problem: (describe the user problem this tool solves)
inputs: (what the user provides)
outputs: (what the tool returns)
assumptions: (assumptions that change results)
privacy: pure client-side; no network requests; no account or backend
offline_fallback: fully offline by default
non_goals: (what this first version deliberately does not do)
acceptance:
  - (verifiable result 1)
  - (verifiable result 2)
\`\`\`

## Usage

(Fill in after the first working screen.)

## Privacy

All computation stays in the browser. The app issues no external requests,
stores private state only under \`toolbox.${id}.*\`, and reads only the shared
\`toolbox-theme\` / \`toolbox-lang\` preference keys.

## Development

\`\`\`bash
pnpm install
pnpm --filter=@toolbox/${id} dev
pnpm --filter=@toolbox/${id} build
pnpm --filter=@toolbox/${id} test
pnpm --filter=@toolbox/${id} test:browser
pnpm --filter=@toolbox/${id} lint
\`\`\`
`
}

function readmeZh(id, name) {
  return `# ${name}

## Brief（产品契约）

\`\`\`yaml
id: ${id}
route: /${id}/
problem: （描述工具解决的用户问题）
inputs: （用户输入）
outputs: （工具输出）
assumptions: （会改变结果的假设）
privacy: 纯客户端；无网络请求；无账号或后端
offline_fallback: 默认完全离线可用
non_goals: （首版明确不做的内容）
acceptance:
  - （可验证结果 1）
  - （可验证结果 2）
\`\`\`

## 使用说明

（首个可用界面完成后补充。）

## 隐私

所有计算都在浏览器本地完成。应用不发起外部请求，私有状态只写入
\`toolbox.${id}.*\`，仅读写共享的 \`toolbox-theme\` / \`toolbox-lang\` 偏好键。

## 开发

命令与英文版一致，见 [README.md](./README.md)。
`
}

function sharedFiles(id, name) {
  const port = smokePort(id)
  return [
    {
      path: 'LICENSE',
      content: `MIT License\n\nCopyright (c) 2026 Stepania H\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.\n`,
    },
    {
      path: 'README.md',
      content: readmeEn(id, name),
    },
    {
      path: 'README.zh-CN.md',
      content: readmeZh(id, name),
    },
    {
      path: 'tests/app.test.mjs',
      content: `import assert from 'node:assert/strict'
import test from 'node:test'
import { getAppById } from '@toolbox/app-manifest'

const app = getAppById('${id}')

test('manifest registers the hidden tool with bilingual search keywords', () => {
  assert.ok(app)
  assert.equal(app.status, 'hidden')
  assert.equal(app.path, '/${id}/')
  assert.ok(app.keywords.zh.length > 0)
  assert.ok(app.keywords.en.length > 0)
})

test('private storage keys stay inside the toolbox.${id} namespace', () => {
  // Enforced again by pnpm check:contracts across the workspace.
  assert.match(\`toolbox.${id}.example\`, /^toolbox\\.${id}\\./)
})
`,
    },
    {
      path: 'tests/browser-smoke.mjs',
      content: `import assert from 'node:assert/strict'
import { assertDesktopSharedShell, assertMobileSharedShell, assertSharedPreferenceMatrix } from '@toolbox/nav/browser-contract.mjs'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const appRoot = fileURLToPath(new URL('../', import.meta.url))
const viteCli = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const port = process.env.SMOKE_PORT ?? '${port}'
const previewUrl = \`http://127.0.0.1:\${port}/${id}/\`
const preview = spawn(
  process.execPath,
  [viteCli, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
  {
    cwd: appRoot,
    env: { ...process.env, NO_COLOR: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
)

async function waitForPreview() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(previewUrl)
      if (response.ok) return
    } catch {
      // The production preview has not started listening yet.
    }
    await delay(100)
  }
  throw new Error('preview did not start')
}

async function stopPreview() {
  if (preview.exitCode !== null) return
  preview.kill('SIGTERM')
  await Promise.race([once(preview, 'exit'), delay(2000)])
  if (preview.exitCode === null) preview.kill('SIGKILL')
}

let browser
try {
  await waitForPreview()
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
  const runtimeFailures = []
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      runtimeFailures.push(\`console \${message.type()}: \${message.text()}\`)
    }
  })
  page.on('pageerror', (error) => runtimeFailures.push(\`pageerror: \${error.message}\`))

  const assertAppSurface = async () => {
    assert.equal(await page.locator('main.page').count(), 1)
    const heading = await page.locator('h1').first().textContent()
    assert.ok(heading && heading.trim().length > 0)
  }

  await page.goto(previewUrl, { waitUntil: 'networkidle' })
  await assertDesktopSharedShell(page)
  await assertSharedPreferenceMatrix(page, assertAppSurface)

  await page.setViewportSize({ width: 390, height: 844 })
  await assertMobileSharedShell(page)
  await assertSharedPreferenceMatrix(page, assertAppSurface)

  assert.deepEqual(runtimeFailures, [])
  console.log('[browser-smoke] ${name} production shell passed')
} finally {
  await browser?.close()
  await stopPreview()
}
`,
    },
  ]
}

export function vanillaFiles(id, name) {
  return [
    ...sharedFiles(id, name),
    {
      path: 'package.json',
      content: JSON.stringify(
        {
          name: `@toolbox/${id}`,
          version: '0.0.0',
          private: true,
          type: 'module',
          scripts: {
            dev: 'vite --host 127.0.0.1',
            build: 'vite build',
            preview: 'vite preview --host 127.0.0.1',
            test: 'vite build && node --test tests/*.test.mjs',
            'test:browser': 'vite build && node tests/browser-smoke.mjs',
            lint: 'oxlint --deny-warnings',
          },
          dependencies: {
            '@toolbox/app-manifest': 'workspace:*',
            '@toolbox/i18n': 'workspace:*',
            '@toolbox/nav': 'workspace:*',
            '@toolbox/theme': 'workspace:*',
          },
          devDependencies: {
            oxlint: '^1.73.0',
            playwright: '^1.61.0',
            vite: 'catalog:',
          },
        },
        null,
        2,
      ) + '\n',
    },
    {
      path: 'vite.config.js',
      content: `import { defineConfig } from 'vite'\n\nexport default defineConfig({\n  base: '/${id}/',\n  build: {\n    outDir: 'dist',\n  },\n})\n`,
    },
    {
      path: 'tsconfig.json',
      content: JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            lib: ['ES2022', 'DOM', 'DOM.Iterable'],
            module: 'ESNext',
            moduleResolution: 'bundler',
            strict: true,
            skipLibCheck: true,
            noEmit: true,
            types: ['vite/client'],
          },
          include: ['src'],
        },
        null,
        2,
      ) + '\n',
    },
    {
      path: 'index.html',
      content: `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
    <script>
      (function () {
        try {
          var k = 'toolbox-theme'
          var t = localStorage.getItem(k)
          if (t !== 'light' && t !== 'dark') {
            t = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
          }
          document.documentElement.setAttribute('data-theme', t)
        } catch (e) {
          document.documentElement.setAttribute('data-theme', 'dark')
        }
      })()
    </script>
  </head>
  <body>
    <div id="toolbox-nav"></div>
    <main class="page">
      <h1>${name}</h1>
      <p class="lede">（Replace with the tool's own first screen.)</p>
    </main>
    <footer data-toolbox-footer="${id}"></footer>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'src/main.ts',
      content: `import '@toolbox/theme/styles.css'
import '@toolbox/theme/toggle.js'
import '@toolbox/nav/nav-bar.css'
import '@toolbox/nav/nav-bar.js'
import { getLang, setLang } from '@toolbox/i18n/core'
import { autoMountToolboxFooters } from '@toolbox/nav/toolbox-footer.js'
import './styles.css'

document.addEventListener('DOMContentLoaded', () => {
  autoMountToolboxFooters()
  setLang(getLang())
})
`,
    },
    {
      path: 'src/styles.css',
      content: `/* Layout belongs to the tool; palette, typography and radii come from @toolbox/theme. */

.page {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px;
}

.page h1 {
  color: var(--color-text);
}

.lede {
  color: var(--color-text-muted);
}
`,
    },
  ]
}

export function reactFiles(id, name) {
  return [
    ...sharedFiles(id, name),
    {
      path: 'package.json',
      content: JSON.stringify(
        {
          name: `@toolbox/${id}`,
          version: '0.0.0',
          private: true,
          type: 'module',
          scripts: {
            dev: 'vite --host 127.0.0.1',
            build: 'vite build',
            preview: 'vite preview --host 127.0.0.1',
            test: 'vite build && node --test tests/*.test.mjs',
            'test:browser': 'vite build && node tests/browser-smoke.mjs',
            lint: 'oxlint --deny-warnings',
          },
          dependencies: {
            '@toolbox/app-manifest': 'workspace:*',
            '@toolbox/i18n': 'workspace:*',
            '@toolbox/nav': 'workspace:*',
            '@toolbox/theme': 'workspace:*',
            '@vitejs/plugin-react': 'catalog:',
            react: 'catalog:',
            'react-dom': 'catalog:',
          },
          devDependencies: {
            '@types/react': '^19.2.17',
            '@types/react-dom': '^19.2.3',
            oxlint: '^1.73.0',
            playwright: '^1.61.0',
            typescript: 'catalog:',
            vite: 'catalog:',
          },
        },
        null,
        2,
      ) + '\n',
    },
    {
      path: 'vite.config.mjs',
      content: `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  base: process.env.NODE_ENV === 'production' ? '/${id}/' : '/',\n  plugins: [react()],\n})\n`,
    },
    {
      path: 'tsconfig.json',
      content: JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            lib: ['ES2022', 'DOM', 'DOM.Iterable'],
            module: 'ESNext',
            moduleResolution: 'bundler',
            jsx: 'react-jsx',
            strict: true,
            skipLibCheck: true,
            noEmit: true,
            types: ['vite/client'],
          },
          include: ['src'],
        },
        null,
        2,
      ) + '\n',
    },
    {
      path: 'index.html',
      content: `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
    <script>
      (function () {
        try {
          var k = 'toolbox-theme'
          var t = localStorage.getItem(k)
          if (t !== 'light' && t !== 'dark') {
            t = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
          }
          document.documentElement.setAttribute('data-theme', t)
        } catch (e) {
          document.documentElement.setAttribute('data-theme', 'dark')
        }
      })()
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    },
    {
      path: 'src/main.tsx',
      content: `import React from 'react'
import { createRoot } from 'react-dom/client'
import '@toolbox/theme/styles.css'
import '@toolbox/theme/toggle.js'
import { I18nProvider } from '@toolbox/i18n/react'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider translations={{}}>
      <App />
    </I18nProvider>
  </React.StrictMode>,
)
`,
    },
    {
      path: 'src/App.tsx',
      content: `import { NavBar } from '@toolbox/nav'
import { ToolboxFooter } from '@toolbox/nav/ToolboxFooter.tsx'
import '@toolbox/nav/nav-bar.css'

export default function App() {
  return (
    <>
      <NavBar currentApp="${id}" />
      <main className="page">
        <h1>${name}</h1>
        <p className="lede">Replace with the tool's own first screen.</p>
      </main>
      <ToolboxFooter appId="${id}" />
    </>
  )
}
`,
    },
    {
      path: 'src/styles.css',
      content: `/* Layout belongs to the tool; palette, typography and radii come from @toolbox/theme. */

.page {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px;
}

.page h1 {
  color: var(--color-text);
}

.lede {
  color: var(--color-text-muted);
}
`,
    },
  ]
}

