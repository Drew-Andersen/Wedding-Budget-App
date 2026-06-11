const BASE = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api'

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include', 
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
 
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  register: (body) => request('POST', '/auth/register', body),
  login: (body) => request('POST', '/auth/login', body),
  logout: () => request('POST', '/auth/logout'),
  me: () => request('GET',  '/auth/me'),
 
  getItems: () => request('GET', '/budget/items'),
  createItem: (body) => request('POST', '/budget/items', body),
  updateItem: (id, body) => request('PATCH', `/budget/items/${id}`, body),
  deleteItem: (id) => request('DELETE', `/budget/items/${id}`),
  getSummary: () => request('GET', '/budget/summary'),
}