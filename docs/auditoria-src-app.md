# Auditoria normativa de `src/app`

## Escopo e baseline

Auditoria revisada em 21/09/2026 sobre a `main` do
`rmc-estacionamento-layout`, partindo do commit
`1c5ce598dee4c7a53df780d27af05a3c60742830`.

O escopo cobre a arquitetura de runtime em `src/app` e as dependências
transversais necessárias para validar a implementação: React, React Router,
TanStack Query e os primitives `Empty`, `Spinner` e `Button` já instalados
em `src/components/ui`. Os primitives de `ui/` não foram personalizados.

## Referências oficiais confrontadas

- shadcn/ui `Empty`: https://ui.shadcn.com/docs/components/base/empty
- shadcn/ui `Spinner`: https://ui.shadcn.com/docs/components/base/spinner
- React Error Boundaries: https://react.dev/reference/react/Component
- React Router Error Boundaries:
  https://reactrouter.com/how-to/error-boundary
- TanStack Query retries:
  https://tanstack.com/query/latest/docs/framework/react/guides/query-retries

## Inventário de responsabilidades

| Área | Owner | Responsabilidade |
| --- | --- | --- |
| Bootstrap | `bootstrap/` | Composition root e erro acima do router. |
| Fallback visual | `fallbacks/` | Composição visual reutilizável sem regra de sessão ou roteamento. |
| Layout | `layouts/` | Estrutura visual; não decide autorização nem consulta dados. |
| Providers | `providers/` | Infraestrutura transversal e Query Client. |
| Routing | `routing/` | Árvore de rotas, metadata, erros de rota e políticas de acesso. |
| Session | `session/` | Estado discriminado, lifecycle cancelável, refresh e logout. |

## Achados da auditoria

### 1. Fallbacks visuais duplicados

Antes desta revisão, erro global, erro de rota, acesso negado e sessão
indisponível repetiam marcação, tipografia e botões HTML dentro de quatro
boundaries diferentes. A duplicação misturava decisão de estado com
apresentação e ignorava o primitive `Empty` já presente no projeto.

**Correção:** `fallbacks/app-empty-state.tsx` passa a compor
`EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription` e
`EmptyContent`. Os callers continuam donos de ícone, mensagem e ação.

### 2. Bootstrap não utilizava indicador de loading

`SessionBootstrapFallback` apresentava apenas o texto `Carregando…`.
O shadcn/ui define `Spinner` como o primitive para estado de carregamento.

**Correção:** o fallback agora usa `Spinner` com `role="status"` herdado do
primitive, nome acessível específico e região marcada com `aria-busy`.

### 3. Estado `pending` de acesso podia renderizar vazio

`RouteAccessBoundary` retornava `null` quando a policy devolvia
`pending`. O `SessionBootstrapBoundary` global normalmente intercepta esse
estado, mas o boundary isolado ainda possuía um caminho visual vazio.

**Correção:** `pending` reutiliza `SessionBootstrapFallback`.

### 4. Retry de sessão não explicitava concorrência na UI

O provider já abortava a operação de autoridade anterior, porém o fallback
continuava permitindo interação durante `refresh`.

**Correção:** `SessionBootstrapBoundary` propaga `isRefreshing`; o botão de
retry fica desabilitado e exibe `Spinner` enquanto a consulta está em curso.

### 5. Ações inadequadas para estados não recuperáveis por reload

O antigo `RootErrorContent` exibia `Tentar novamente` inclusive para 403 e
404. Recarregar a mesma URL não corrige ausência de permissão nem rota
inexistente.

**Correção:** retry permanece apenas para erro inesperado. 403 e 404 usam
`Empty` informativo sem ação artificial.

## Matriz de conformidade após a implementação

| Área | Estado | Evidência |
| --- | --- | --- |
| Error Boundary acima do router | Conforme | `AppErrorBoundary` mantém `getDerivedStateFromError`/`componentDidCatch` e delega apenas o visual. |
| Root route boundary | Conforme | `RootErrorBoundary` usa `useRouteError` e sanitiza 403/404/erro inesperado. |
| Empty states | Conforme | Estados de erro/indisponibilidade usam `AppEmptyState` sobre o primitive oficial `Empty`. |
| Loading global | Conforme | `SessionBootstrapFallback` usa `Spinner` e semântica de status. |
| Retry de sessão | Conforme | Ação é bloqueada durante refresh e expõe estado em progresso. |
| Policy de acesso | Conforme | Continua pura e fail-closed; visual não concede autorização. |
| Query retries | Conforme | Retry segue limitado a 408, 429 e 5xx, com máximo de duas repetições e backoff limitado. |
| Cache por identidade | Conforme | Somente queries marcadas com `meta.identityScoped` são removidas. |
| Backend authorization | Fora do escopo | Este repositório não contém autoridade server-side. |

## Testes e gates

Foi adicionado teste focado em comportamento de usabilidade para:

- anúncio acessível do bootstrap;
- bloqueio de novo retry enquanto o refresh está em curso;
- presença do indicador de progresso durante retry.

Os testes existentes continuam cobrindo sanitização do erro global, recuperação
manual, política fail-closed, 404 de deep link e lifecycle de sessão.

Gates locais obrigatórios após sincronizar a `main`:

```bash
npm run check
npm run test:e2e:deterministic
```

## Riscos residuais

1. `anonymousSessionCommands` continua sendo uma porta provisória até existir
   contrato real da autoridade de sessão.
2. Autorização do frontend continua sendo somente controle de experiência; cada
   recurso protegido deve ser validado pelo backend.
3. Queries privadas dependem da marcação explícita
   `meta.identityScoped: true`.
4. O repositório não possui workflow de CI versionado; portanto os gates acima
   dependem de execução local enquanto esse pipeline não existir.

## Resultado

`src/app` passa a separar decisão de estado e apresentação, utiliza os
primitives oficiais já instalados para empty/loading states, não duplica
fallbacks visuais e mantém regras de sessão, roteamento e autorização fora do
componente de apresentação.
