// Backend client for the BDX Safety report service.
// Override the base URL at build/run time with VITE_API_URL
// (e.g. point it at the backend dev's IP during the demo).
const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    throw new Error(`${method} ${path} failed (${res.status})`)
  }
  return res.json()
}

// speech-to-text → structured report
export function structureReport(rawText, language = 'en') {
  return request('/structure-report', {
    method: 'POST',
    body: { raw_text: rawText, language },
  })
}

// persist the report; returns it plus repeat_count + escalated
export function submitReport(report) {
  return request('/submit-report', { method: 'POST', body: report })
}

export function getReports() {
  return request('/reports')
}

export function getDashboard() {
  return request('/dashboard')
}
