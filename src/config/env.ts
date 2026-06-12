export const appConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000",
  useMockApi: import.meta.env.VITE_USE_MOCK_API !== "false",
} as const
