import { Bot } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/i18n/use-i18n"
import { ChatPanel } from "../components/chat-panel"

export function AiChatPage() {
  const { t } = useTranslation("business-ai-chat")

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] min-h-[520px] flex-col gap-3">
      <div className="relative flex flex-col gap-2">
        <Badge className="max-w-fit" tone="primary">
          {t("title")}
        </Badge>
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{t("page_heading")}</h1>
        <p className="max-w-4xl text-sm leading-5 text-muted-foreground">{t("page_desc")}</p>
        <Bot
          color="#58626b"
          className="absolute -top-10 -right-20 -z-10 size-50 shrink-0 animate-float opacity-5 md:-top-10 md:-right-10 md:size-70 lg:-top-20 lg:-right-30 lg:size-100"
        />
      </div>

      <Card className="min-h-0 flex-1 overflow-hidden shadow-none">
        <CardContent className="h-full p-0">
          <ChatPanel variant="page" />
        </CardContent>
      </Card>
    </div>
  )
}
