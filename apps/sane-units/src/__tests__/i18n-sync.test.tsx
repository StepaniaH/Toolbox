// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { createElement, act } from 'react'
import { setLang as setCoreLang, getLang } from '@toolbox/i18n/core'
import { LanguageProvider, useTranslation } from '../lib/i18n'

// A minimal consumer that surfaces the provider's lang + setLang so tests can
// drive and assert on the language-bridge behaviour.
function Probe() {
  const { lang, setLang } = useTranslation()
  return createElement(
    'div',
    null,
    createElement('span', { 'data-testid': 'lang' }, lang),
    createElement(
      'button',
      {
        'data-testid': 'toggle',
        onClick: () => setLang(lang === 'zh-CN' ? 'en' : 'zh-CN'),
      },
      'toggle',
    ),
  )
}

describe('SaneUnits LanguageProvider — @toolbox/i18n core同步', () => {
  beforeEach(() => {
    localStorage.clear()
    act(() => setCoreLang('zh'))
  })

  afterEach(() => {
    cleanup()
  })

  it('初始化时用 core 的 getLang() 而非 saneunits.lang', () => {
    act(() => setCoreLang('en'))
    render(createElement(LanguageProvider, null, createElement(Probe)))
    expect(screen.getByTestId('lang').textContent).toBe('en')
  })

  it('NavBar 语言按钮（core setLang）触发后页面语言切换生效', () => {
    render(createElement(LanguageProvider, null, createElement(Probe)))
    expect(screen.getByTestId('lang').textContent).toBe('zh-CN')

    // 模拟 NavBar 语言按钮调用 core 的 setLang('en')
    act(() => setCoreLang('en'))
    expect(screen.getByTestId('lang').textContent).toBe('en')

    // 切回中文也应同步
    act(() => setCoreLang('zh'))
    expect(screen.getByTestId('lang').textContent).toBe('zh-CN')
  })

  it('setLang API 同步到 core（NavBar 可见）', () => {
    render(createElement(LanguageProvider, null, createElement(Probe)))
    expect(getLang()).toBe('zh')

    // 模拟业务消费者调用 provider API
    act(() => screen.getByTestId('toggle').click())
    expect(screen.getByTestId('lang').textContent).toBe('en')
    // core 也应同步到 'en'，这样 NavBar 的语言按钮状态会跟着变
    expect(getLang()).toBe('en')
  })

  it('不再使用旧的 saneunits.lang localStorage key', () => {
    render(createElement(LanguageProvider, null, createElement(Probe)))
    act(() => screen.getByTestId('toggle').click())
    // 改用共享的 toolbox-lang key
    expect(localStorage.getItem('toolbox-lang')).toBe('en')
    // 旧的 saneunits.lang 不应再被写入
    expect(localStorage.getItem('saneunits.lang')).toBeNull()
  })

  it('t() 跟随 core 语言切换返回对应语言文案', () => {
    function Reader() {
      const { t } = useTranslation()
      return createElement('span', { 'data-testid': 'lead' }, String(t('home.heroLead')))
    }
    render(
      createElement(LanguageProvider, null, createElement(Reader)),
    )
    // 初始为中文
    expect(screen.getByTestId('lead').textContent).toContain('不糊弄人的')
    // 模拟 NavBar 切英文后，t() 应返回英文文案
    act(() => setCoreLang('en'))
    expect(screen.getByTestId('lead').textContent).toBe(
      `A unit converter and reality-estimation tool that doesn't hide the messy details. It gives you the answer and explains the units, formulas, and real-world losses.`,
    )
  })
})
