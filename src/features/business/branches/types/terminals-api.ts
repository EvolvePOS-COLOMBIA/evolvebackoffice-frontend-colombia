export interface BranchTerminalSettingsResponseDto {
  id: string | null
  branchId: string
  maxTerminals: number
  areTerminalsEnabled: boolean
  createdAt: string
}

export interface UpsertBranchTerminalSettingsDto {
  maxTerminals: number
  areTerminalsEnabled?: boolean
}
