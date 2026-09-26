# Plano de implementação — execução iniciada

## Princípio

Implementação autorizada em 26/09/2026, em blocos pequenos, auditáveis e reversíveis. O contrato permanece normativo durante a execução.

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

Gate concluído em 26/09/2026: aprovação explícita concedida.

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
- selecionar um evento real de feedback;
- identificar os formatadores/normalizadores já utilizados pelo domínio para os valores que serão interpolados.

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
- sem sanitizer;
- sem timeout/priority/id/action.

## Estado atual

- Fases 0 e 1 concluídas.
- Fases 2, 3 e 4 iniciadas na branch `feat/feedback-notify`.
- Fase 5 bloqueada no GitHub Actions por indisponibilidade de runner (`runner_id: 0`, `steps: []`); validação local final permanece obrigatória antes de merge.
- Fase 6 não iniciada: a `main` auditada não possui fluxo mutável real em Units e nenhum feedback será inventado.

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

Para valor dinâmico:
- reutilizar \`unit-presentation\` quando aplicável;
- não duplicar regras de sanitização/casing;
- não mover regras do ERP para \`notify()\`.

## Fase 7 — teste do catálogo quando houver lógica

Somente se existir pluralização, branch, formatação ou reutilização de formatter que mereça proteção:

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
- consistência dos valores dinâmicos com apresentação existente;
- nenhuma duplicação;
- necessidade real de qualquer capacidade fora da v1.

Mudança de contrato exige voltar à documentação antes de expandir.

## Fase 9 — expansão por domínio

Migrar/adotar um domínio por vez, sempre com eventos reais e reutilizando sua apresentação vigente.

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
7. Dados interpolados seguem os formatadores/normalizadores existentes do domínio.
8. TypeScript preserva inferência.
9. Testes cobrem comportamento próprio, não biblioteca.
10. Lint, typecheck, testes e build passam.
11. Nenhuma decisão arquitetural implícita é introduzida no código.
