import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '@/App'
import { I18nWrapper } from './i18n-test-utils'

describe('App smoke', () => {
  it('mounts without crashing and renders key landmarks', () => {
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
  })
})
