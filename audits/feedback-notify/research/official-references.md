# Pesquisa oficial e referências

**Revisão:** 26/09/2026

Foram priorizadas fontes oficiais das tecnologias presentes no projeto.

## shadcn/ui — Toast Base UI

- https://ui.shadcn.com/docs/components/base/toast
- https://ui.shadcn.com/docs/changelog/2026-07-toast
- https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/ui/toast.tsx
- https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/styles/style-luma.css

Evidências:
- Toast é uma mensagem temporária e sucinta;
- uso documentado via `toast.add(...)`;
- renderer atual reconhece `success`, `info`, `warning`, `error` e `loading`;
- o registry Base UI usa `cn-toast` no root;
- o preset Luma aplica `rounded-2xl` por meio de `.cn-toast`;
- existem actions, promises, stacking e swipe dismissal.

Consequência:
- o projeto não deve hardcodar no root um estilo já pertencente ao preset;
- `cn-toast` deve ser preservado para herdar o estilo configurado;
- a customização local fica limitada à cor semântica dos ícones.

## Base UI — Toast

- https://base-ui.com/react/components/toast

Evidências:
- `Toast.createToastManager()` cria manager global utilizável fora da árvore React;
- o manager expõe `add`, `update`, `close` e `promise`;
- `add` retorna ID;
- ID repetido permite update/upsert;
- timeout padrão é 5000 ms;
- priority aceita `low | high`;
- `low` é o default e é anunciado de forma não urgente;
- `high` é anunciado urgentemente;
- `title` e `description` aceitam `ReactNode`;
- `type` é aberto como string.

Consequência:
- `notify()` não precisa de Hook/Context;
- o projeto restringe `type`, conteúdo e priority;
- `notify()` retorna `void` e esconde o ID do manager;
- ausência de priority herda `low`;
- dedupe, update/close, timeout customizado e lifecycle permanecem capacidades disponíveis para uma futura v2, não requisitos da v1.

## React — Hooks

- https://react.dev/learn/reusing-logic-with-custom-hooks
- https://react.dev/reference/rules/rules-of-hooks

Evidência:
- funções que não chamam Hooks devem permanecer funções comuns e não precisam do prefixo `use`.

Consequência:
- API pública: `notify()`;
- `useNotify()` permanece rejeitado enquanto não houver dependência real de Hook.

## TanStack Query — mutations

- https://tanstack.com/query/latest/docs/framework/react/reference/interfaces/MutationOptions
- https://tanstack.com/query/latest/docs/framework/react/reference/interfaces/MutationCacheConfig
- https://tanstack.com/query/latest/docs/framework/react/typescript

Evidências:
- mutations aceitam `meta`;
- `meta` pode ser lido onde a mutation está disponível, inclusive callbacks globais;
- callbacks globais do MutationCache executam para todas as mutations;
- data/variables em callbacks globais são `unknown`;
- `mutationMeta` pode ser registrado globalmente e precisa permanecer objeto tipado.

Consequência:
- feedback dinâmico permanece em callbacks locais tipados na v1;
- metadata global fica reservado a repetição estática comprovada;
- nenhuma mutation/query recebe Toast automático por padrão.

## TypeScript — `satisfies`

- https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html
- https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html

Evidências:
- `satisfies` verifica compatibilidade sem substituir o tipo específico da expressão;
- `as const` preserva literais e readonly.

Consequência:
- catálogos usam `as const satisfies FeedbackCatalog` preservando parâmetros concretos das factories.

## ESLint — `no-restricted-imports`

- https://eslint.org/docs/latest/rules/no-restricted-imports

Evidências:
- `paths` restringe módulos exatos;
- `patterns` cobre caminhos por padrão;
- `allowImportNames` permite liberar apenas símbolos específicos.

Consequência:
- `Toaster` pode continuar permitido para composição;
- consumidores não acessam diretamente o manager;
- `notify.ts` recebe exceção explícita sem plugin customizado.

## WAI-ARIA / W3C

- https://www.w3.org/TR/wai-aria/
- https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA22

Evidência:
- mensagens não urgentes e anúncios urgentes são comportamentos diferentes.

Consequência:
- `type` visual e `priority` acessível não são equivalentes;
- `error` não vira `high` automaticamente.

## OWASP

- https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html

Evidências:
- respostas públicas devem evitar detalhes internos;
- logs/dados sensíveis exigem políticas próprias.

Consequência:
- `notify(error.message)`, stack, SQL, mensagens de banco e detalhes internos permanecem proibidos;
- o dispatcher recebe somente conteúdo já aprovado para apresentação.

## Vitest e Testing Library

- https://vitest.dev/guide/mocking/functions
- https://vitest.dev/api/expect-typeof
- https://testing-library.com/docs/guiding-principles/

Consequência:
- testar contrato, adapter e comportamento próprio do fluxo;
- não testar internals visuais, animações ou classes cromáticas do primitive.

## Nota de risco do ecossistema

Há issue recente no repositório oficial shadcn relatando Toast Base UI no mesmo nível de z-index de Dialog/Sheet. Como isso ainda não foi reproduzido no projeto, não se altera o z-index preventivamente; o risco deve ser monitorado e reproduzido antes de divergir do registry.

## Síntese

As fontes oficiais sustentam o desenho atual: adapter mínimo + catálogos por domínio/escopo + factories puras + priority explícita + visual nativo do preset + cor semântica apenas nos ícones.
