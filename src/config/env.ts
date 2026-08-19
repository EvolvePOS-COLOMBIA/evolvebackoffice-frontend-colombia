const configuredApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL

export const appConfig = {
  // API services use paths beginning with /api, so accept either documented
  // env name while preventing a duplicated /api segment.
  apiBaseUrl: (configuredApiUrl || "http://localhost:5000").replace(/\/api\/?$/, ""),
}
