# Auditoria e implementação — Feedback transitório `notify()`

**Projeto:** `rmc-estacionamento-layout`  
**Base original auditada:** `main@32d6cae6a9fe31a744fc9f042c91fe0d1f4d6818`  
**Última revisão:** 26/09/2026  
**Status:** arquitetura aprovada; implementação v1 em andamento na branch `feat/feedback-notify`

## Isolamento

A auditoria e as decisões permanecem isoladas em `audits/feedback-notify/`. A implementação aprovada vive nos diretórios normais de produção e testes; os documentos não são usados como dependência runtime.

## Estrutura documental

- `research/current-state.md`: evidências da base auditada.
- `research/official-references.md`: documentação oficial e consequências arquiteturais.
- `docs/architecture-contract.md`: contrato normativo do `notify()`.
- `docs/decision-register.md`: decisões fechadas e exclusões deliberadas.
- `docs/directory-naming-plan.md`: diretórios, nomes, imports e fronteiras.
- `docs/tanstack-query-integration.md`: estratégia progressiva para mutations.
- `docs/implementation-plan.md`: estado real do rollout e próximos gates.
- `docs/review-findings.md`: achados das revisões críticas.
- `tests/test-plan.md`: estratégia de validação própria.

## Objetivo

Substituir decisões locais de Toast por uma API semântica e tipada:

```ts
notify(SCOPE_FEEDBACK.event)
```

ou, quando a mensagem depende de dados:

```ts
notify(
  SCOPE_FEEDBACK.event({
    namedData,
  }),
)
```

O catálogo pertence ao menor domínio/escopo semanticamente proprietário do evento. `notify()` somente adapta a definição ao manager existente. Operações técnicas reutilizáveis não incorporam política visual.

## Estado de implementação

Concluído na branch:
- contrato TypeScript e adapter `notify()`;
- catálogos por escopo proprietário;
- piloto Session/logout com prioridade acessível preservada;
- enforcement ESLint do manager de Toast;
- separação entre Clipboard e feedback visual;
- ação compartilhada de cópia de registros da DataTable;
- primeiro feedback dinâmico real em Clients;
- testes unitários e de integração das fronteiras próprias.

O GitHub Actions permanece indisponível para validação enquanto os jobs forem encerrados sem runner (`runner_id: 0`, `steps: []`). A validação local completa permanece o gate confiável.

## Gate de merge

Antes do merge do PR:
1. sincronizar a branch remota atual;
2. executar os testes focados;
3. executar lint e typecheck;
4. executar build;
5. executar `check:full`;
6. revisar o diff final;
7. confirmar ausência de alterações não relacionadas.

Qualquer mudança de contrato exige nova revisão documental antes da expansão para outros domínios.
