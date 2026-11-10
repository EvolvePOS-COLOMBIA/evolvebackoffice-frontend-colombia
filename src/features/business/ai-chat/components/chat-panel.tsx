import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  Loader2,
  MessageSquarePlus,
  Package,
  RotateCcw,
  Send,
  Sparkles,
  TrendingUp,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { notify } from "@/hooks/use-notify"
import { cn } from "@/lib/utils"
import { getApiErrorMessage } from "@/utils/api-error"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useTranslation } from "@/i18n/use-i18n"
import { useSendChatMessage, useConversation, useConversations, useDeleteConversation } from "../hooks/use-ai-chat"
import { ChatMessage, ChatWritingIndicator } from "./chat-message"

interface ChatPanelProps {
  /** page = layout completo con lista lateral; sheet = panel compacto para el widget. */
  variant?: "page" | "sheet"
}

// Sugerencias iniciales con su icono para dar contexto visual.
const SUGGESTIONS = [
  { key: "suggest_sales_today", icon: TrendingUp },
  { key: "suggest_week_chart", icon: BarChart3 },
  { key: "suggest_top_items", icon: Package },
] as const

export function ChatPanel({ variant = "page" }: ChatPanelProps) {
  const { t } = useTranslation("business-ai-chat")
  const { session } = useAuth()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState("")

  // Nombre de pila del usuario para un saludo cercano (vacío si no está disponible).
  const firstName = session?.user.fullName?.trim().split(/\s+/)[0] ?? ""

  // Iniciales para el avatar del usuario (ej. "Giovany Buelvas" -> "GB").
  const userInitials = useMemo(() => {
    const parts = (session?.user.fullName ?? "").trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return ""
    const first = parts[0]?.charAt(0) ?? ""
    const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? "") : ""
    return `${first}${last}`.toUpperCase()
  }, [session?.user.fullName])

  const conversationsQuery = useConversations()
  const conversationQuery = useConversation(activeId)
  const sendMessage = useSendChatMessage()
  const deleteMutation = useDeleteConversation()

  const conversations = conversationsQuery.data ?? []
  const messages = conversationQuery.data?.messages ?? []
  const bottomRef = useRef<HTMLDivElement>(null)

  // Identificador de la "vista" actual: evita que una respuesta en vuelo cambie
  // de conversación si el usuario empezó una nueva mientras esperaba.
  const viewRef = useRef(0)
  const isSending = sendMessage.isPending

  // Mientras cambia de conversación el detalle aún no llega: NO mostrar el
  // welcome (parecería vacía) sino un estado de carga; si el fetch falla,
  // mostrar error con reintentar en vez de quedarse vacía en silencio.
  const isLoadingMessages = activeId !== null && conversationQuery.isFetching && !conversationQuery.data
  const conversationError = activeId !== null && conversationQuery.isError

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, isSending])

  // Último turno usuario/asistente: habilita "regenerar" y reenvía el mismo texto.
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")
  const lastAssistantMessage = [...messages].reverse().find((message) => message.role === "assistant")
  const latestFollowUp = lastAssistantMessage?.followUp ?? null

  const handleSend = (rawText?: string) => {
    const text = (rawText ?? input).trim()
    if (!text || isSending) return

    setInput("")
    const view = viewRef.current
    sendMessage.mutate({
      payload: { conversationId: activeId, message: text },
      errorMessage: t("send_error"),
      onReady: (response) => {
        if (viewRef.current !== view) return
        if (response.conversationId !== activeId) setActiveId(response.conversationId)
      },
    })
  }

  const handleRegenerate = () => {
    if (!activeId || !lastUserMessage || isSending) return

    sendMessage.mutate({
      payload: { conversationId: activeId, message: lastUserMessage.content, regenerate: true },
      errorMessage: t("send_error"),
    })
  }

  const handleNewChat = () => {
    viewRef.current += 1
    setActiveId(null)
    setInput("")
  }

  // Cambiar de conversación invalida la vista: una respuesta en vuelo ya no
  // debe reemplazar el panel que el usuario está viendo.
  const selectConversation = (id: string) => {
    viewRef.current += 1
    setActiveId(id)
  }

  const handleDelete = (id: string) => {
    if (!window.confirm(t("delete_confirm"))) return
    deleteMutation.mutate(id, {
      onSuccess: () => {
        if (activeId === id) {
          viewRef.current += 1
          setActiveId(null)
        }
        notify.success(t("conversation_deleted"))
      },
      onError: (error) => notify.error(getApiErrorMessage(error, t("delete_error"))),
    })
  }

  const activeTitle = activeId ? conversations.find((c) => c.id === activeId)?.title : null

  // Con una respuesta en curso se conserva el historial + el indicador de escritura.
  const showWelcome = messages.length === 0 && !isSending && !isLoadingMessages && !conversationError

  return (
    <div className="flex h-full min-h-0">
      {/* Lista de conversaciones (solo variante página, desktop) */}
      {variant === "page" ? (
        <aside className="hidden w-60 shrink-0 flex-col border-r border-border/70 bg-muted/20 sm:flex">
          <div className="border-b border-border/70 p-3">
            <Button type="button" className="w-full" size="sm" onClick={handleNewChat}>
              <MessageSquarePlus className="size-4" />
              {t("new_chat")}
            </Button>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {conversationsQuery.isLoading ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">{t("loading")}</p>
            ) : conversations.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">{t("no_conversations")}</p>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "group flex items-center gap-1 rounded-xl border border-transparent px-2 transition-colors",
                    conversation.id === activeId ? "border-primary/20 bg-primary/5" : "hover:bg-accent/70"
                  )}
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 truncate rounded-xl px-1.5 py-2 text-left text-xs text-foreground"
                    onClick={() => selectConversation(conversation.id)}
                    title={conversation.title}
                  >
                    {conversation.title}
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0 opacity-0 group-hover:opacity-100"
                    aria-label={t("delete_conversation")}
                    onClick={() => handleDelete(conversation.id)}
                  >
                    <Trash2 className="size-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </aside>
      ) : null}

      {/* Columna de mensajes */}
      <section className="flex min-w-0 flex-1 flex-col">
        <div
          className={cn(
            "flex items-center justify-between gap-2 border-b border-border/70 px-4 py-2.5",
            variant === "sheet" && "pr-14"
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-3.5" />
            </span>
            <p className="min-w-0 truncate text-sm font-semibold text-foreground">{activeTitle ?? t("title")}</p>
          </div>

          {/* Selector de conversaciones: siempre en sheet, solo móvil en page */}
          <div className={cn("flex shrink-0 items-center gap-1.5", variant === "page" && "sm:hidden")}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-1">
                  <span className="max-w-24 truncate">{t("history")}</span>
                  <ChevronDown className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-64 w-56 overflow-y-auto">
                {conversations.length === 0 ? (
                  <DropdownMenuItem disabled>{t("no_conversations")}</DropdownMenuItem>
                ) : (
                  conversations.map((conversation) => (
                    <DropdownMenuItem
                      key={conversation.id}
                      className="truncate"
                      onClick={() => selectConversation(conversation.id)}
                    >
                      {conversation.title}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              onClick={handleNewChat}
              aria-label={t("new_chat")}
            >
              <MessageSquarePlus className="size-4" />
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
          {isLoadingMessages && !isSending ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">{t("loading_conversation")}</p>
            </div>
          ) : conversationError ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm font-medium text-foreground">{t("load_error")}</p>
              <p className="max-w-xs text-xs text-muted-foreground">{t("load_error_desc")}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => conversationQuery.refetch()}
              >
                <RotateCcw className="size-3.5" />
                {t("retry")}
              </Button>
            </div>
          ) : showWelcome ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 ring-1 ring-primary/15">
                <Sparkles className="size-7 text-primary" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">
                  {firstName ? t("welcome_title_named", { name: firstName }) : t("welcome_title")}
                </p>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">{t("welcome_desc")}</p>
              </div>
              <div className="grid w-full max-w-md gap-2">
                {SUGGESTIONS.map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    className="group flex items-center gap-2.5 rounded-xl border border-border/70 bg-background px-3 py-2.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                    onClick={() => handleSend(t(key))}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-3.5" />
                    </span>
                    <span className="flex-1">{t(key)}</span>
                    <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  userInitials={userInitials}
                  busy={isSending}
                  onFollowUpOption={(text) => handleSend(text)}
                  onFollowUpFreeText={(text) => handleSend(text)}
                  onRegenerate={
                    !isSending && message.id === lastAssistantMessage?.id && lastUserMessage
                      ? handleRegenerate
                      : undefined
                  }
                />
              ))}
              {isSending ? <ChatWritingIndicator /> : null}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          className="border-t border-border/70 p-3"
          onSubmit={(event) => {
            event.preventDefault()
            handleSend()
          }}
        >
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  handleSend()
                }
              }}
              placeholder={latestFollowUp?.freeTextPlaceholder ?? t("input_placeholder")}
              rows={1}
              className="max-h-32 min-h-11 resize-none"
              aria-label={latestFollowUp?.freeTextPlaceholder ?? t("input_placeholder")}
            />
            <Button
              type="submit"
              size="icon"
              className="size-11 shrink-0"
              disabled={!input.trim() || isSending}
              aria-label={t("send")}
            >
              <Send className="size-4" />
            </Button>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">{t("disclaimer")}</p>
        </form>
      </section>
    </div>
  )
}
