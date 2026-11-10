/// <reference types="@testing-library/jest-dom/vitest" />
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { I18nextProvider } from "react-i18next"

import i18n from "@/i18n/index"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { ChatPanel } from "../chat-panel"
import { getConversation, getConversations, sendChatMessage } from "../../services/ai-chat.service"
import type { AiChatResponse, AiConversationDetail } from "../../types"

vi.mock("../../services/ai-chat.service", () => ({
  getConversations: vi.fn(),
  getConversation: vi.fn(),
  deleteConversation: vi.fn(),
  sendChatMessage: vi.fn(),
}))

vi.mock("@/features/auth/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}))

vi.mock("@/hooks/use-notify", () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    normal: vi.fn(),
    promise: vi.fn(),
    custom: vi.fn(),
    dismiss: vi.fn(),
    remove: vi.fn(),
  },
  useNotify: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

// Recharts necesita un layout real (happy-dom no lo tiene): se sustituye por un
// marcador para poder asertar qué gráfica recibió el mensaje del asistente.
vi.mock("../chat-chart-block", () => ({
  ChatChartBlock: ({ chart }: { chart: { title?: string | null } }) => (
    <div data-testid="chart-block">{chart.title ?? "chart"}</div>
  ),
}))

const NEW_CONVERSATION_ID = "11111111-1111-1111-1111-111111111111"

const CHART = {
  type: "bar" as const,
  title: "Ventas de la semana",
  labels: ["Lun", "Mar"],
  series: [{ name: "Ventas", data: [10, 20] }],
}

const SEND_RESPONSE: AiChatResponse = {
  conversationId: NEW_CONVERSATION_ID,
  conversationTitle: "gráfica de ventas",
  message: "Estas son tus ventas de la semana.",
  chart: CHART,
}

const FOLLOW_UP = {
  question: "¿Cómo quieres ver el top?",
  options: [
    { id: "week", label: "Esta semana", message: "Muéstramelo de esta semana" },
    { id: "month", label: "Este mes", message: "Muéstramelo de este mes" },
  ],
  allowFreeText: true,
  freeTextPlaceholder: "Escribe una sucursal o un periodo específico",
}

const CONVERSATION_DETAIL: AiConversationDetail = {
  id: NEW_CONVERSATION_ID,
  title: "gráfica de ventas",
  createdAt: "2026-10-19T12:00:00Z",
  updatedAt: "2026-10-19T12:00:01Z",
  messages: [
    { id: "m1", role: "user", content: "gráfica de ventas", chart: null, createdAt: "2026-10-19T12:00:00Z" },
    {
      id: "m2",
      role: "assistant",
      content: "Estas son tus ventas de la semana.",
      chart: CHART,
      createdAt: "2026-10-19T12:00:01Z",
    },
  ],
}

function renderPanel() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  })

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </QueryClientProvider>
  )

  return { queryClient, ...render(<ChatPanel variant="sheet" />, { wrapper: Wrapper }) }
}

describe("ChatPanel (sin streaming)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    i18n.changeLanguage("es")

    // happy-dom no implementa el scroll al final de la lista.
    Element.prototype.scrollIntoView = vi.fn()

    vi.mocked(useAuth).mockReturnValue({
      session: { user: { fullName: "Giovany Buelvas" } },
    } as unknown as ReturnType<typeof useAuth>)

    vi.mocked(getConversations).mockResolvedValue([])
  })

  it("al enviar, muestra el indicador, recarga el detalle y renderiza la gráfica del asistente", async () => {
    // Se controla cuándo responde el "backend" para poder observar el estado de espera.
    const deferred: { resolve: (value: AiChatResponse) => void } = { resolve: () => {} }
    vi.mocked(sendChatMessage).mockImplementation(
      () =>
        new Promise<AiChatResponse>((resolve) => {
          deferred.resolve = resolve
        })
    )
    vi.mocked(getConversation).mockResolvedValue(CONVERSATION_DETAIL)

    renderPanel()

    const textarea = await screen.findByRole("textbox")
    fireEvent.change(textarea, { target: { value: "gráfica de ventas" } })
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }))

    // Se envía al backend en una sola petición (sin eventos SSE).
    await waitFor(() =>
      expect(sendChatMessage).toHaveBeenCalledWith({ conversationId: null, message: "gráfica de ventas" })
    )

    // Mientras el backend genera, se muestra el indicador de escritura.
    expect(await screen.findByText("Generando respuesta…")).toBeInTheDocument()

    await act(async () => {
      deferred.resolve(SEND_RESPONSE)
    })

    // Al terminar, el detalle de la nueva conversación se recarga...
    await waitFor(() => expect(getConversation).toHaveBeenCalledWith(NEW_CONVERSATION_ID))

    // ...y el mensaje del asistente llega con su gráfica renderizada.
    expect(await screen.findByTestId("chart-block")).toHaveTextContent("Ventas de la semana")
    expect(screen.getByText("Estas son tus ventas de la semana.")).toBeInTheDocument()
    // El indicador desaparece al llegar la respuesta.
    expect(screen.queryByText("Generando respuesta…")).not.toBeInTheDocument()
  })

  it("renderiza una pregunta de seguimiento con opciones y permite enviar texto libre", async () => {
    const followUpResponse: AiChatResponse = {
      conversationId: NEW_CONVERSATION_ID,
      conversationTitle: "top artículos",
      message: "Necesito un poco más de contexto para darte el top correcto.",
      chart: null,
      followUp: FOLLOW_UP,
    }

    vi.mocked(sendChatMessage).mockResolvedValue(followUpResponse)
    vi.mocked(getConversation).mockResolvedValue({
      id: NEW_CONVERSATION_ID,
      title: "top artículos",
      createdAt: "2026-10-19T12:00:00Z",
      updatedAt: "2026-10-19T12:00:01Z",
      messages: [
        {
          id: "m1",
          role: "assistant",
          content: "Necesito un poco más de contexto para darte el top correcto.",
          chart: null,
          createdAt: "2026-10-19T12:00:01Z",
          followUp: FOLLOW_UP,
        },
      ],
    } as AiConversationDetail)

    renderPanel()

    const textarea = await screen.findByRole("textbox")
    fireEvent.change(textarea, { target: { value: "¿Cuáles son mis artículos más vendidos?" } })
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }))

    await waitFor(() =>
      expect(sendChatMessage).toHaveBeenCalledWith({
        conversationId: null,
        message: "¿Cuáles son mis artículos más vendidos?",
      })
    )

    const optionButton = await screen.findByRole("button", { name: "Esta semana" })

    vi.mocked(sendChatMessage).mockClear()
    fireEvent.click(optionButton)

    await waitFor(() =>
      expect(sendChatMessage).toHaveBeenCalledWith({
        conversationId: NEW_CONVERSATION_ID,
        message: "Muéstramelo de esta semana",
      })
    )

    vi.mocked(sendChatMessage).mockClear()

    const [detailBox] = await screen.findAllByLabelText("Escribe una sucursal o un periodo específico")
    fireEvent.change(detailBox, { target: { value: "Solo sucursal Centro este mes" } })
    fireEvent.click(screen.getByRole("button", { name: "Enviar detalle" }))

    await waitFor(() =>
      expect(sendChatMessage).toHaveBeenCalledWith({
        conversationId: NEW_CONVERSATION_ID,
        message: "Solo sucursal Centro este mes",
      })
    )
  })
})
