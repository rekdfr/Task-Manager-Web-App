const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'

function getToken() {
  return localStorage.getItem('token')
}

async function request(path, options = {}) {
  const res = await fetch(API_URL + path, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: getToken(),
      ...options.headers,
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`)
  return data
}

export function register(username, password) {
  return request('/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function login(username, password) {
  return request('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export async function getTasks() {
  const data = await request('/task')
  return Array.isArray(data) ? data : []
}

export function createTask(title, description) {
  return request('/task', {
    method: 'POST',
    body: JSON.stringify({ title, description }),
  })
}

export function deleteTask(id) {
  return request(`/task/${id}`, { method: 'DELETE' })
}
