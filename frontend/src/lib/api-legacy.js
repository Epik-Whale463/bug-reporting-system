import axios from 'axios'

const api = axios.create({
  baseURL: (typeof window !== 'undefined' && window.__NEXT_DATA__ && window.__NEXT_DATA__.env && window.__NEXT_DATA__.env.NEXT_PUBLIC_API_URL) || process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
})

// Attach JWT token if present
api.interceptors.request.use((config) => {
  try {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) config.headers.Authorization = `Bearer ${token}`
    }
  } catch (e) {
    // noop
  }
  return config
})

// Handle token expiration and refresh automatically
// Token refresh queue to avoid multiple refresh requests in parallel
let isRefreshing = false
let refreshPromise = null
let pendingRequests = []

function enqueueRequest(cb) {
  return new Promise((resolve, reject) => {
    pendingRequests.push({ resolve, reject, cb })
  })
}

function processQueue(error, token = null) {
  pendingRequests.forEach(p => {
    if (error) p.reject(error)
    else p.resolve(p.cb(token))
  })
  pendingRequests = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        if (typeof window !== 'undefined') window.location.href = '/'
        return Promise.reject(error)
      }

      if (!isRefreshing) {
        isRefreshing = true
        refreshPromise = api.post('/auth/refresh/', { refresh: refreshToken })
          .then(resp => {
            const newAccessToken = resp.data.access
            localStorage.setItem('token', newAccessToken)
            processQueue(null, newAccessToken)
            return newAccessToken
          })
          .catch(err => {
            processQueue(err, null)
            // Clear storage and redirect
            localStorage.removeItem('token')
            localStorage.removeItem('refreshToken')
            if (typeof window !== 'undefined') window.location.href = '/'
            throw err
          })
          .finally(() => {
            isRefreshing = false
            refreshPromise = null
          })
      }

      // Enqueue the original request and retry when refresh completes
      return enqueueRequest((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest)
      })
    }

    return Promise.reject(error)
  }
)

export default api
