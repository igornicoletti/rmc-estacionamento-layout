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

A feature informa o evento. O catálogo proprietário define conteúdo, `type` e, quando necessário, `priority`. `notify()` somente adapta a definição ao manager existente. O primitive visual continua sem regras de domínio.

## Decisões v1

- `notify()` é função normal, não Hook.
- `notify(FeedbackDefinition): void`.
- Catálogos pertencem ao menor domínio/escopo semanticamente proprietário do evento.
- `title` obrigatório; `description` opcional.
- `type`: `success | info | warning | error`.
- `priority`: `low | high`, opcional e pertencente à definição.
- ausência de `priority` preserva o default `low` do Base UI.
- `type: "error"` não implica automaticamente `priority: "high"`.
- Conteúdo dinâmico existe desde a v1 por factory pura com objeto nomeado.
- HTML, JSX, `ReactNode`, erros crus e overrides livres no call site ficam fora do contrato.
- `notify()` não interpreta `Error`, HTTP, Supabase, RBAC ou regra de negócio.
- Operações técnicas reutilizáveis não embutem feedback visual.
- Valores externos reutilizam formatadores/normalizadores de apresentação existentes no domínio.
- TanStack Query permanece integração opt-in; não existe Toast automático para toda mutation/query.
- Timeout customizado, actions, dedupe, lifecycle/promise e observabilidade continuam fora da v1.

## Estado de implementação

Concluído na branch:
- contrato TypeScript;
- adapter `notify()`;
- testes unitários do contrato/adapter;
- catálogo real de Session para falha de logout;
- migração do logout para `notify()`;
- teste de integração do fluxo de logout;
- enforcement de import direto do manager via ESLint;
- preservação explícita da prioridade alta do feedback de logout;
- separação de Clipboard e feedback visual;
- catálogo reutilizável para cópia de registros de DataTable;
- factory dinâmica real em Clients para cópia de e-mail;
- testes próprios das novas fronteiras.

O GitHub Actions permanece indisponível para validação porque os jobs são encerrados sem runner (`runner_id: 0`, `steps: []`). A validação local completa é o gate confiável enquanto essa condição persistir.

## Regra para próximos domínios

Não criar catálogo apenas para preencher arquitetura. Novos domínios entram quando existir ação real que necessite feedback transitório.

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
