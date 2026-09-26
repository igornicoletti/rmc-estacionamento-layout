# Registro de decisões

**Status:** decisões v1 aprovadas e implementadas no escopo atual.  
Não existem decisões arquiteturais abertas necessárias para concluir o PR atual.

## Decisões v1

| ID | Decisão | Estado |
|---|---|---|
| D-01 | API pública chamada `notify()` | implementada |
| D-02 | `notify()` é função normal, não Hook | implementada |
| D-03 | Assinatura: `notify(FeedbackDefinition): void` | implementada |
| D-04 | Catálogos separados por domínio/escopo proprietário | implementada em Session, Clients e DataTable |
| D-05 | Nome dos catálogos de domínio: `<DOMAIN>_FEEDBACK` | implementada |
| D-06 | Arquivo de catálogo de domínio: `<domain>-feedback.ts` | implementada |
| D-07 | Catálogo de domínio fica em `<domain>/content/` | implementada |
| D-08 | Referência TypeScript real; sem token string | implementada |
| D-09 | `type` pertence à definição, não ao chamador | implementada |
| D-10 | Tipos v1: success/info/warning/error | implementada |
| D-11 | `title` obrigatório | implementada |
| D-12 | `description` opcional | implementada |
| D-13 | Conteúdo restrito a string; sem HTML/JSX/ReactNode | implementada |
| D-14 | Conteúdo dinâmico suportado por factory pura | implementada em Clients |
| D-15 | Factory dinâmica recebe um objeto nomeado | implementada em Clients |
| D-16 | `FeedbackCatalog = Readonly<Record<string, FeedbackDefinition | FeedbackFactory>>` | implementada |
| D-17 | `FeedbackFactory = (...args: never[]) => FeedbackDefinition` como constraint | implementada |
| D-18 | Catálogos usam `as const satisfies FeedbackCatalog` | implementada |
| D-19 | Definição inline é proibida, sem branding/runtime helper na v1 | fechada |
| D-20 | `notify()` seleciona campos explicitamente; não usa spread | implementada |
| D-21 | `notify()` ignora ID do manager e não captura exceções | implementada |
| D-22 | Erro técnico não é conteúdo público | implementada |
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

## Separação de Clipboard e feedback

A operação técnica de Clipboard permanece neutra e retorna a Promise da API nativa. O escopo consumidor é responsável por selecionar a definição de feedback adequada.

Para ações reutilizáveis de tabela, a orquestração fica em `data-table/actions`, evitando duplicação de `try/catch` entre páginas. Clients possui catálogo próprio para o feedback dinâmico de e-mail.

Falhas do manager de feedback não são capturadas como se fossem falhas da Clipboard API.

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
| feedback dentro de `copyToClipboard` | mistura operação técnica reutilizável com política de apresentação |

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

Um novo catálogo só deve ser criado quando houver evento real de produto. Novos casos dinâmicos devem manter factories com parâmetros mínimos e tipados, sem antecipar DTOs ou regras inexistentes.
