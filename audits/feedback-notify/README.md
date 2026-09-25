# Auditoria e planejamento — Feedback transitório \`notify()\`

**Projeto:** \`rmc-estacionamento-layout\`  
**Base auditada:** \`main@32d6cae6a9fe31a744fc9f042c91fe0d1f4d6818\`  
**Status:** documentação para revisão; implementação bloqueada  
**Escopo desta branch:** pesquisa, auditoria, contrato arquitetural, estratégia de testes e plano de implementação.

## Regra de isolamento

Esta auditoria é deliberadamente independente da implementação atual. Esta branch não altera \`src/\`, \`tests/\`, configurações, dependências, \`README.md\` raiz nem conteúdos existentes. O material fica integralmente sob \`audits/feedback-notify/\`.

A futura estrutura de produção e de testes é somente proposta nos documentos. Ela não deve ser criada antes da aprovação explícita deste dossiê.

## Estrutura

- \`research/current-state.md\`: evidências do estado atual do repositório e problemas/riscos.
- \`research/official-references.md\`: pesquisa e referências oficiais.
- \`docs/architecture-contract.md\`: contrato arquitetural completo do \`notify()\`.
- \`docs/directory-naming-plan.md\`: diretórios, nomenclaturas, dependências e fronteiras.
- \`docs/tanstack-query-integration.md\`: integração progressiva com mutations.
- \`docs/implementation-plan.md\`: rollout em blocos pequenos e critérios de bloqueio.
- \`docs/decision-register.md\`: decisões aprovadas, rejeitadas, adiadas e ainda abertas.
- \`tests/test-plan.md\`: plano independente de validação; nenhum teste executável foi adicionado.

## Objetivo

Substituir, quando a implementação for aprovada, decisões locais como:

\`\`\`ts
toast.add({
  title: "...",
  description: "...",
  type: "success",
})
\`\`\`

por uma API semântica e tipada:

\`\`\`ts
notify(UNITS_FEEDBACK.updated)
\`\`\`

e, para conteúdo dinâmico:

\`\`\`ts
notify(
  UNITS_FEEDBACK.updated({
    unitName,
  }),
)
\`\`\`

A feature informa o evento. O catálogo do domínio possui a linguagem. \`notify()\` adapta a definição para o Toast. O componente visual permanece sem regras de domínio.

## Não objetivos

Esta auditoria não define contratos gerais de copy, i18n, notificações persistentes, logging ou observabilidade. Conteúdos existentes fora deste escopo são ignorados; não existe plano de migração para eles nesta iniciativa.

## Gate

Nenhuma implementação deve começar até:
1. a documentação ser revisada integralmente;
2. todas as decisões abertas relevantes serem resolvidas;
3. a \`main\` ser auditada novamente imediatamente antes da implementação;
4. houver aprovação explícita para iniciar o primeiro bloco.
