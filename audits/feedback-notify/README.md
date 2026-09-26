# Auditoria e planejamento — Feedback transitório \`notify()\`

**Projeto:** \`rmc-estacionamento-layout\`  
**Base auditada:** \`main@32d6cae6a9fe31a744fc9f042c91fe0d1f4d6818\`  
**Última revisão documental:** 26/09/2026  
**Status:** contrato arquitetural fechado para aprovação; implementação bloqueada  
**Escopo desta branch:** pesquisa, auditoria, decisões arquiteturais, estratégia de testes e plano de implementação.

## Regra de isolamento

Esta auditoria é independente da implementação atual. A branch não altera \`src/\`, \`tests/\`, configurações, dependências, \`README.md\` raiz nem conteúdos existentes. Todo o material permanece em \`audits/feedback-notify/\`.

A estrutura futura de produção e testes aparece somente como especificação. Nenhum arquivo funcional deve ser criado antes de aprovação explícita.

## Estrutura

- \`research/current-state.md\`: evidências do estado atual.
- \`research/official-references.md\`: pesquisa em documentação oficial e consequências para o projeto.
- \`docs/architecture-contract.md\`: contrato normativo do \`notify()\`.
- \`docs/decision-register.md\`: decisões fechadas, rejeições e itens deliberadamente fora da v1.
- \`docs/directory-naming-plan.md\`: diretórios, nomes, imports e fronteiras.
- \`docs/tanstack-query-integration.md\`: estratégia de integração com mutations.
- \`docs/implementation-plan.md\`: rollout por blocos e gates.
- \`docs/review-findings.md\`: revisão crítica documento por documento.
- \`tests/test-plan.md\`: plano independente de testes futuros.

## Objetivo

Quando a implementação for autorizada, substituir decisões locais como:

\`\`\`ts
toast.add({
  title: "...",
  description: "...",
  type: "success",
})
\`\`\`

por uma API semântica:

\`\`\`ts
notify(UNITS_FEEDBACK.updated)
\`\`\`

ou, para conteúdo dinâmico:

\`\`\`ts
notify(
  UNITS_FEEDBACK.updated({
    unitName,
  }),
)
\`\`\`

A feature informa o evento. O catálogo do domínio define a mensagem. \`notify()\` adapta a definição ao Toast. O primitive visual permanece sem regras de domínio.

## Decisões centrais já fechadas

- \`notify()\` é função normal, não Hook.
- A API recebe uma \`FeedbackDefinition\` resolvida e retorna \`void\`.
- Catálogos são separados por domínio.
- Conteúdo dinâmico existe desde a v1 por factory pura.
- \`title\` é obrigatório; \`description\` é opcional quando não acrescenta informação.
- \`type\` é \`success | info | warning | error\`.
- HTML, JSX, \`ReactNode\`, erros crus e overrides no call site não fazem parte do contrato.
- \`notify()\` não interpreta \`Error\`, HTTP, Supabase ou regra de negócio.
- Valores dinâmicos de origem externa devem reutilizar normalizadores/formatadores de apresentação já existentes no domínio antes ou dentro da factory; \`notify()\` não possui sanitizer próprio.
- TanStack Query permanece integração opt-in; não existe Toast global para toda mutation/query.
- O manager Base UI continua encapsulado pelo adapter.
- A v1 não expõe timeout, prioridade, actions, dedupe, loading lifecycle ou observabilidade.

Não existem decisões arquiteturais abertas nesta revisão. Permanecem somente precondições de execução, como reaudar a \`main\` antes do primeiro bloco.

## Não objetivos

Esta iniciativa não define contratos gerais de copy, i18n, notificações persistentes, logging ou observabilidade. Conteúdos existentes fora deste escopo são ignorados e não possuem plano de migração aqui.

## Gate

Nenhum código é autorizado por esta revisão. A implementação só poderá começar depois de:
1. aprovação explícita desta documentação;
2. reaudit da \`main\` no momento da implementação;
3. confirmação de que as premissas técnicas continuam válidas;
4. seleção de um fluxo real para o piloto, sem inventar feedbacks.
