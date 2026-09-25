# Plano de implementação — bloqueado até aprovação

## Princípio

Implementação em blocos pequenos, auditáveis e reversíveis. Nenhum bloco começa enquanto houver inconsistência documental relevante.

## Fase 0 — documentação

Entregável desta branch:
- auditoria;
- pesquisa oficial;
- contrato;
- nomenclatura/diretórios;
- integração TanStack;
- testes;
- decisões;
- rollout.

Gate: aprovação explícita.

## Fase 1 — reaudit da main

Imediatamente antes do primeiro código:
- confirmar HEAD da \`main\`;
- buscar \`toast.add\`, import de \`toast\` e implementações equivalentes;
- rever \`src/components/ui/toast.tsx\`;
- rever \`AppProviders\`;
- rever \`QueryClient\`;
- rever \`eslint.config.js\`;
- rever configuração Vitest/TypeScript;
- inventariar mutations reais do domínio piloto.

Se premissas mudaram, atualizar documentação antes do código.

## Fase 2 — infraestrutura mínima

Criar somente:
\`\`\`text
src/app/feedback/
├─ feedback-contract.ts
└─ notify.ts
\`\`\`

Sem alterar domínio.

Validar:
- formatter do projeto, se aplicável;
- lint;
- typecheck;
- testes focados;
- build.

## Fase 3 — testes independentes da infraestrutura

Criar:
\`\`\`text
tests/unit/feedback/
├─ notify.test.ts
└─ feedback-contract.test.ts
\`\`\`

Não modificar testes existentes para "encaixar" a nova abstração.

## Fase 4 — piloto Units

Criar:
\`\`\`text
src/pages/units/content/units-feedback.ts
\`\`\`

Usar somente eventos reais. Não inventar notificações para demonstrar infraestrutura.

Incluir ao menos um caso dinâmico se houver fluxo real que necessite dele.

## Fase 5 — testes do domínio quando houver lógica

Se factory possuir pluralização/branching ou transformação relevante:
\`\`\`text
tests/unit/pages/units/units-feedback.test.ts
\`\`\`

Não testar frase estática apenas para congelar copy.

## Fase 6 — revisão pós-piloto

Revisar:
- ergonomia do \`notify()\`;
- clareza dos nomes;
- inferência TypeScript;
- tamanho do adapter;
- separação de responsabilidades;
- duplicação;
- necessidades reais de timeout/action/dedupe.

Nenhuma expansão antes desse gate.

## Fase 7 — expansão controlada

Aplicar por domínio, um de cada vez.

## Fase 8 — enforcement

Somente depois que imports diretos forem eliminados:
- adicionar restrição ESLint;
- permitir explicitamente a camada de feedback;
- validar \`npm run check\`.

## Fase 9 — TanStack Query metadata

Somente após inventário suficiente de mutations. Implementar apenas se reduzir repetição sem ocultar dados específicos.

## Fase 10 — capacidades adicionais

Avaliar separadamente, mediante casos reais:
- dedupe/id;
- \`promise\` lifecycle;
- actions;
- priority;
- timeout;
- observabilidade.

## Checklist por commit futuro

1. Mudança pequena e auditável.
2. Documentação oficial vigente confrontada.
3. Testes próprios necessários identificados.
4. Lint/typecheck/test/build executados.
5. Nenhum arquivo não relacionado incluído.
6. Nenhuma mensagem técnica exposta.
7. Nenhum hardcode de feedback criado fora do catálogo.
8. Nenhum TODO arquitetural ignorado.
9. Commit bloqueado se qualquer premissa estiver sem evidência.
