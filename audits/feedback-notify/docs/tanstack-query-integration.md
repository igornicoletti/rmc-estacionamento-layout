# Integração com TanStack Query

## Decisão

`notify()` não depende de TanStack Query.

A v1 usa callbacks locais tipados quando feedback faz parte de uma mutation. Integração por `mutation.meta` permanece fora da v1 e só será adotada mediante repetição comprovada de feedback estático.

## Base oficial

TanStack Query documenta `meta`, callbacks globais do `MutationCache` e registro global de `mutationMeta`. Callbacks globais recebem `data`/`variables` sem os tipos concretos específicos de cada mutation.

Referências:
- https://tanstack.com/query/latest/docs/framework/react/reference/interfaces/UseMutationOptions
- https://tanstack.com/query/latest/docs/framework/react/reference/interfaces/MutationCacheConfig
- https://tanstack.com/query/latest/docs/framework/react/typescript

## Regra v1

Quando o feedback depende de resultado, variables ou classificação específica, permanecer próximo da mutation tipada:

```ts
useMutation({
  mutationFn: updateResource,
  onSuccess: (resource) => {
    notify(
      RESOURCE_FEEDBACK.updated({
        resourceName: resource.name,
      }),
    )
  },
})
```

Classificação de erro permanece no escopo que conhece o erro; `notify()` nunca recebe o erro cru.

## Metadata futura

`mutation.meta.feedback` só deve ser considerada quando várias mutations reais repetirem feedback completamente estático e o ganho de reduzir boilerplate superar a indireção.

Requisitos:
- opt-in explícito;
- `mutationMeta` globalmente tipado;
- ausência de metadata significa ausência de Toast automático;
- nenhum cast espalhado;
- nenhum comportamento automático para todas as mutations.

## Queries

Não haverá Toast global automático para query errors por causa de retries, background refetch, reconnect e múltiplos observers. Erros de leitura devem continuar usando representação contextual adequada.

## Estado após revisão

Os novos fluxos de Clipboard/DataTable não alteram esta decisão: são operações locais não relacionadas a TanStack Query e permanecem fora do QueryClient.
