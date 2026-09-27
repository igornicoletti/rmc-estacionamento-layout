# Sidebar

Documentação ativa da navegação lateral da aplicação.

## Estrutura

```text
src/app/shell/app-navigation.ts
src/app/shell/app-shell.tsx
src/components/sidebar/sidebar-app.tsx
src/components/sidebar/sidebar-navigation.ts
src/components/ui/sidebar.tsx
src/components/ui/collapsible.tsx
```

- `app-navigation.ts`: define itens, ordem, seções e ícones da navegação.
- `sidebar-navigation.ts`: mantém o modelo tipado e a política de matching.
- `sidebar-app.tsx`: compõe a navegação da aplicação sobre os primitives.
- `ui/sidebar.tsx`: primitive shadcn/Base UI para layout e estado desktop/mobile.
- `ui/collapsible.tsx`: primitive usado nos grupos recolhíveis.

## Regras principais

- `appPages` continua sendo a fonte de `path` e `title`;
- `end` é explícito no modelo resolvido;
- somente uma seção fica aberta por vez;
- a rota atual determina a seção contextual quando não há override manual;
- o usuário pode fechar ou trocar a seção aberta;
- navegar invalida o override da rota anterior;
- `NavLink` mantém a semântica do link ativo com `aria-current="page"`;
- o menu mobile fecha após navegar;
- regras de sessão, RBAC e domínio não entram na Sidebar.

## Uso

A configuração de navegação pertence a `src/app/shell/app-navigation.ts`. A renderização recebe apenas o modelo já resolvido:

```tsx
<SidebarApp
  primaryItems={primaryNavigation}
  profile={currentUser.profile}
  sections={navigationSections}
/>
```

## Testes

A cobertura principal está em `tests/integration/app-shell-navigation.test.tsx`. O E2E mantém apenas os fluxos essenciais de navegação desktop e mobile em `tests/e2e/app.spec.ts`.

Os testes validam comportamento público, não classes Tailwind, ícones ou internals do Base UI.

## Referências

- Arquitetura: `docs/sidebar/architecture.md`
- Uso: `docs/sidebar/usage.md`
- Testes: `docs/sidebar/testing.md`
- Evoluções: `docs/sidebar/roadmap.md`

Fontes oficiais:
- https://ui.shadcn.com/docs/components/base/sidebar
- https://base-ui.com/react/components/collapsible
- https://reactrouter.com/api/components/NavLink
- https://reactrouter.com/api/utils/matchPath
