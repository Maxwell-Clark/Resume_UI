export function toUserMessage(error: unknown, fallback: string = 'An unexpected error occurred'): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return fallback
}
