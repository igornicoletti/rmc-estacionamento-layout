# Fallbacks

**Natureza:** referência vigente. **Escopo:** src/components/fallback.
**Revisão:** 01/10/2026. **Baseline:** `6daa9bed8971928ed7b63749e9b493645de78025` + manutenção pré-F03 nesta branch.
**Status:** implementação existente descrita; resultados de execução ficam no [manifesto](../auth/evidence/pre-f03-maintenance-local.md), não são inferidos desta referência.

## Sumário navegável

- [Matriz de responsabilidade](#c1)
- [Testes](#c2)
- [Limites e referências](#c3)

<a id="c1"></a>

## Matriz de responsabilidade

| Estado | Decisão | Apresentação/recuperação |
| --- | --- | --- |
| Falha de render | AppErrorBoundary | FallbackApplicationError; recarregar |
| Loader/action/lazy ou Response | AppRouteErrorBoundary | 403/404/inesperado; mensagem pública |
| Rota desconhecida | Route tree | 404 fora do shell |
| Sessão bootstrap | AuthBoundary provisório | Ocupado anunciado |
| Sessão indisponível | Provider provisório | Retry sem duplicação, não anonymous |
| Query inicial/refetch/vazia | Feature | Erro/atualização/empty local |
| Página placeholder | Entrada feature | Não representa funcionalidade implementada |

FallbackPage fornece main; AppEmpty fornece título/descrição e mídia. Componentes apenas apresentam estado, nunca autenticam/classificam domínio.

<a id="c2"></a>

## Testes

`tests/unit/app/app-error-boundary.test.tsx`, `tests/unit/app/session-fallbacks.test.tsx`, `tests/integration/route-error-boundary.test.tsx` e `tests/integration/route-access-boundary.test.tsx` cobrem recuperação/classificação/negação. [Catálogo](../project/validation.md#catalog).

<a id="c3"></a>

## Limites e referências

Boundary visual não impede loader privado; gate anterior ao carregamento e enforcement BFF permanecem fases futuras. [React Error Boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary), [Router errors](https://reactrouter.com/how-to/error-boundary).
