import type { AppRole } from "@/features/auth/types"

export interface EmailSetting {
  id: string
  smtpServer: string
  smtpPort: number
  username: string | null
  senderEmail: string
  senderName: string
  encryptionType: string
  isActive: boolean
}

export interface UpdateEmailSettingFormValues {
  smtpServer: string
  smtpPort: number
  username?: string
  password?: string
  senderEmail: string
  senderName: string
  encryptionType: string
}

export interface SendTestEmailFormValues {
  recipientEmail: string
}
