import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReverseCalculator } from '@/components/ReverseCalculator'
import { I18nWrapper } from './i18n-test-utils'
import type { ReversePaidInput } from '@/types'

const baseProps = (overrides: Partial<{
  recharge: string
  arrived: string
  reverseModelId: string | null
  reversePaid: ReversePaidInput
  cacheExpanded: boolean
}> = {}) => ({
  recharge: '100',
  arrived: '100',
  rate: 7.2,
  reverseModelId: 'claude-opus-4.8' as string | null,
  onReverseModelId: () => {},
  reversePaid: { input: null, output: 25, cacheWrite: null, cacheRead: null } as ReversePaidInput,
  onPaidField: () => {},
  cacheExpanded: false,
  onCacheExpanded: () => {},
  ...overrides,
})

describe('ReverseCalculator', () => {
  it('Gate5 Case 1: Opus 4.8 output ¥25 → 倍率 1.0, 便宜 86.1%', () => {
    render(<ReverseCalculator {...baseProps()} />, { wrapper: I18nWrapper })
    // badge 文本
    expect(screen.getByText('比官方便宜 86.1%')).toBeInTheDocument()
    // 真实分组倍率 1 出现在结果卡
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1)
  })

  it('Gate5 Case 2: GPT-5.5 cacheWrite ¥10 → "不适用"', () => {
    render(
      <ReverseCalculator
        {...baseProps({
          reverseModelId: 'gpt-5.5',
          reversePaid: { input: null, output: null, cacheWrite: 10, cacheRead: null },
          cacheExpanded: true,
        })}
      />,
      { wrapper: I18nWrapper },
    )
    expect(screen.getByText('不适用')).toBeInTheDocument()
  })

  it('shows guidance when no model selected', () => {
    render(
      <ReverseCalculator
        {...baseProps({ reverseModelId: null, reversePaid: { input: null, output: null, cacheWrite: null, cacheRead: null } })}
      />,
      { wrapper: I18nWrapper },
    )
    expect(screen.getByText(/请选择参照模型并填写实付价格/)).toBeInTheDocument()
  })

  it('shows guidance when model selected but no paid filled', () => {
    render(
      <ReverseCalculator
        {...baseProps({ reversePaid: { input: null, output: null, cacheWrite: null, cacheRead: null } })}
      />,
      { wrapper: I18nWrapper },
    )
    expect(screen.getByText(/请至少填写一项实付价格/)).toBeInTheDocument()
  })

  it('cache expand toggle reveals cache fields', () => {
    render(
      <ReverseCalculator
        {...baseProps({ cacheExpanded: true })}
      />,
      { wrapper: I18nWrapper },
    )
    expect(screen.getByPlaceholderText('例如 6.25')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('例如 0.5')).toBeInTheDocument()
  })
})
