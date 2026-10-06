import { useEffect, useRef, useState } from "react"
import { ChevronDown, Loader2, MessageSquarePlus, RotateCcw, Send, Sparkles, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { notify } from "@/hooks/use-notify"
import { cn } from "@/lib/utils"
import { getApiErrorMessage } from "@/utils/api-error"
import { useTranslation } from "@/i18n/use-i18n"
import { useConversation, useConversations, useDeleteConversation, useSendChatMessage } from "../hooks/use-ai-chat"
import { ChatMessage, ChatThinking } from "./chat-message"
import type { SendChatPayload } from "../types"

interface ChatPanelProps {
  /** page = layout completo con lista lateral; sheet = panel compacto para el widget. */
  variant?: "page" | "sheet"
}

const SUGGESTION_KEYS = ["suggest_sales_today", "suggest_week_chart", "suggest_top_items"] as const

export function ChatPanel({ variant = "page" }: ChatPanelProps) {
  const { t } = useTranslation("business-ai-chat")
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState("")

  const conversationsQuery = useConversations()
  const conversationQuery = useConversation(activeId)
  const sendMutation = useSendChatMessage()
  const deleteMutation = useDeleteConversation()

  const conversations = conversationsQuery.data ?? []
  const messages = conversationQuery.data?.messages ?? []
  const bottomRef = useRef<HTMLDivElement>(null)

  // Mientras cambia de conversación el detalle aún no llega: NO mostrar el
  // welcome (parecería vacía) sino un estado de carga; si el fetch falla,
  // mostrar error con reintentar en vez de quedarse vacía en silencio.
  const isLoadingMessages = activeId !== null && conversationQuery.isFetching && !conversationQuery.data
  const conversationError = activeId !== null && conversationQuery.isError

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, sendMutation.isPending])

  const handleSend = (rawText?: string) => {
    const text = (rawText ?? input).trim()
    if (!text || sendMutation.isPending) return

    const payload: SendChatPayload = { conversationId: activeId, message: text }
    setInput("")
    sendMutation.mutate(payload, {
      onSuccess: (response) => {
        if (response.conversationId !== activeId) setActiveId(response.conversationId)
      },
      onError: (error) => notify.error(getApiErrorMessage(error, t("send_error"))),
    })
  }

  const handleNewChat = () => {
    setActiveId(null)
    setInput("")
  }

  const handleDelete = (id: string) => {
    if (!window.confirm(t("delete_confirm"))) return
    deleteMutation.mutate(id, {
      onSuccess: () => {
        if (activeId === id) setActiveId(null)
        notify.success(t("conversation_deleted"))
      },
      onError: (error) => notify.error(getApiErrorMessage(error, t("delete_error"))),
    })
  }

  const activeTitle = activeId ? conversations.find((c) => c.id === activeId)?.title : null

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
                    onClick={() => setActiveId(conversation.id)}
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
          <p className="min-w-0 truncate text-sm font-semibold text-foreground">{activeTitle ?? t("title")}</p>

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
                      onClick={() => setActiveId(conversation.id)}
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
          {isLoadingMessages ? (
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
          ) : messages.length === 0 && !sendMutation.isPending ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="size-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t("welcome_title")}</p>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">{t("welcome_desc")}</p>
              </div>
              <div className="flex max-w-md flex-wrap justify-center gap-2">
                {SUGGESTION_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    className="rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    onClick={() => handleSend(t(key))}
                  >
                    {t(key)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {sendMutation.isPending ? <ChatThinking /> : null}
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
              placeholder={t("input_placeholder")}
              rows={1}
              className="max-h-32 min-h-[44px] resize-none"
              aria-label={t("input_placeholder")}
            />
            <Button
              type="submit"
              size="icon"
              className="size-11 shrink-0"
              disabled={!input.trim() || sendMutation.isPending}
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
