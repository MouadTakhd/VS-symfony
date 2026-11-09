import type { z } from 'zod'

/**
 * A ZodError as { field: firstMessage }, the shape showErrors() and ApiResult use.
 * Issues without a path (whole-object rules) go under "_".
 */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) out[issue.path.join('.') || '_'] ??= issue.message
  return out
}
