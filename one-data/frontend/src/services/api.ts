const BASE = '/api'

export interface TestUser {
  id: number
  username: string
  market: string
  environment: string
  userType: string
  role: string
  paymentType: string
  accountId: string
  serviceId: string
}

export interface TokenResponse {
  userId: string
  username: string
  token: string
  environment: string
  market: string
  status: string
}

export interface Filters {
  market?: string
  environment?: string
  userType?: string
  role?: string
  paymentType?: string
  accountId?: string
  serviceId?: string
}

export async function fetchUsers(filters: Filters): Promise<TestUser[]> {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, val]) => {
    if (val && val.trim() !== '') params.append(key, val)
  })
  const res = await fetch(`${BASE}/users?${params.toString()}`)
  if (!res.ok) throw new Error(`Failed: ${res.status}`)
  return res.json()
}

export async function generateToken(userId: number): Promise<TokenResponse> {
  const res = await fetch(`${BASE}/token/${userId}`, { method: 'POST' })
  if (!res.ok) throw new Error(`Token failed: ${res.status}`)
  return res.json()
}

export async function fetchStats(): Promise<{ total: number }> {
  const res = await fetch(`${BASE}/users/stats`)
  if (!res.ok) throw new Error(`Stats failed: ${res.status}`)
  return res.json()
}
