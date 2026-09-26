# Registro de decisões

**Status:** decisões v1 implementadas e mergeadas; revisão pós-merge incorporada.

## Contrato

- `notify(FeedbackDefinition): void`;
- função normal, não Hook;
- catálogo pelo menor domínio/escopo proprietário;
- referência TypeScript real, sem token string;
- `type`: `success | info | warning | error`;
- `priority`: `low | high`, opcional e independente de `type`;
- `title` obrigatório; `description` opcional;
- conteúdo restrito a string;
- factories puras com um objeto nomeado;
- `as const satisfies FeedbackCatalog`;
- definição inline em `notify()` proibida por arquitetura;
- adapter sem spread, sem ID público e sem catch do manager;
- erro técnico não é conteúdo público;
- sem sanitizer/parser universal.

## Ownership

- Session e Clients possuem catálogos de domínio;
- DataTable possui catálogo compartilhado para evento realmente genérico;
- Clipboard permanece operação técnica neutra;
- side effects reutilizáveis de DataTable ficam em `actions`, não em `core`.

## Política visual

- Toast segue o registry Base UI do shadcn e o preset `base-luma`;
- `cn-toast` é o hook nativo de estilo do container;
- não há variante de fundo/borda/texto por `type`;
- somente os ícones recebem cores semânticas dos tokens existentes;
- `loading` permanece neutro;
- classes de cor não entram no contrato de `FeedbackDefinition`.

## Comportamento de erro

O `catch` classifica somente a operação técnica correspondente. Falha de `notify()` não é reclassificada como falha de Clipboard ou outra integração.

## Enforcement

ESLint restringe acesso direto ao manager de Toast, preservando `Toaster` e autorizando o manager somente no adapter.

## Fora da v1

- timeout customizado;
- dedupe/id;
- promise/loading lifecycle;
- actions;
- observabilidade;
- automação global via MutationCache.

Essas capacidades não são pendências obrigatórias. Elas entram apenas se um caso real satisfizer os critérios de `v2-roadmap.md`.
