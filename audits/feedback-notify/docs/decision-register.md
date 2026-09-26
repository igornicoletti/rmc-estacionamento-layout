# Registro de decisões

**Status:** decisões v1 aprovadas e parcialmente implementadas.  
Não existem decisões arquiteturais abertas necessárias para concluir o PR atual.

## Decisões v1

| ID | Decisão | Estado |
|---|---|---|
| D-01 | API pública chamada `notify()` | implementada |
| D-02 | `notify()` é função normal, não Hook | implementada |
| D-03 | Assinatura: `notify(FeedbackDefinition): void` | implementada |
| D-04 | Catálogo separado por domínio | implementada no piloto Session |
| D-05 | Nome do catálogo: `<DOMAIN>_FEEDBACK` | implementada |
| D-06 | Arquivo do catálogo: `<domain>-feedback.ts` | implementada |
| D-07 | Catálogo fica em `<domain>/content/` | implementada |
| D-08 | Referência TypeScript real; sem token string | implementada |
| D-09 | `type` pertence à definição, não ao chamador | implementada |
| D-10 | Tipos v1: success/info/warning/error | implementada |
| D-11 | `title` obrigatório | implementada |
| D-12 | `description` opcional | implementada |
| D-13 | Conteúdo restrito a string; sem HTML/JSX/ReactNode | implementada |
| D-14 | Conteúdo dinâmico suportado na v1 por factory pura | implementada no contrato; aguarda primeiro caso real |
| D-15 | Factory dinâmica recebe um objeto nomeado | fechada |
| D-16 | `FeedbackCatalog = Readonly<Record<string, FeedbackDefinition | FeedbackFactory>>` | implementada |
| D-17 | `FeedbackFactory = (...args: never[]) => FeedbackDefinition` como constraint | implementada |
| D-18 | Catálogos usam `as const satisfies FeedbackCatalog` | implementada |
| D-19 | Definição inline é proibida, sem branding/runtime helper na v1 | fechada |
| D-20 | `notify()` seleciona campos explicitamente; não usa spread | implementada |
| D-21 | `notify()` ignora ID do manager e não captura exceções | implementada |
| D-22 | Erro técnico não é conteúdo público | implementada no piloto Session |
| D-23 | Sem sanitizer HTML/redactor universal na v1 | fechada |
| D-24 | Valores externos reutilizam presentation helpers do domínio | fechada |
| D-25 | Sem fallback automático dentro de `notify()` | implementada |
| D-26 | Timeout customizado não é exposto na v1 | fechada |
| D-27 | `priority` é opcional e pertence à definição | implementada |
| D-28 | `error` não implica automaticamente `priority: "high"` | implementada |
| D-29 | Ausência de `priority` preserva o default `low` do Base UI | implementada |
| D-30 | Loading/promise lifecycle fora da v1 | fechada |
| D-31 | Dedupe/id/update/close fora da v1 | fechada |
| D-32 | Actions fora da v1; callbacks nunca no catálogo | fechada |
| D-33 | Observabilidade fora da v1 | fechada |
| D-34 | TanStack Query é compatível, mas não dependência de `notify()` | fechada |
| D-35 | Fase inicial usa callbacks de mutation tipados quando necessário | fechada |
| D-36 | `mutation.meta.feedback` só após repetição comprovada | fechada |
| D-37 | Nenhum Toast automático para toda mutation | fechada |
| D-38 | Nenhum Toast global automático para query errors | fechada |
| D-39 | Testes da infraestrutura ficam em `tests/unit/app/feedback/` | implementada |
| D-40 | Enforcement de acesso direto ao Toast usa `no-restricted-imports` e preserva `Toaster` | implementada |
| D-41 | Documentação/auditoria permanece isolada em `audits/feedback-notify/` | implementada |

## Decisão de prioridade após o piloto real

O primeiro fluxo real revelou uma regressão potencial: a falha de logout já utilizava `priority: "high"` antes da migração para `notify()`. Remover essa propriedade alteraria o comportamento de anúncio acessível.

A decisão foi corrigir o contrato minimamente:

```ts
export type FeedbackPriority = "low" | "high"

interface FeedbackDefinition {
  readonly priority?: FeedbackPriority
}
```

Regras:
- prioridade continua opcional;
- o catálogo decide quando ela é necessária;
- o call site não escolhe prioridade;
- `type` e `priority` são conceitos independentes;
- `high` deve ser raro e deliberado.

## Alternativas rejeitadas

| Alternativa | Razão |
|---|---|
| `t()` | conflita semanticamente com i18n |
| `useNotify()` | não existe Hook a reutilizar |
| `notify.success/error` | duplica a fonte de verdade de `type` |
| `notify("units.updated")` | introduz resolver/registry runtime sem necessidade |
| objeto inline em `notify()` | mantém hardcode e dispersão |
| catálogo global único | reduz ownership de domínio |
| Provider/Context adicional | manager global Base UI já resolve despacho externo à árvore |
| store/event bus | nenhuma necessidade funcional |
| sanitizer HTML | contrato não aceita HTML |
| sanitizer/formatter genérico dentro de `notify()` | duplicaria apresentação já existente nos domínios |
| parser universal de erros em `notify()` | mistura infraestrutura com integração/domínio |
| Toast para toda mutation | produz feedback indevido |
| Toast global para queries | retries/refetch/reconnect podem produzir ruído |
| callbacks dentro do catálogo | mistura conteúdo e comportamento |
| expor ID retornado por `toast.add` | acopla consumidores ao lifecycle do primitive |
| exigir `description` sempre | força conteúdo redundante |
| mapear todo `error` para `high` | confunde severidade visual com urgência acessível |

## Fora da v1

Permanecem deliberadamente fora do escopo:
- deduplicação por ID;
- `toast.promise`;
- update/close públicos;
- actions;
- timeout customizado por definição;
- identificador semântico para observabilidade;
- telemetria;
- `mutation.meta.feedback`;
- barrel `@/app/feedback`;
- lint customizado para proibir objeto literal em `notify()`.

## Enforcement ESLint

Implementado com `no-restricted-imports`:
- consumidores normais não podem importar diretamente o manager/primitives do módulo de Toast;
- `Toaster` permanece permitido para composição da aplicação;
- `src/app/feedback/notify.ts` é a exceção autorizada para acessar o manager;
- a restrição existente contra `@tests/*` permanece ativa;
- aliases e caminhos relativos equivalentes são cobertos.

A escolha usa mecanismos oficiais da regra (`paths`, `patterns` e `allowImportNames`) em vez de plugin customizado.

## Gate para novos domínios

Um novo catálogo só deve ser criado quando houver evento real de produto. O primeiro caso real de conteúdo dinâmico deve validar factories e presentation helpers sem antecipar DTOs ou regras inexistentes.
