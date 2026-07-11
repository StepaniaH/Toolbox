import { afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from '@/App'
import { I18nWrapper } from './i18n-test-utils'

describe('App smoke', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('automatically requests a disclosed live rate and asks for manual input on failure', async () => {
    const fetchSpy = vi.fn(async () => {
      throw new Error('offline')
    })
    vi.stubGlobal('fetch', fetchSpy)

    render(<App />, { wrapper: I18nWrapper })
    // Header title (heading)
    expect(
      screen.getByRole('heading', { name: 'RateLens' }),
    ).toBeInTheDocument()
    // Mode switcher labels
    expect(screen.getByText('倍率正算')).toBeInTheDocument()
    expect(screen.getByText('扣费反推')).toBeInTheDocument()
    // Glossary trigger
    expect(screen.getByText('名词解释')).toBeInTheDocument()
    // Funding input placeholders (two of them)
    expect(screen.getAllByPlaceholderText('例如 100').length).toBeGreaterThanOrEqual(1)
    // Translation keys may not contain numeric dot segments that leak into the UI.
    expect(screen.getByRole('button', { name: '倍率 0.6' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '倍率 1.1' })).toBeInTheDocument()
    expect(screen.queryByText('preset.rate0.6')).not.toBeInTheDocument()
    expect(screen.queryByText('preset.rate1.1')).not.toBeInTheDocument()
    expect(screen.getByText(/页面打开后会自动连接第三方公开汇率服务/)).toBeInTheDocument()
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2))
    expect(
      await screen.findByText(/自动获取实时汇率失败，请填写当前 USD\/CNY 汇率后继续/),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('spinbutton', { name: 'USD/CNY 汇率' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重新获取实时汇率' })).toBeInTheDocument()
  })
})
