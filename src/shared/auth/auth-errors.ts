import { z } from "zod"

export const authProblemStatuses = {
  AUTH_INVALID_REQUEST: 400,
  AUTH_SESSION_INVALID: 401,
  AUTH_CREDENTIALS_INVALID: 401,
  AUTH_ORIGIN_DENIED: 403,
  AUTH_CSRF_INVALID: 403,
  AUTH_ACCESS_DENIED: 403,
  AUTH_STEP_UP_REQUIRED: 403,
  RESOURCE_NOT_FOUND: 404,
  AUTH_STATE_CONFLICT: 409,
  AUTH_BODY_TOO_LARGE: 413,
  AUTH_UNSUPPORTED_MEDIA_TYPE: 415,
  AUTH_RATE_LIMITED: 429,
  AUTH_CONFIGURATION_ERROR: 500,
  AUTH_UNEXPECTED_ERROR: 500,
  AUTH_PROVIDER_FAILURE: 502,
  AUTH_DEPENDENCY_UNAVAILABLE: 503,
  AUTH_DEPENDENCY_TIMEOUT: 504,
} as const

export type AuthProblemCode = keyof typeof authProblemStatuses

export const authProblemSchema = z
  .object({
    type: z.literal("about:blank"),
    title: z.string().min(1).max(100),
    status: z.number().int(),
    code: z.enum(Object.keys(authProblemStatuses) as [AuthProblemCode, ...AuthProblemCode[]]),
    requestId: z.string().min(8).max(128),
    detail: z.string().max(500).optional(),
  })
  .strict()
  .superRefine((problem, context) => {
    if (problem.status !== authProblemStatuses[problem.code]) {
      context.addIssue({
        code: "custom",
        message: "Problem status does not match its canonical code.",
        path: ["status"],
      })
    }
  })

export type AuthProblem = z.infer<typeof authProblemSchema>

