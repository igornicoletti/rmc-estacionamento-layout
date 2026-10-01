/** Canonical chapter 19 registry. Registration is not runtime enablement. */
export const authEndpointMethods = {
  "/api/health": "GET",
  "/api/auth/context": "GET", "/api/auth/session": "GET",
  "/api/auth/login": "POST", "/api/auth/login/mfa/verify": "POST",
  "/api/auth/logout": "POST", "/api/auth/activity": "POST",
  "/api/auth/activation/request": "POST", "/api/auth/activation/resend": "POST",
  "/api/auth/activation/verify": "POST", "/api/auth/activation/password": "POST",
  "/api/auth/activation/complete": "POST", "/api/auth/recovery/request": "POST",
  "/api/auth/recovery/resend": "POST", "/api/auth/recovery/verify": "POST",
  "/api/auth/recovery/password": "POST", "/api/auth/journey": "GET",
  "/api/auth/journey/cancel": "POST", "/api/auth/mfa/enroll": "POST",
  "/api/auth/mfa/verify": "POST", "/api/auth/mfa/cancel": "POST",
  "/api/auth/step-up/challenge": "POST", "/api/auth/step-up/verify": "POST",
  "/api/auth/password/change": "POST",
} as const
export type AuthEndpointPath = keyof typeof authEndpointMethods
