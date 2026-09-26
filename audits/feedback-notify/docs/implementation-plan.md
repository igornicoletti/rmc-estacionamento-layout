# Plano de implementação — bloqueado até aprovação

## Princípio

Implementação futura em blocos pequenos, auditáveis e reversíveis. A documentação atual fecha o desenho; ela não autoriza código.

## Fase 0 — aprovação documental

Entregáveis:
- auditoria;
- referências oficiais;
- contrato;
- registro de decisões;
- diretórios/imports;
- TanStack Query;
- testes;
- rollout.

Gate: aprovação explícita do dossiê.

## Fase 1 — preflight da main

Antes de qualquer alteração:
- confirmar HEAD da \`main\`;
- buscar \`toast.add\`, import de \`toast\`, \`createToastManager\`, \`useToastManager\` e equivalentes;
- rever \`src/components/ui/toast.tsx\`;
- rever \`AppProviders\`;
- rever \`QueryClient\`;
- rever ESLint;
- rever Vitest/TypeScript;
- inventariar mutations reais do domínio piloto;
- selecionar um evento real de feedback.

Se uma premissa técnica mudou, interromper implementação e atualizar o dossiê.

## Fase 2 — contrato TypeScript

Criar somente:

\`\`\`text
src/app/feedback/feedback-contract.ts
\`\`\`

Implementar os tipos fechados no contrato:
- \`FeedbackType\`;
- \`FeedbackDefinition\`;
- \`FeedbackFactory\`;
- \`FeedbackCatalog\`.

Validar compile-time antes de criar o adapter.

## Fase 3 — testes do contrato

Criar subtree novo:

\`\`\`text
tests/unit/app/feedback/
└─ feedback-contract.test.ts
\`\`\`

Confirmar:
- tipos válidos;
- tipo inválido;
- description opcional;
- retorno inválido de factory;
- inferência preservada;
- objeto de parâmetros específico.

## Fase 4 — adapter

Criar:

\`\`\`text
src/app/feedback/notify.ts
tests/unit/app/feedback/notify.test.ts
\`\`\`

Comportamento fechado:
- assinatura retorna \`void\`;
- mapeia somente title/description/type;
- uma chamada ao manager;
- sem spread;
- sem catch;
- sem timeout/priority/id/action.

## Fase 5 — validação da infraestrutura

Executar:
- formatter configurado no projeto, se houver;
- lint;
- typecheck;
- Vitest focado;
- suite relevante;
- build.

Bloquear commit se qualquer check falhar.

## Fase 6 — piloto Units

Criar:

\`\`\`text
src/pages/units/content/units-feedback.ts
\`\`\`

Somente para um fluxo mutável real identificado no preflight. Não inventar Toast para demonstrar infraestrutura.

Se o fluxo necessitar dado dinâmico, aplicar factory desde o primeiro uso.

## Fase 7 — teste do catálogo quando houver lógica

Somente se existir pluralização, branch ou formatação própria:

\`\`\`text
tests/unit/pages/units/content/units-feedback.test.ts
\`\`\`

Não congelar redação estática em testes sem comportamento.

## Fase 8 — revisão pós-piloto

Verificar:
- ergonomia;
- inferência TypeScript;
- clareza das responsabilidades;
- ausência de objeto inline;
- ausência de mensagens técnicas;
- nenhuma duplicação;
- necessidade real de qualquer capacidade fora da v1.

Mudança de contrato exige voltar à documentação antes de expandir.

## Fase 9 — expansão por domínio

Migrar/adotar um domínio por vez, sempre com eventos reais.

## Fase 10 — enforcement ESLint

Após não existirem consumidores legítimos do manager fora do adapter/composição:
- aplicar a regra definida no registro de decisões;
- preservar \`Toaster\`;
- cobrir alias e caminhos relativos equivalentes;
- rodar \`npm run lint\` e \`npm run check\`.

## Fase 11 — revisão TanStack Query

Auditar mutations implementadas.

Somente se houver boilerplate estático recorrente, abrir decisão separada para \`mutation.meta.feedback\`.

## Fase 12 — extensões

Somente mediante casos reais:
- dedupe/id;
- promise lifecycle;
- actions;
- priority;
- timeout;
- observabilidade.

## Checklist de cada commit futuro

1. Mudança pequena e auditável.
2. Premissas confrontadas com documentação oficial vigente.
3. Nenhum arquivo não relacionado.
4. Nenhum hardcode de feedback fora de catálogo.
5. Nenhuma mensagem técnica exposta.
6. Factories recebem somente dados mínimos.
7. TypeScript preserva inferência.
8. Testes cobrem comportamento próprio, não biblioteca.
9. Lint, typecheck, testes e build passam.
10. Nenhuma decisão arquitetural implícita é introduzida no código.
