import assert from 'node:assert/strict'

const DESKTOP_WIDTH = 1440
const NAV_CONTENT_WIDTH = 1280
const MOBILE_WIDTH = 390

function closeTo(actual, expected, label) {
  assert.ok(
    Math.abs(actual - expected) < 0.75,
    `${label}: expected ${expected}, received ${actual}`,
  )
}

async function readSharedShell(page) {
  return page.evaluate(() => {
    const nav = document.querySelector('.toolbox-nav')
    const navInner = document.querySelector('.toolbox-nav-inner')
    const brand = document.querySelector('.toolbox-nav-brand-btn')
    const footer = document.querySelector('.toolbox-footer')
    const rect = (element) => element?.getBoundingClientRect().toJSON() ?? null

    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      navCount: document.querySelectorAll('.toolbox-nav').length,
      navRect: rect(nav),
      navInnerRect: rect(navInner),
      brandRect: rect(brand),
      hamburgerCount: document.querySelectorAll('.toolbox-nav-hamburger').length,
      footerCount: document.querySelectorAll('.toolbox-footer').length,
      footerDirection: footer ? getComputedStyle(footer).flexDirection : null,
    }
  })
}

export async function assertDesktopSharedShell(page) {
  const state = await readSharedShell(page)
  assert.equal(state.viewportWidth, DESKTOP_WIDTH)
  assert.equal(state.navCount, 1)
  assert.equal(state.hamburgerCount, 0)
  assert.equal(state.footerCount, 1)
  assert.equal(state.footerDirection, 'row')
  assert.ok(state.documentWidth <= state.viewportWidth)
  assert.ok(state.navRect && state.navInnerRect && state.brandRect)

  closeTo(state.navRect.left, 0, 'desktop NavBar left edge')
  closeTo(state.navRect.width, DESKTOP_WIDTH, 'desktop NavBar width')
  closeTo(state.navInnerRect.width, NAV_CONTENT_WIDTH, 'desktop NavBar content width')
  closeTo(
    state.navInnerRect.left,
    (DESKTOP_WIDTH - NAV_CONTENT_WIDTH) / 2,
    'desktop NavBar centered left edge',
  )
  closeTo(state.brandRect.left, 96, 'desktop Toolbox brand left edge')
}

export async function assertMobileSharedShell(page) {
  const state = await readSharedShell(page)
  assert.equal(state.viewportWidth, MOBILE_WIDTH)
  assert.equal(state.navCount, 1)
  assert.equal(state.hamburgerCount, 0)
  assert.equal(state.footerCount, 1)
  assert.equal(state.footerDirection, 'column')
  assert.ok(state.documentWidth <= state.viewportWidth)
  assert.ok(state.navRect && state.navInnerRect && state.brandRect)

  closeTo(state.navRect.left, 0, 'mobile NavBar left edge')
  closeTo(state.navRect.width, MOBILE_WIDTH, 'mobile NavBar width')
  closeTo(state.navInnerRect.left, 0, 'mobile NavBar content left edge')
  closeTo(state.navInnerRect.width, MOBILE_WIDTH, 'mobile NavBar content width')
  closeTo(state.brandRect.left, 12, 'mobile Toolbox brand left edge')
}

export async function assertAppMarkStyle(page) {
  const state = await page.evaluate(() => {
    const mark = document.querySelector('.toolbox-app-mark')
    const icon = mark?.querySelector('.toolbox-app-icon')
    if (!mark || !icon) return null
    const markStyle = getComputedStyle(mark)
    return {
      count: document.querySelectorAll('.toolbox-app-mark').length,
      width: mark.getBoundingClientRect().width,
      height: mark.getBoundingClientRect().height,
      borderRadius: markStyle.borderRadius,
      borderWidth: markStyle.borderTopWidth,
      backgroundColor: markStyle.backgroundColor,
      backgroundImage: markStyle.backgroundImage,
      boxShadow: markStyle.boxShadow,
      iconWidth: icon.getBoundingClientRect().width,
      iconHeight: icon.getBoundingClientRect().height,
    }
  })

  assert.ok(state, 'missing canonical .toolbox-app-mark with an application icon')
  assert.ok(state.count >= 1)
  closeTo(state.width, 40, 'application mark width')
  closeTo(state.height, 40, 'application mark height')
  closeTo(state.iconWidth, 24, 'application icon width')
  closeTo(state.iconHeight, 24, 'application icon height')
  assert.equal(state.borderRadius, '12px')
  assert.equal(state.borderWidth, '0px')
  assert.equal(state.backgroundImage, 'none')
  assert.notEqual(state.backgroundColor, 'rgba(0, 0, 0, 0)')
  assert.equal(state.boxShadow, 'none')
}

async function readPreferenceState(page) {
  return page.evaluate(() => ({
    lang: document.documentElement.lang.toLowerCase().startsWith('zh') ? 'zh' : 'en',
    theme: document.documentElement.getAttribute('data-theme'),
  }))
}

async function selectLanguage(page, target) {
  const button = page.locator('.toolbox-nav-lang')
  assert.equal(await button.count(), 1)
  await button.click()

  const menu = page.locator('.toolbox-nav-language-menu')
  await menu.waitFor({ state: 'visible' })
  const chineseLabel = menu.locator('[data-lang="zh"] .toolbox-nav-language-label')
  const englishLabel = menu.locator('[data-lang="en"] .toolbox-nav-language-label')
  assert.equal(await chineseLabel.count(), 1)
  assert.equal(await englishLabel.count(), 1)
  assert.equal((await chineseLabel.textContent()).trim(), '中文（简体）')
  assert.equal((await englishLabel.textContent()).trim(), 'English')
  assert.equal(
    await menu.locator('[role="menuitemradio"][aria-checked="true"]').count(),
    1,
  )

  const option = menu.locator(`[data-lang="${target}"]`)
  assert.equal(await option.count(), 1)
  await option.click()
  await page.waitForFunction(
    (language) => document.documentElement.lang.toLowerCase().startsWith(language),
    target,
  )
}

async function toggleTheme(page, previousTheme) {
  const button = page.locator('.toolbox-nav-theme')
  assert.equal(await button.count(), 1)
  await button.click()
  await page.waitForFunction(
    (theme) => document.documentElement.getAttribute('data-theme') !== theme,
    previousTheme,
  )
}

export async function assertSharedPreferenceMatrix(page, assertSurface) {
  const initial = await readPreferenceState(page)
  assert.ok(initial.theme === 'dark' || initial.theme === 'light')
  const alternateLanguage = initial.lang === 'zh' ? 'en' : 'zh'
  const alternateTheme = initial.theme === 'dark' ? 'light' : 'dark'

  const assertState = async (expected) => {
    assert.deepEqual(await readPreferenceState(page), expected)
    if (assertSurface) await assertSurface(expected)
  }

  await assertState(initial)

  await selectLanguage(page, alternateLanguage)
  await assertState({
    lang: alternateLanguage,
    theme: initial.theme,
  })

  await toggleTheme(page, initial.theme)
  await assertState({
    lang: alternateLanguage,
    theme: alternateTheme,
  })

  await selectLanguage(page, initial.lang)
  await assertState({
    lang: initial.lang,
    theme: alternateTheme,
  })

  await toggleTheme(page, alternateTheme)
  await assertState(initial)
}
