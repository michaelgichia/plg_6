import type { CreateClientConfig } from './client/client.gen'

export const createClientConfig: CreateClientConfig =(config) => {
  const isServer = typeof window === 'undefined'

  const baseURL = isServer
    ? process.env.NEXT_INTERNAL_BACKEND_BASE_URL
    : process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8000'

  return {
    ...config,
    baseURL,
    // Ensure authenticated requests on both server and client by reading the
    // access token from cookies. The OpenAPI client will use this via the
    // security scheme configuration (bearer) to set the Authorization header.
    auth: async () => {
      if (isServer) {
        const { cookies } = await import('next/headers')
        const cookieStore = await cookies()
        return cookieStore.get('access_token')?.value
      }
      if (typeof document !== 'undefined') {
        const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/)
        return match ? decodeURIComponent(match[1]) : undefined
      }
      return undefined
    },
  }
}