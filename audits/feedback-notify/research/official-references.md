# Pesquisa oficial e referências

Pesquisa revisada em 25/09/2026. Foram priorizadas fontes oficiais das bibliotecas efetivamente presentes no projeto.

## shadcn/ui — Toast Base UI

- Toast atual: https://ui.shadcn.com/docs/components/base/toast
- Changelog do novo Toast Base UI (julho/2026): https://ui.shadcn.com/docs/changelog/2026-07-toast

Constatações relevantes:
- Toast é descrito como mensagem sucinta e temporária.
- Uso oficial: \`toast.add({ title, description })\`.
- O renderer documentado reconhece \`success\`, \`info\`, \`warning\`, \`error\` e \`loading\`.
- A API suporta actions e \`toast.promise\`.
- O antigo Toast da variante Radix é marcado como deprecated; isso não se aplica ao componente Base UI utilizado pelo projeto.

## Base UI — Toast

- https://base-ui.com/react/components/toast

Constatações:
- \`Toast.createToastManager()\` cria manager global utilizável fora da árvore React.
- O manager expõe \`add\`, \`update\`, \`close\` e \`promise\`.
- adicionar um Toast com \`id\` já existente atualiza o anterior, permitindo deduplicação/upsert;
- timeout padrão documentado: 5000 ms;
- prioridade padrão: \`low\`; \`high\` é anunciada urgentemente;
- \`title\` e \`description\` aceitam \`ReactNode\`, mas o contrato da aplicação pode deliberadamente ser mais restritivo.

Conclusão: não há necessidade de criar Provider/Context/Hook adicional para o dispatcher proposto.

## React — Custom Hooks

- https://react.dev/learn/reusing-logic-with-custom-hooks
- https://react.dev/reference/rules/rules-of-hooks

Constatações:
- funções que não usam Hooks devem ser funções normais e devem evitar prefixo \`use\`;
- Hooks possuem restrições de chamada.

Conclusão: \`notify()\` é preferível a \`useNotify()\` enquanto o dispatcher não depender de Hooks.

## TanStack Query — mutations

- Mutation options: https://tanstack.com/query/latest/docs/framework/react/reference/interfaces/MutationOptions
- MutationCache callbacks: https://tanstack.com/query/latest/docs/framework/react/reference/interfaces/MutationCacheConfig
- TypeScript/meta global: https://tanstack.com/query/latest/docs/framework/react/typescript

Constatações:
- mutations aceitam \`meta\`;
- a própria documentação indica \`meta\` para informação lida onde a mutation está disponível, inclusive callbacks globais;
- callbacks de \`MutationCache\` são globais para todas as mutations do cache;
- \`mutationMeta\` pode ser tipado globalmente via interface \`Register\`.

Conclusão: metadata é uma evolução plausível para feedback estático/opt-in, mas não deve substituir callbacks locais quando a definição depende de \`data\`, \`variables\` ou classificação específica de erro sem que um padrão repetitivo esteja comprovado.

## TypeScript

- \`satisfies\`: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html
- const assertions: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html

Constatações:
- \`satisfies\` valida compatibilidade sem perder a inferência específica da expressão;
- \`as const\` evita widening e torna propriedades literais readonly, mas não deve ser usado automaticamente quando não houver necessidade.

Conclusão: o contrato deve priorizar \`satisfies\` e preservar a inferência das factories dinâmicas.

## ESLint

- https://eslint.org/docs/latest/rules/no-restricted-imports

Constatação:
- \`no-restricted-imports\` existe especificamente para restringir imports padronizados pelo projeto.

Conclusão: após migração, a regra pode impedir uso direto do manager de Toast fora da infraestrutura autorizada.

## Vitest e Testing Library

- Vitest mock functions: https://main.vitest.dev/guide/learn/mock-functions
- Testing Library guiding principles: https://testing-library.com/docs/guiding-principles/
- Testing Library queries: https://testing-library.com/docs/queries/about/

Constatações:
- mocks devem isolar side effects e permitir observar chamadas;
- testes de UI devem priorizar comportamento percebido pelo usuário em vez de detalhes de implementação.

Conclusão: testar o adapter próprio e os comportamentos das factories; não testar animações/classes internas do Base UI.

## WAI-ARIA / W3C

- WAI-ARIA 1.2: https://www.w3.org/TR/wai-aria/
- Técnica WCAG ARIA22: https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA22

Constatação:
- \`status\` é uma live region de caráter consultivo/polite; mensagens urgentes exigem tratamento distinto.

Conclusão: não mapear automaticamente todo \`error\` para prioridade urgente.

## OWASP

- Error Handling Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html
- REST Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html
- Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html

Constatações:
- respostas inesperadas devem evitar detalhes de implementação;
- detalhes técnicos pertencem a mecanismos de diagnóstico/logging, não à mensagem exibida ao usuário;
- tokens, credenciais e dados sensíveis não devem ser propagados indiscriminadamente.

Conclusão: \`notify(error.message)\` e equivalentes devem ser proibidos por contrato.
