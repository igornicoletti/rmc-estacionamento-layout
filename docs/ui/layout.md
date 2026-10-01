# Layout

**Natureza:** referência vigente. **Escopo:** src/components/layout.
**Revisão:** 01/10/2026. **Baseline:** `6daa9bed8971928ed7b63749e9b493645de78025` + manutenção pré-F03 nesta branch.
**Status:** implementação existente descrita; resultados de execução ficam no [manifesto](../auth/evidence/pre-f03-maintenance-local.md), não são inferidos desta referência.

## Sumário navegável

- [Contratos](#c1)
- [Uso e fluxo](#c2)
- [Testes](#c3)
- [Limites e fontes](#c4)

<a id="c1"></a>

## Contratos

`src/components/layout/layout-page.tsx` recebe título/subtítulo, ações opcionais e children. Não decide empty/loading ou acesso.

`src/components/layout/layout-shell.tsx` recebe navegação, perfil de apresentação, destinos, notificações, callbacks e estados de operações. Monta SidebarProvider, Sidebar, Header e conteúdo. Não conhece provider Auth, role/capabilities ou reader de dados.

<a id="c2"></a>

## Uso e fluxo

MockShellRoute alimenta o shell atual com fixtures; identidade apresentada não é sessão real. Conteúdo de página pertence à feature. Callbacks são fornecidos pelo runtime, nunca criados pelo layout como regra de negócio.

<a id="c3"></a>

## Testes

`tests/integration/app-shell.test.tsx`, `tests/integration/app-shell-navigation.test.tsx` e `tests/integration/app-shell-sign-out.test.tsx` verificam composição, navegação e comandos. E2E desktop/mobile está em `tests/e2e/app.spec.ts`. [Catálogo](../project/validation.md#catalog).

<a id="c4"></a>

## Limites e fontes

BFF/controller e integração real permanecem fases Auth. [React composition](https://react.dev/learn/passing-props-to-a-component), [Sidebar](sidebar.md).
