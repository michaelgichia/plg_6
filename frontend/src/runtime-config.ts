import type {CreateClientConfig} from './client/client.gen'

export const createClientConfig: CreateClientConfig = (config) => {
  const isServer = typeof window === 'undefined'

  const baseUrl = isServer
    ? process.env.NEXT_INTERNAL_BACKEND_BASE_URL
    : process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8000'

  return {
    ...config,
    baseUrl,
  }
}
