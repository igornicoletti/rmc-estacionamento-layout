# Pesquisa oficial e referências

**Revisão:** 26/09/2026  
Foram priorizadas fontes oficiais das tecnologias presentes no projeto.

## shadcn/ui — Toast Base UI

- https://ui.shadcn.com/docs/components/base/toast
- https://ui.shadcn.com/docs/changelog/2026-07-toast

Evidências:
- Toast é descrito como mensagem sucinta e temporária.
- Uso documentado: \`toast.add({ title, description })\`.
- O renderer reconhece \`success\`, \`info\`, \`warning\`, \`error\` e \`loading\`.
- Há suporte a action e \`toast.promise\`.

Consequência:
- o projeto não precisa recriar renderer, lifecycle ou action;
- o contrato v1 pode ser menor que a API da biblioteca.

## Base UI — Toast

- https://base-ui.com/react/components/toast

Evidências:
- \`Toast.createToastManager()\` cria manager global utilizável fora da árvore React;
- o manager expõe \`add\`, \`update\`, \`close\` e \`promise\`;
- \`add\` retorna o ID do Toast;
- passar um \`id\` existente faz upsert/atualização;
- timeout padrão: 5000 ms;
- prioridade padrão: \`low\`;
- \`high\` é anunciada urgentemente;
- \`title\` e \`description\` aceitam \`ReactNode\`;
- \`type\` é \`string\`.

Consequência:
- \`notify()\` não precisa de Hook ou Context;
- a v1 restringirá \`type\` e conteúdo;
- \`notify()\` retornará \`void\`, deliberadamente escondendo o ID do manager;
- timeout e prioridade serão herdados por omissão;
- dedupe/lifecycle permanecem possíveis sem fazer parte da v1.

## React — Hooks

- https://react.dev/learn/reusing-logic-with-custom-hooks
- https://react.dev/reference/rules/rules-of-hooks

Evidências:
- funções que não chamam Hooks devem ser funções regulares;
- React recomenda evitar o prefixo \`use\` quando não há Hook;
- Hooks só podem ser chamados em contextos React válidos.

Consequência:
- API: \`notify()\`;
- rejeitado: \`useNotify()\` enquanto não houver dependência real de Hook.

## TanStack Query — mutations

- https://tanstack.com/query/latest/docs/framework/react/reference/interfaces/UseMutationOptions
- https://tanstack.com/query/latest/docs/framework/react/reference/interfaces/MutationOptions
- https://tanstack.com/query/latest/docs/framework/react/reference/interfaces/MutationCacheConfig
- https://tanstack.com/query/latest/docs/framework/react/typescript

Evidências:
- mutations aceitam \`meta\`;
- a documentação define \`meta\` como payload lido onde a mutation está disponível, inclusive callbacks globais;
- callbacks do \`MutationCache\` executam para todas as mutations do cache;
- callbacks globais recebem \`data\` e \`variables\` como \`unknown\`;
- \`mutationMeta\` pode ser registrado globalmente e precisa estender \`Record<string, unknown>\`.

Consequência:
- v1 usa callbacks locais tipados quando feedback depende de data/variables/erro;
- metadata global fica como evolução para casos estáticos repetitivos;
- nenhum Toast automático para toda mutation.

## TypeScript — \`satisfies\`

- https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html
- https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html

Evidências:
- \`satisfies\` valida compatibilidade mantendo o tipo específico da expressão;
- \`as const\` preserva literais e torna propriedades readonly.

Consequência:
- catálogos usarão \`as const satisfies FeedbackCatalog\`;
- isso preserva parâmetros concretos das factories e impede mutação acidental das entradas estáticas sem anotar o catálogo com um tipo amplo.

## ESLint — \`no-restricted-imports\`

- https://eslint.org/docs/latest/rules/no-restricted-imports

Evidências:
- a regra pode restringir módulos/padrões;
- \`allowImportNames\` permite liberar símbolos específicos dentro de um módulo restringido.

Consequência:
- enforcement futuro permitirá \`Toaster\` para composição da aplicação;
- o adapter \`notify.ts\` será excluído da restrição;
- consumidores não poderão acessar diretamente os exports do módulo de Toast.

## WAI-ARIA / W3C

- https://www.w3.org/TR/wai-aria/
- https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA22

Evidências:
- \`status\` é uma live region advisory;
- possui \`aria-live="polite"\` implícito;
- mensagens urgentes são categoria distinta.

Consequência:
- \`error\` não será automaticamente convertido em prioridade \`high\`;
- prioridade permanece política explícita futura.

## OWASP

- https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html

Evidências:
- erros inesperados devem produzir resposta pública genérica/controlada;
- detalhes técnicos não devem ser expostos ao cliente;
- logs e dados sensíveis exigem política própria.

Consequência:
- \`notify(error.message)\`, stack, mensagens do banco e detalhes internos são proibidos;
- \`notify()\` não faz logging nem redaction universal na v1; ele recebe conteúdo já aprovado para apresentação.

## Vitest e Testing Library

- https://vitest.dev/guide/mocking/functions
- https://testing-library.com/docs/guiding-principles/
- https://testing-library.com/docs/queries/about/

Evidências:
- mocks/spies permitem observar side effects próprios;
- testes de UI devem privilegiar comportamento e uso real sobre detalhes internos.

Consequência:
- testar o adapter e lógica de factories;
- não testar animações, classes ou internals do Base UI.

## Síntese

As fontes oficiais sustentam uma camada de aplicação pequena e tipada, não uma nova infraestrutura de Toast. O desenho aprovado para revisão é adapter + catálogos por domínio + factories puras.
