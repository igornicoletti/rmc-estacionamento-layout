# Auditoria do estado atual

## Base

Auditoria realizada sobre \`main@32d6cae6a9fe31a744fc9f042c91fe0d1f4d6818\`.

## Constatações confirmadas

### Toast

\`src/components/ui/toast.tsx\` utiliza \`@base-ui/react/toast\` e cria um manager global por \`ToastPrimitive.createToastManager()\`.

O renderer atual:
- exibe \`title\` e \`description\`;
- seleciona ícones para \`success\`, \`info\`, \`warning\`, \`error\` e \`loading\`;
- exporta \`toast\`, \`createToastManager\` e \`useToastManager\`.

Isso é compatível com a documentação atual do Toast Base UI do shadcn e com o manager global do Base UI.

### Provider

\`src/app/root/app-providers.tsx\` já instala \`<Toaster>\` na árvore da aplicação. Portanto, o padrão proposto não necessita de novo React Context, Provider ou Hook apenas para despachar mensagens.

### Consumidores

A busca na \`main\` não encontrou consumidores de \`toast.add\` nem uma função \`notify()\` existente. A arquitetura pode ser definida antes que chamadas diretas se espalhem.

### QueryClient

\`src/app/root/query-client.ts\` configura:
- \`mutations.retry = false\`;
- retry seletivo de queries;
- \`retryDelay\`;
- \`gcTime\`;
- \`staleTime\`;
- \`refetchOnReconnect\`.

Não existe \`MutationCache\` customizado. Portanto, integração global de feedback com mutations ainda não está acoplada ao projeto.

### ESLint

\`eslint.config.js\` já utiliza \`no-restricted-imports\` para impedir que código de produção importe infraestrutura de testes. O mesmo mecanismo pode, depois de uma migração aprovada, restringir import direto de \`@/components/ui/toast\` por features.

### Testes

Vitest inclui somente:
- \`tests/unit/**/*.{test,spec}.{ts,tsx}\`;
- \`tests/integration/**/*.{test,spec}.{ts,tsx}\`.

A estratégia futura pode criar um novo subtree \`tests/unit/feedback/\` sem misturar os testes com arquivos existentes. Nenhuma alteração de configuração é necessária para esse caminho.

## Problemas e riscos confirmados

1. **API pública ainda não existe.** Sem contrato, futuros consumidores podem importar \`toast\` diretamente.
2. **\`type\` do primitive é aberto.** Base UI aceita \`string\`; o projeto deve restringir seu próprio contrato para valores reconhecidos pelo renderer.
3. **Conteúdo do primitive aceita \`ReactNode\`.** O projeto pode reduzir a superfície para \`string\`, já que não existe requisito atual para HTML/JSX em feedback transitório.
4. **Acessibilidade não deve ser derivada da cor ou do tipo.** Base UI distingue prioridade \`low\` e \`high\`; \`error\` não implica automaticamente anúncio urgente.
5. **Erro técnico não pode virar copy pública.** A fronteira deve impedir práticas como \`description: error.message\`.
6. **Conteúdo dinâmico é necessidade previsível.** Projetar apenas strings estáticas criaria refatoração evitável.

## Observação fora do escopo

O botão de fechamento do Toast atual contém \`aria-label="Close toast"\`. Isso demonstra que inconsistências transversais podem surgir, mas esta branch não corrige o componente. Qualquer revisão visual/acessível do primitive deverá ser tratada em bloco próprio, após aprovação do contrato.

## Conclusão

A infraestrutura existente é suficiente para introduzir um adapter pequeno. Não há justificativa atual para Provider adicional, Context, store global, event bus ou hook \`useNotify\`.
