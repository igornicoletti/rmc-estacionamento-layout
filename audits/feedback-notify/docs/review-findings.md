# Revisão crítica documento por documento

**Data:** 26/09/2026  
**Resultado:** contrato sem decisões arquiteturais abertas; implementação continua bloqueada até aprovação.

## 1. \`architecture-contract.md\`

### Problemas encontrados na revisão anterior
- \`description\` estava obrigatória sem necessidade comprovada;
- forma exata de \`FeedbackCatalog\` estava adiada;
- retorno de \`notify()\` não estava definido;
- comportamento diante do ID/erro do manager não estava definido;
- não estava explícito se o adapter usaria spread;
- definição inline era proibida sem distinguir regra arquitetural de enforcement;
- fallback automático permanecia implícito.

### Refinamentos aplicados
- \`description?: string\`;
- contrato TypeScript fechado;
- \`as const satisfies FeedbackCatalog\`;
- factory constraint definida;
- regra de um objeto nomeado por factory;
- \`notify(...): void\`;
- ID do Base UI deliberadamente oculto;
- sem catch no adapter;
- mapeamento explícito de campos;
- sem fallback automático;
- strings vazias proibidas por regra, sem validator runtime.

## 2. \`decision-register.md\`

### Problema anterior
Havia quatro itens "abertos", o que contrariava o objetivo de concluir o desenho antes do código.

### Refinamentos
- O-01 resolvida: description opcional.
- O-02 resolvida: tipos exatos do catálogo.
- O-03 resolvida: estratégia exata de ESLint documentada.
- O-04 reclassificada: seleção do primeiro evento real é precondição de execução, não decisão arquitetural.
- retorno, spread, ID, catch, testes e diretórios receberam decisões explícitas.

Resultado: nenhuma decisão arquitetural aberta.

## 3. \`directory-naming-plan.md\`

### Problema anterior
\`tests/unit/feedback/\` não espelhava o padrão já presente de testes de infraestrutura em \`tests/unit/app/\`.

### Refinamentos
- caminho futuro: \`tests/unit/app/feedback/\`;
- catálogo com lógica: \`tests/unit/pages/<domain>/content/\`;
- imports canônicos definidos;
- sem barrel v1;
- grafo de dependência normativo fechado.

## 4. \`tanstack-query-integration.md\`

### Problemas anteriores
- distinção entre callbacks de \`useMutation\` e callbacks passados a \`mutate\` não estava registrada;
- critério para metadata era subjetivo demais;
- erro classificado precisava de fronteira mais clara.

### Refinamentos
- feedback operacional prefere callback configurado na mutation;
- callback passado a \`mutate\` fica para efeitos estritamente locais de UI;
- metadata permanece opt-in e só para repetição estática real;
- nenhuma quantidade arbitrária de ocorrências foi inventada;
- query error global permanece rejeitado;
- exemplo de module augmentation mantido como evolução, não v1.

## 5. \`implementation-plan.md\`

### Refinamentos
- contrato TypeScript vem antes do adapter;
- testes espelham a estrutura final;
- adapter possui comportamento exato;
- piloto depende de evento real;
- enforcement só entra depois de consumidores legítimos estarem definidos;
- mudanças de contrato obrigam retorno à documentação.

## 6. \`test-plan.md\`

### Problemas anteriores
- ainda pressupunha description obrigatória;
- não verificava retorno \`void\`, ID oculto ou propagação de erro do manager;
- caminho de testes não espelhava source.

### Refinamentos
- testes atualizados para description opcional;
- contrato negativo/positivo explícito;
- payload do adapter restrito;
- retorno/ID/catch cobertos;
- nenhum teste do Base UI.

## 7. \`research/current-state.md\`

Refinado para separar:
- evidência do repositório;
- risco arquitetural;
- decisões que são consequência da evidência.

Nenhuma correção funcional foi incorporada ao escopo.

## 8. \`official-references.md\`

Atualizado em 26/09/2026 e alinhado às APIs oficiais atuais:
- shadcn Base UI Toast;
- Base UI manager;
- React Hooks;
- TanStack Query mutation/meta/cache;
- TypeScript \`satisfies\`;
- ESLint \`no-restricted-imports\`;
- WAI-ARIA;
- OWASP;
- Vitest/Testing Library.

## 9. Conclusão

Não restam decisões arquiteturais ambíguas necessárias para iniciar a implementação.

Ainda existem capacidades explicitamente **fora da v1** — dedupe, promise lifecycle, action, prioridade customizada, timeout customizado, observabilidade e mutation metadata. Elas não são pendências; são exclusões deliberadas.

O único gate restante é de governança: aprovação explícita do dossiê e reaudit da \`main\` antes do primeiro código.
