import { useCallback, useState } from "react"
import { Check, Copy, Loader2, RotateCcw, Send, Sparkles, User } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Markdown } from "@/components/ui/markdown"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/i18n/use-i18n"
import { ChatChartBlock } from "./chat-chart-block"
import type { AiFollowUpPrompt, ChartSpec } from "../types"

export interface ChatMessageView {
  id: string
  role: "user" | "assistant"
  content: string
  chart: ChartSpec | null
  followUp?: AiFollowUpPrompt | null
}

interface ChatMessageProps {
  message: ChatMessageView
  /** Iniciales del usuario para el avatar (vacío = icono genérico). */
  userInitials?: string
  /** Si se entrega, se muestra el botón para regenerar esta respuesta. */
  onRegenerate?: () => void
  /** Deshabilita las acciones mientras hay una respuesta en curso. */
  busy?: boolean
  onFollowUpOption?: (message: string) => void
  onFollowUpFreeText?: (message: string) => void
}

// Estilo común del markdown del asistente: prosa compacta y tablas legibles.
const ASSISTANT_MARKDOWN_CLASS = cn(
  "prose prose-sm max-w-none text-sm dark:prose-invert",
  "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
  "[&_table]:my-2 [&_table]:w-full [&_table]:text-xs",
  "[&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:align-bottom [&_th]:font-semibold",
  "[&_td]:px-2 [&_td]:py-1 [&_td]:align-top [&_tr]:border-border/60",
  "[&_li]:my-0.5 [&_ol]:my-1.5 [&_p]:my-1.5 [&_ul]:my-1.5"
)

const AVATAR_BASE = "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"

function AssistantAvatar() {
  return (
    <div className={cn(AVATAR_BASE, "bg-primary/10 text-primary")} aria-hidden>
      <Sparkles className="size-3.5" />
    </div>
  )
}

function UserAvatar({ initials }: { initials?: string }) {
  return (
    <div className={cn(AVATAR_BASE, "bg-primary text-primary-foreground")} aria-hidden>
      {initials ? initials : <User className="size-3.5" />}
    </div>
  )
}

export function ChatMessage({
  message,
  userInitials,
  onRegenerate,
  busy,
  onFollowUpOption,
  onFollowUpFreeText,
}: ChatMessageProps) {
  const { t } = useTranslation("business-ai-chat")
  const isUser = message.role === "user"

  return (
    <div className={cn("flex w-full gap-2", isUser ? "flex-row-reverse" : "flex-row")}>
      {isUser ? <UserAvatar initials={userInitials} /> : <AssistantAvatar />}

      <div className={cn("flex min-w-0 flex-1 flex-col", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
            isUser ? "bg-primary text-primary-foreground" : "border border-border/70 bg-muted/40 text-foreground"
          )}
        >
          {!isUser ? (
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-primary">
              <Sparkles className="size-3" />
              {t("assistant")}
            </div>
          ) : null}

          {isUser ? (
            <p className="text-sm wrap-anywhere whitespace-pre-wrap">{message.content}</p>
          ) : (
            <Markdown id={message.id} className={ASSISTANT_MARKDOWN_CLASS}>
              {message.content}
            </Markdown>
          )}

          {message.chart ? (
            <div className="mt-2.5">
              <ChatChartBlock chart={message.chart} />
            </div>
          ) : null}
        </div>

        {!isUser ? <MessageActions content={message.content} onRegenerate={onRegenerate} busy={busy} /> : null}
        {!isUser && message.followUp ? (
          <FollowUpPrompt
            followUp={message.followUp}
            busy={busy}
            onChoose={onFollowUpOption}
            onSendCustom={onFollowUpFreeText}
          />
        ) : null}
      </div>
    </div>
  )
}

interface MessageActionsProps {
  content: string
  onRegenerate?: () => void
  busy?: boolean
}

/** Acciones rápidas bajo una respuesta del asistente (copiar / regenerar). */
function MessageActions({ content, onRegenerate, busy }: MessageActionsProps) {
  const { t } = useTranslation("business-ai-chat")
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // El portapapeles puede estar bloqueado por el navegador; se ignora.
    }
  }, [content])

  return (
    <div className="mt-1 flex items-center gap-0.5 pl-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 text-muted-foreground hover:text-foreground"
        onClick={handleCopy}
        aria-label={copied ? t("copied") : t("copy")}
        title={copied ? t("copied") : t("copy")}
      >
        {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
      </Button>

      {onRegenerate ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-foreground"
          onClick={onRegenerate}
          disabled={busy}
          aria-label={t("regenerate")}
          title={t("regenerate")}
        >
          <RotateCcw className="size-3.5" />
        </Button>
      ) : null}
    </div>
  )
}

interface FollowUpPromptProps {
  followUp: AiFollowUpPrompt
  busy?: boolean
  onChoose?: (message: string) => void
  onSendCustom?: (message: string) => void
}

function FollowUpPrompt({ followUp, busy, onChoose, onSendCustom }: FollowUpPromptProps) {
  const { t } = useTranslation("business-ai-chat")
  const [text, setText] = useState("")

  const sendCustom = () => {
    const value = text.trim()
    if (!value || busy) return
    onSendCustom?.(value)
    setText("")
  }

  return (
    <div className="mt-2 w-full max-w-[92%] rounded-2xl border border-primary/20 bg-primary/5 p-3">
      <p className="text-sm font-medium text-foreground">{followUp.question}</p>

      <div className="mt-2 flex flex-wrap gap-2">
        {followUp.options.map((option) => (
          <Button
            key={option.id}
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full bg-background"
            disabled={busy}
            onClick={() => onChoose?.((option.message ?? option.label).trim())}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {followUp.allowFreeText !== false ? (
        <div className="mt-3 space-y-2">
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                sendCustom()
              }
            }}
            rows={2}
            disabled={busy}
            placeholder={followUp.freeTextPlaceholder ?? t("follow_up_placeholder")}
            className="min-h-20 resize-none bg-background"
            aria-label={followUp.freeTextPlaceholder ?? t("follow_up_placeholder")}
          />
          <div className="flex justify-end">
            <Button type="button" size="sm" className="gap-1.5" disabled={!text.trim() || busy} onClick={sendCustom}>
              <Send className="size-3.5" />
              {t("follow_up_send")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** Indicador de escritura mostrado mientras el backend prepara la respuesta. */
export function ChatWritingIndicator() {
  const { t } = useTranslation("business-ai-chat")

  return (
    <div className="flex w-full gap-2">
      <AssistantAvatar />
      <div className="flex min-w-0 flex-1 flex-col items-start">
        <div className="max-w-[92%] rounded-2xl border border-border/70 bg-muted/40 px-3.5 py-2.5 text-sm shadow-sm">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-primary">
            <Sparkles className="size-3" />
            {t("assistant")}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin text-primary" />
            {t("thinking")}
          </div>
        </div>
      </div>
    </div>
  )
}
