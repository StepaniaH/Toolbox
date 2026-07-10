import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ForwardCalculator } from '@/components/ForwardCalculator'
import { I18nWrapper } from './i18n-test-utils'

describe('ForwardCalculator', () => {
  it('Gate4 Case 1: 100/100/1.1 → 比例 1.0, 等效 1.1, 占官方 ~15.3%', () => {
    render(
      <ForwardCalculator
        recharge="100"
        arrived="100"
        groupRate="1.1"
        onGroupRate={() => {}}
        rate={7.2}
        provider="claude"
        onProvider={() => {}}
      />,
      { wrapper: I18nWrapper },
    )
    // 充值比例 1 ¥/$
    expect(screen.getByText(/1 ¥\/\$/)).toBeInTheDocument()
    // 等效倍率 1.1 (出现在结果卡 + 结论面板)
    expect(screen.getAllByText('1.1').length).toBeGreaterThanOrEqual(1)
    // 占官方成本 ~15.3% (结果卡 + 结论面板)
    expect(screen.getAllByText('15.3%').length).toBeGreaterThanOrEqual(1)
  })

  it('Gate4 Case 2: 100/50/0.6 → 比例 2.0, 等效 1.2, 占官方 ~16.7%', () => {
    render(
      <ForwardCalculator
        recharge="100"
        arrived="50"
        groupRate="0.6"
        onGroupRate={() => {}}
        rate={7.2}
        provider="claude"
        onProvider={() => {}}
      />,
      { wrapper: I18nWrapper },
    )
    expect(screen.getByText(/2 ¥\/\$/)).toBeInTheDocument()
    expect(screen.getAllByText('1.2').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('16.7%').length).toBeGreaterThanOrEqual(1)
  })

  it('shows guidance text when inputs are missing', () => {
    render(
      <ForwardCalculator
        recharge=""
        arrived=""
        groupRate=""
        onGroupRate={() => {}}
        rate={null}
        provider="claude"
        onProvider={() => {}}
      />,
      { wrapper: I18nWrapper },
    )
    expect(
      screen.getByText(/请填写充值金额、到账金额、分组倍率与汇率以查看结论/),
    ).toBeInTheDocument()
  })

  it('Claude price table renders 5 model rows', () => {
    render(
      <ForwardCalculator
        recharge="100"
        arrived="100"
        groupRate="1.1"
        onGroupRate={() => {}}
        rate={7.2}
        provider="claude"
        onProvider={() => {}}
      />,
      { wrapper: I18nWrapper },
    )
    expect(screen.getByText('Claude Opus 4.8')).toBeInTheDocument()
    expect(screen.getByText('Claude Haiku 4.5')).toBeInTheDocument()
  })

  it('GPT price table shows "按输入价计费" for cacheWrite', () => {
    render(
      <ForwardCalculator
        recharge="100"
        arrived="100"
        groupRate="1.1"
        onGroupRate={() => {}}
        rate={7.2}
        provider="gpt"
        onProvider={() => {}}
      />,
      { wrapper: I18nWrapper },
    )
    expect(screen.getByText('GPT-5.5')).toBeInTheDocument()
    // GPT 无缓存写入 → 6 行都有此占位
    expect(screen.getAllByText('按输入价计费').length).toBe(6)
  })
})
