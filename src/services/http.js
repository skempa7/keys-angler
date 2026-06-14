// Minimal fetch helpers used by every data client: timeout + clear errors.

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

async function request(url, { timeoutMs = 8000, accept } = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: accept ? { Accept: accept } : undefined,
    })
    if (!res.ok) throw new HttpError(res.status, `HTTP ${res.status} — ${url}`)
    return res
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchJson(url, opts) {
  const res = await request(url, { accept: 'application/json', ...opts })
  return res.json()
}

export async function fetchText(url, opts) {
  const res = await request(url, { accept: 'text/plain,*/*', ...opts })
  return res.text()
}

export const isOnline = () => (typeof navigator === 'undefined' ? true : navigator.onLine)
