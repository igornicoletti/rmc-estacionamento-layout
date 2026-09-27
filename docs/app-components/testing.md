# Testes

## Princípio

Testar o comportamento público acrescentado pela camada `App*`. Não duplicar testes de classes, cores, animações ou internals do shadcn/Base UI.

## Cobertura relevante

- `AppAlertDialog`: semântica acessível e fechamento solicitado pelo usuário;
- `AppBadge`: ícone decorativo não entra na árvore acessível;
- `AppCombobox`: seleção, busca, grupos e limpeza;
- `AppDialog` e `AppSheet`: mudança de abertura por interação;
- `AppEmpty`: nível semântico do heading e conteúdo de ação.

`AppCalendar` não mantém teste próprio enquanto sua única política for encaminhar o timezone local ao Calendar oficial. Regras de data acrescentadas por consumidores devem ser testadas no respectivo escopo.

## Evitar

Não testar somente que uma prop ou `children` foi repassado ao primitive. Também não fixar classes Tailwind ou textos puramente visuais.

## Loop de desenvolvimento

Para mudanças pequenas, usar testes relacionados e typecheck quando contratos ou imports forem alterados.

- `npx vitest related <arquivo-alterado> --run`
- `npx vitest --changed origin/main`
- `npm run typecheck`

## Gates

- `npm run check`
- `npm run check:full`

`check:full` permanece o gate final de integração.

## Referências oficiais

- https://testing-library.com/docs/guiding-principles/
- https://vitest.dev/guide/cli
