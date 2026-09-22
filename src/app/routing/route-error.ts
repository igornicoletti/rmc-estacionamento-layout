export const rootErrorKinds = {
  forbidden: "forbidden",
  notFound: "notFound",
  unexpected: "unexpected",
} as const

export type RootErrorKind =
  (typeof rootErrorKinds)[keyof typeof rootErrorKinds]
