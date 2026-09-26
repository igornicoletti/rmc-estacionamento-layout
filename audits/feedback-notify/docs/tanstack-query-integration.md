# Integração com TanStack Query

## Decisão v1

`notify()` não depende de TanStack Query.

Feedback associado a mutation permanece em callback local tipado quando depender de `data`, `variables` ou classificação específica. `mutation.meta.feedback` continua fora da v1 até existir repetição estática real que justifique a indireção.

Queries não recebem Toast global automático por causa de retries, background refetch, reconnect e múltiplos observers.

## Referências oficiais

- https://tanstack.com/query/latest/docs/framework/react/reference/interfaces/UseMutationOptions
- https://tanstack.com/query/latest/docs/framework/react/reference/interfaces/MutationCacheConfig
- https://tanstack.com/query/latest/docs/framework/react/typescript

## Regra futura

Metadata só poderá ser adotado com opt-in explícito, tipo global registrado e ausência de política universal de Toast.

Os fluxos de Clipboard/DataTable não alteram essa decisão e permanecem independentes do QueryClient.
