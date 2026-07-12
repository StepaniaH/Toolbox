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
