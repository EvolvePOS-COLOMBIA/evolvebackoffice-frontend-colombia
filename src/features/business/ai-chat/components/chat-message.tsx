import { Loader2, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import { Markdown } from "@/components/ui/markdown"
import { useTranslation } from "@/i18n/use-i18n"
import { ChatChartBlock } from "./chat-chart-block"
import type { ChartSpec } from "../types"

export interface ChatMessageView {
  id: string
  role: "user" | "assistant"
  content: string
  chart: ChartSpec | null
}

interface ChatMessageProps {
  message: ChatMessageView
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { t } = useTranslation("business-ai-chat")
  const isUser = message.role === "user"

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
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
          <p className="text-sm [overflow-wrap:anywhere] whitespace-pre-wrap">{message.content}</p>
        ) : (
          <Markdown
            id={message.id}
            className="prose prose-sm max-w-none text-sm dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
          >
            {message.content}
          </Markdown>
        )}

        {message.chart ? (
          <div className="mt-2.5">
            <ChatChartBlock chart={message.chart} />
          </div>
        ) : null}
      </div>
    </div>
  )
}

/** Burbuja temporal mientras el asistente responde. */
export function ChatThinking() {
  const { t } = useTranslation("business-ai-chat")

  return (
    <div className="flex justify-start">
      <div className="flex max-w-[88%] items-center gap-2 rounded-2xl border border-border/70 bg-muted/40 px-3.5 py-2.5 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-primary" />
        <span className="text-xs">{t("thinking")}</span>
      </div>
    </div>
  )
}
