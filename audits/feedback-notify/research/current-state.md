# Auditoria do estado atual

## Base

Auditoria realizada sobre \`main@32d6cae6a9fe31a744fc9f042c91fe0d1f4d6818\`.

## Constatações confirmadas

### Toast

\`src/components/ui/toast.tsx\` usa \`@base-ui/react/toast\` e cria um manager global com \`ToastPrimitive.createToastManager()\`.

O renderer atual:
- renderiza \`title\` e \`description\`;
- reconhece visualmente \`success\`, \`info\`, \`warning\`, \`error\` e \`loading\`;
- exporta \`toast\`, \`createToastManager\` e \`useToastManager\`;
- já possui o \`Toaster\` necessário para o viewport/renderer.

O primitive Base UI aceita uma superfície maior do que a necessária para o contrato de aplicação. A proposta reduz deliberadamente essa superfície.

### Provider

\`src/app/root/app-providers.tsx\` instala \`<Toaster>\` na árvore. Não há justificativa para novo Provider, Context ou Hook apenas para despachar feedback.

### Consumidores

A busca na \`main\` não encontrou consumidores de \`toast.add\` nem uma implementação de \`notify()\`. O padrão pode ser introduzido antes de existir dívida de migração.

### QueryClient

\`src/app/root/query-client.ts\` configura:
- \`mutations.retry = false\`;
- retry seletivo de queries;
- \`retryDelay\`;
- \`gcTime\`;
- \`staleTime\`;
- \`refetchOnReconnect\`.

Não existe \`MutationCache\` customizado. Nenhum mecanismo global de feedback está acoplado às mutations.

### ESLint

\`eslint.config.js\` já usa \`no-restricted-imports\` para impedir imports de infraestrutura de testes em produção. O mesmo mecanismo pode restringir o módulo de Toast para consumidores, preservando \`Toaster\` e o adapter autorizado.

### Testes

Vitest inclui:
- \`tests/unit/**/*.{test,spec}.{ts,tsx}\`;
- \`tests/integration/**/*.{test,spec}.{ts,tsx}\`.

O caminho futuro \`tests/unit/app/feedback/\` já está coberto pelo include atual e espelha \`src/app/feedback/\`.

## Problemas e riscos confirmados

1. **Não existe API pública de feedback.** Sem contrato, futuros consumidores podem depender diretamente do manager.
2. **\`type\` do Base UI é aberto (\`string\`).** O projeto deve restringir os tipos aceitos aos que o renderer realmente suporta na v1.
3. **\`title\` e \`description\` do primitive aceitam \`ReactNode\`.** O projeto não tem requisito atual para conteúdo rico e reduzirá ambos a texto.
4. **Acessibilidade não deve ser inferida do tipo visual.** Prioridade \`high\` é um comportamento de live region urgente; \`error\` não é sinônimo de urgência.
5. **Erro técnico não pode virar conteúdo público.** \`error.message\`, stack e detalhes de infraestrutura permanecem fora do contrato.
6. **Conteúdo dinâmico é necessidade previsível.** A v1 já deve suportar factories tipadas.
7. **Definição inline não resolve centralização.** Trocar \`toast.add({...})\` por \`notify({...})\` manteria o mesmo problema.
8. **Automação global de mutations seria prematura.** Callbacks globais do MutationCache recebem \`unknown\` para data/variables; conteúdo dinâmico deve permanecer próximo do contexto tipado até aparecer repetição comprovada.

## Observação fora do escopo

O botão de fechamento do Toast atual contém \`aria-label="Close toast"\`. Isso demonstra uma inconsistência transversal real, mas esta auditoria não altera o primitive. Qualquer revisão visual/acessível do componente deve ocorrer em bloco próprio.

## Conclusão

A infraestrutura existente é suficiente para um adapter síncrono e pequeno. Não há justificativa atual para Context, Provider adicional, store, event bus, registry runtime, parser de tokens ou \`useNotify\`.
