export type PrintDocumentType = "KitchenOrder" | "SaleReceipt"

export type PrintPaperFormat = "Ticket80mm" | "Ticket55mm" | "Letter"

export interface PrintTemplateMappingDto {
  documentType: PrintDocumentType
  templateId: string
  templateName?: string | null
  printerName?: string | null
  format: PrintPaperFormat
  autoPrint: boolean
  copies: number
}

export interface RegisterPrintSettingsDto {
  registerId: string
  serviceUrl: string
  isEnabled: boolean
  mappings: PrintTemplateMappingDto[]
}

export interface UpdateRegisterPrintSettingsDto {
  serviceUrl: string
  isEnabled: boolean
  mappings: PrintTemplateMappingDto[]
}

export interface PrinterXHealthResponse {
  status: string
  service: string
  version: string
  engineVersion?: string
  machine?: string
  capabilities?: string[]
}

export interface PrinterXTemplate {
  id: string
  name: string
  format: PrintPaperFormat | string
  htmlContent?: string | null
  cssContent?: string | null
  sampleDataJson?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface PrinterXPrinter {
  name: string
  isDefault: boolean
  isOnline: boolean
  portName?: string
  supportedPaperSizes?: string[]
}

export interface PrinterXPrintRequest {
  printerName: string | null
  templateId: string
  type: "HtmlTemplate" | "DirectGdi" | "RawEscPos"
  format: PrintPaperFormat | string
  documentTitle: string
  copies: number
  cutPaper: boolean
  openCashDrawer: boolean
  data: Record<string, unknown>
}

export interface PrinterXPrintResponse {
  jobId: string
  status?: string
  success?: boolean
  message?: string
  targetPrinter?: string
  printerUsed?: string
}
