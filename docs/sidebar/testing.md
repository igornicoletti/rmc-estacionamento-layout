# Testes

## Princípio

Testar comportamento público da navegação. Refactors internos que preservam a experiência não devem exigir reescrever a suíte.

## Integração

`tests/integration/app-shell-navigation.test.tsx` cobre:

- item e seção ativos pela rota atual;
- rota descendente mantendo o item pai ativo;
- somente uma seção aberta;
- fechamento manual da seção ativa;
- troca de seção ao navegar;
- item principal sem seção contextual indevida;
- fechamento do menu mobile após navegar;
- navegação funcional com Sidebar recolhida.

Asserções preferem semântica acessível, como `aria-current` e `aria-expanded`.

## E2E

`tests/e2e/app.spec.ts` mantém fluxos essenciais de navegação desktop e mobile.

Use locators e assertions auto-retry do Playwright. Evite `isVisible()` para esperar transições ou conteúdo dinâmico, pois ele retorna o estado imediatamente.

## Não testar

- classes Tailwind;
- ícones específicos;
- animações;
- helpers internos de matching;
- internals de `SidebarProvider`, Sheet ou Collapsible.

## Validação

Durante desenvolvimento:

```bash
npx vitest run tests/integration/app-shell-navigation.test.tsx
npm run lint
npm run typecheck
```

Antes de merge:

```bash
npm run check:full
```

## Referências oficiais

- Testing Library: https://testing-library.com/docs/guiding-principles/
- Playwright Locators: https://playwright.dev/docs/locators
- Playwright Auto-waiting: https://playwright.dev/docs/actionability
