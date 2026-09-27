export type ToastType = "success" | "info" | "warning" | "error"

export type ToastPriority = "low" | "high"

export interface ToastDefinition {
  readonly title: string
  readonly description?: string
  readonly priority?: ToastPriority
  readonly type: ToastType
}

export type ToastFactory = (...args: never[]) => ToastDefinition

export type ToastCatalog = Readonly<
  Record<string, ToastDefinition | ToastFactory>
>
