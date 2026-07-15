import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { I18nProvider } from '@toolbox/i18n/react'
import userEvent from '@testing-library/user-event'
import App from '../App.tsx'
import zh from '../translations/zh.json'

function renderApp() {
  return render(
    <I18nProvider translations={{ zh, en: zh }}>
      <App />
    </I18nProvider>,
  )
}

describe('CryptoLab app', () => {
  it('renders the header and all tabs', () => {
    renderApp()
    expect(screen.getByRole('heading', { level: 1, name: 'CryptoLab' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(8)
  })

  it('computes Base64 encoding in the Encoding tab', async () => {
    renderApp()
    await userEvent.click(screen.getByRole('tab', { name: '编码' }))
    const input = await screen.findByLabelText('输入')
    await userEvent.clear(input)
    await userEvent.type(input, 'hello')
    await waitFor(() => {
      const output = screen.getByLabelText('输出')
      expect(output).toHaveValue('aGVsbG8=')
    })
  })

  it('computes MD5 hash in the Hash tab', async () => {
    renderApp()
    await userEvent.click(screen.getByRole('tab', { name: '摘要' }))
    const input = await screen.findByPlaceholderText('输入文本，实时计算所有哈希')
    await userEvent.type(input, 'abc')
    await waitFor(() => {
      expect(screen.getByText('900150983cd24fb0d6963f7d28e17f72')).toBeInTheDocument()
    })
  })

  it('decodes a JWT in the JWT tab', async () => {
    renderApp()
    await userEvent.click(screen.getByRole('tab', { name: 'JWT' }))
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    const input = await screen.findByLabelText('JWT Token')
    await userEvent.type(input, token)
    await waitFor(() => {
      expect(screen.getByText(/John Doe/)).toBeInTheDocument()
      expect(screen.getByText(/仅完成解码，尚未验证签名/)).toBeInTheDocument()
    })
  })

  it('separates RSA encryption and signing key purposes', async () => {
    renderApp()
    await userEvent.click(screen.getByRole('tab', { name: 'RSA' }))
    const publicKey = await screen.findByLabelText('公钥 (PEM)')
    await userEvent.type(publicKey, 'temporary key material')
    await userEvent.click(screen.getByRole('button', { name: '密钥用途' }))
    await userEvent.click(screen.getByRole('button', { name: 'PSS 签名 / 验证' }))

    expect(publicKey).toHaveValue('')
    expect(screen.getByLabelText('Base64 签名')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '加密' })).not.toBeInTheDocument()
  })

  it('supports arrow-key tab navigation', async () => {
    renderApp()
    const encodingTab = screen.getByRole('tab', { name: '编码' })
    encodingTab.focus()
    await userEvent.keyboard('{ArrowRight}')
    const shareTab = screen.getByRole('tab', { name: '安全分享' })
    expect(shareTab).toHaveAttribute('aria-selected', 'true')
    expect(shareTab).toHaveFocus()
  })

  it('keeps a visited workspace in page memory while reading another module', async () => {
    renderApp()
    await userEvent.click(screen.getByRole('tab', { name: '编码' }))
    const input = await screen.findByLabelText('输入')
    await userEvent.type(input, 'keep this locally')
    await userEvent.click(screen.getByRole('tab', { name: '关于' }))
    await screen.findByRole('heading', { name: '关于 CryptoLab' })
    await userEvent.click(screen.getByRole('tab', { name: '编码' }))
    expect(input).toHaveValue('keep this locally')
  })
})
