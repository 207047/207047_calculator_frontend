const API_BASE = import.meta.env.VITE_API_BASE || ''

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })
  if (response.status === 204) {
    return null
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${response.status})`)
  }
  return data
}

export function calculate(expression) {
  return request('/api/calculate', {
    method: 'POST',
    body: JSON.stringify({ expression }),
  })
}

export function fetchHistory(page = 1, size = 20, keyword = '') {
  const query = new URLSearchParams({ page, size })
  if (keyword) {
    query.set('keyword', keyword)
  }
  return request(`/api/history?${query.toString()}`)
}

export function deleteHistory(id) {
  return request(`/api/history/${id}`, { method: 'DELETE' })
}

export function clearHistory() {
  return request('/api/history', { method: 'DELETE' })
}

export function toggleFavorite(id) {
  return request(`/api/history/${id}/favorite`, { method: 'PUT' })
}

export function fetchStats() {
  return request('/api/stats')
}

export function convertBase(value, fromBase, toBase) {
  return request('/api/convert-base', {
    method: 'POST',
    body: JSON.stringify({
      value,
      fromBase: String(fromBase),
      toBase: String(toBase),
    }),
  })
}
