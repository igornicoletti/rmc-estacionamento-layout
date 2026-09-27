# Sidebar

A navegação é configurada em `src/app/shell/app-navigation.ts`. Títulos e caminhos vêm de `appPages`; `src/components/sidebar` resolve o item ativo e compõe os primitives de `src/components/ui/sidebar.tsx` e `ui/collapsible.tsx`.

- Uma seção fica aberta por vez. A rota define a seção inicial; a escolha manual vale apenas para o pathname atual.
- `NavLink` fornece `aria-current="page"`. No mobile, navegar fecha o menu.
- Sessão, permissão e domínio são resolvidos fora da Sidebar.

**Ao adicionar uma rota:** registre-a em `appPages`, inclua o item em `app-navigation.ts` e use `end: false` apenas se a rota pai deve permanecer ativa nos descendentes.

Detalhes: [arquitetura](architecture.md) · [uso](usage.md) · [testes](testing.md). Referência externa: [shadcn Sidebar](https://ui.shadcn.com/docs/components/base/sidebar).
