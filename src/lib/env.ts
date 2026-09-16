export const isProductionEnvironment = process.env.NODE_ENV === 'production'

export function getOptionalEnv(name: string) {
  const value = process.env[name]
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function requireEnv(name: string) {
  const value = getOptionalEnv(name)
  if (!value) {
    throw new Error(`[ENV] Missing required env var ${name}`)
  }

  return value
}
