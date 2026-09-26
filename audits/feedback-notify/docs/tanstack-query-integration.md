# Integração com TanStack Query

## Decisão v1

`notify()` não depende de TanStack Query.

Feedback associado a mutation permanece em callback local tipado quando depender de `data`, `variables` ou classificação específica. `mutation.meta.feedback` continua fora da v1 até existir repetição estática real que justifique a indireção.

Queries não recebem Toast global automático por causa de retries, background refetch, reconnect e múltiplos observers.

## Por que não automatizar agora

Callbacks globais do `MutationCache` executam para todas as mutations e recebem `data`/`variables` de forma ampla (`unknown` no nível global). Isso é adequado para políticas realmente globais, mas perde contexto quando a mensagem depende de tipos específicos do domínio.

A v1 prefere:

```text
mutation real
  ↓
onSuccess / onError tipados
  ↓
classificação do resultado/erro
  ↓
notify(...)
```

## V2 — metadata opt-in

TanStack Query suporta `meta` em mutations e permite registrar `mutationMeta` globalmente.

Uma evolução futura poderia permitir somente casos estáticos:

```ts
useMutation({
  mutationFn,
  meta: {
    feedback: {
      success: SOME_FEEDBACK,
      error: SOME_ERROR_FEEDBACK,
    },
  },
})
```

Um `MutationCache` customizado poderia ler esse metadata e despachar `notify()`.

## Critérios de adoção

Só considerar metadata quando:
- várias mutations reais repetirem o mesmo boilerplate estático;
- a mensagem não depender de `data`, `variables` ou classificação específica de erro;
- o metadata for opt-in;
- `mutationMeta` estiver registrado de forma type-safe;
- mutations sem metadata continuarem sem Toast automático.

## O que não fazer

- não notificar toda mutation de sucesso;
- não notificar todo erro de mutation;
- não aplicar a mesma política a queries;
- não criar uma DSL para resolver conteúdo dinâmico antes de existir repetição comprovada.

## Referências oficiais

- https://tanstack.com/query/latest/docs/framework/react/reference/interfaces/MutationOptions
- https://tanstack.com/query/latest/docs/framework/react/reference/interfaces/MutationCacheConfig
- https://tanstack.com/query/latest/docs/framework/react/typescript

Os fluxos de Clipboard/DataTable permanecem independentes do QueryClient.
