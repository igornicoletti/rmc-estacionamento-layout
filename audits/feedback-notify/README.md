# Feedback transitório `notify()` — v1

**Status:** v1 mergeada e validada na `main` em 26/09/2026. Auditoria pós-merge em andamento na branch `refactor/toast-v1-v2-audit`.

## Implementado na v1

- contrato tipado `FeedbackDefinition` / `FeedbackCatalog`;
- adapter público `notify()`;
- catálogos pelo menor domínio/escopo proprietário;
- Session/logout com `priority: "high"` explícita e preservada;
- enforcement ESLint do manager de Toast;
- Clipboard técnica desacoplada de feedback;
- DataTable com ação/catálogo compartilhados;
- Clients com primeiro feedback dinâmico real;
- testes unitários, integração, cobertura e E2E validados antes do merge.

## Política visual

O primitive `src/components/ui/toast.tsx` deve permanecer alinhado ao Toast Base UI oficial do shadcn e ao preset configurado `base-luma`.

Customização visual autorizada na v1:
- cores semânticas **somente nos ícones** de `success`, `info`, `warning` e `error`;
- usar os tokens já existentes `text-success`, `text-info`, `text-warning` e `text-error`;
- não alterar fundo, borda, título, descrição ou container por `type`;
- `loading` permanece neutro e apenas animado.

O raio do Toast deve vir do hook oficial `cn-toast` do preset Luma, não de classe hardcoded no componente.

## Princípios

```ts
notify(SCOPE_FEEDBACK.event)
notify(SCOPE_FEEDBACK.event({ namedData }))
```

Operações técnicas não incorporam política visual. Erros técnicos não são conteúdo público. `type` visual e `priority` acessível são conceitos independentes. TanStack Query não possui política global de Toast.

## Revisão da v1

A revisão crítica pós-merge está consolidada em `docs/review-findings.md`.

Não há bloqueio arquitetural conhecido na v1. Permanecem riscos e melhorias não bloqueantes que só devem virar código mediante evidência real.

## V2

O planejamento explicativo está em `docs/v2-roadmap.md`. Recursos futuros como dedupe, actions, lifecycle/promise, timeout customizado, observabilidade e metadata de mutations continuam fora da v1.
