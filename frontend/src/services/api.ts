import axios from 'axios'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// Backend NestJS uses the global /api prefix.
// Accept either a bare Railway domain or a URL that already ends with /api.
const normalizedBaseUrl = configuredBaseUrl.replace(/\/+$/, '')
const apiBaseUrl = normalizedBaseUrl.endsWith('/api')
  ? normalizedBaseUrl
  : `${normalizedBaseUrl}/api`

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default api
