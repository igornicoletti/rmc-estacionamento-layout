# Sidebar

**Natureza:** referência vigente. **Escopo:** src/components/sidebar.
**Revisão:** 01/10/2026. **Baseline:** `6daa9bed8971928ed7b63749e9b493645de78025` + manutenção pré-F03 nesta branch.
**Status:** implementação existente descrita; resultados de execução ficam no [manifesto](../auth/evidence/pre-f03-maintenance-local.md), não são inferidos desta referência.

## Sumário navegável

- [Responsabilidades](#c1)
- [Estado e extensão](#c2)
- [Testes](#c3)
- [Referências e limites](#c4)

<a id="c1"></a>

## Responsabilidades

`src/app/app-routes.ts` define IDs/paths/builders; `src/components/sidebar/sidebar-items.ts` define ordem, seção, ícone e end usando appRoutes. Labels pertencem a sidebar-content. `src/components/sidebar/sidebar-navigation.ts` centraliza matchPath; sidebar-app compõe primitives.

Fluxo: appRoutes → sidebar-items → modelo de navegação + pathname → SidebarApp → primitives Sidebar/Collapsible. Não existe appPages ou módulo app/shell.

<a id="c2"></a>

## Estado e extensão

Uma seção fica aberta. Pathname deriva a seção ativa; override manual vale somente para aquela rota, sem booleano por seção ou sincronização por efeito. NavLink fornece aria-current; navegar fecha o menu mobile; estado desktop pertence ao provider.

Nova página: registrar appRoutes/route tree, incluir item em sidebar-items, definir label/ícone/seção e end=false somente se o pai deve permanecer ativo em descendentes. Não incluir consulta, autorização ou paths hardcoded no renderer.

<a id="c3"></a>

## Testes

`tests/integration/app-shell-navigation.test.tsx`: item ativo, descendentes, seção única, fechamento manual, troca por rota, links principais, mobile e sidebar recolhida. `tests/e2e/app.spec.ts` cobre navegação real. Usar aria-current/aria-expanded e assertions auto-wait, não classes/ícones/internals.

Focado: `npx vitest run tests/integration/app-shell-navigation.test.tsx`; [catálogo](../project/validation.md#catalog).

<a id="c4"></a>

## Referências e limites

Sidebar não é enforcement. [shadcn Sidebar](https://ui.shadcn.com/docs/components/base/sidebar), [matchPath](https://reactrouter.com/api/utils/matchPath), [estrutura de estado React](https://react.dev/learn/choosing-the-state-structure).
