export type FeedbackType =
  | "success"
  | "info"
  | "warning"
  | "error"

export interface FeedbackDefinition {
  readonly title: string
  readonly description?: string
  readonly type: FeedbackType
}

export type FeedbackFactory = (...args: never[]) => FeedbackDefinition

export type FeedbackCatalog = Readonly<
  Record<string, FeedbackDefinition | FeedbackFactory>
>
