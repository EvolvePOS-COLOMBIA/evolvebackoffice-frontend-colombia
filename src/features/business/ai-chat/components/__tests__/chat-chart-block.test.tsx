import type { ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ChatChartBlock } from "../chat-chart-block"

vi.mock("@/hooks/use-locale-format", () => ({
  useLocaleFormat: () => ({ formatCurrencyCompact: (value: number) => String(value) }),
}))

vi.mock("recharts", () => {
  const container = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const empty = () => null
  return {
    ResponsiveContainer: container,
    PieChart: container,
    BarChart: container,
    LineChart: container,
    Pie: ({
      data,
      nameKey,
      label,
    }: {
      data: Record<string, string | number>[]
      nameKey: string
      label: (entry: { name: string | number }) => ReactNode
    }) => (
      <div>
        {data.map((row, index) => (
          // Recharts resolves nameKey into name in PieLabelRenderProps.
          <span key={index}>{label({ name: row[nameKey] })}</span>
        ))}
      </div>
    ),
    Bar: empty,
    CartesianGrid: empty,
    Cell: empty,
    Legend: empty,
    Line: empty,
    Tooltip: empty,
    XAxis: empty,
    YAxis: empty,
  }
})

describe("ChatChartBlock", () => {
  it("renders category names using the Recharts pie label contract", () => {
    render(
      <ChatChartBlock
        chart={{ type: "pie", labels: ["Efectivo", "Tarjeta"], series: [{ name: "Ventas", data: [60, 40] }] }}
      />
    )

    expect(screen.getByText("Efectivo")).toBeInTheDocument()
    expect(screen.getByText("Tarjeta")).toBeInTheDocument()
    expect(screen.queryByText("undefined")).not.toBeInTheDocument()
  })

  it("does not render a chart without categories", () => {
    const { container } = render(
      <ChatChartBlock chart={{ type: "pie", labels: [], series: [{ name: "Ventas", data: [] }] }} />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
