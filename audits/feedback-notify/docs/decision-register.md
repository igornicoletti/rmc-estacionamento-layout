# Registro de decisões

## Aprovadas como proposta técnica

| ID | Decisão | Estado |
|---|---|---|
| D-01 | API pública chamada \`notify()\` | proposta |
| D-02 | \`notify()\` é função normal, não Hook | proposta |
| D-03 | Catálogo por domínio | proposta |
| D-04 | Nome \`<DOMAIN>_FEEDBACK\` | proposta |
| D-05 | Referência TypeScript real, sem token string | proposta |
| D-06 | \`type\` pertence à definição | proposta |
| D-07 | Contrato v1: success/info/warning/error | proposta |
| D-08 | Conteúdo dinâmico já na fase 1 | proposta |
| D-09 | Dinâmico via factory pura com objeto de parâmetros nomeados | proposta |
| D-10 | \`title\` e \`description\` restritos a string | proposta |
| D-11 | Erro técnico não é conteúdo público | proposta |
| D-12 | Sem HTML sanitizer porque HTML não entra no contrato | proposta |
| D-13 | Timeout/prioridade não expostos por mensagem na v1 | proposta |
| D-14 | TanStack Query compatível, porém não obrigatório | proposta |
| D-15 | Metadata de mutation somente após evidência de repetição | proposta |
| D-16 | Queries não geram Toast global automaticamente | proposta |
| D-17 | ESLint bloqueia import direto somente após migração | proposta |
| D-18 | Auditoria/documentação/test-plan isolados nesta branch | executada |

## Rejeitadas

| Alternativa | Razão |
|---|---|
| \`t()\` | ambíguo com i18n |
| \`useNotify()\` | dispatcher não usa Hook e deve funcionar fora da árvore React |
| \`notify.success/error\` | duplica a fonte de verdade da severidade |
| \`notify("units.updated")\` | exige resolver/registry runtime desnecessário |
| definição inline em feature | mantém hardcode e dispersão |
| mega catálogo global | perde ownership por domínio |
| Provider/Context extra | Base UI já possui manager global |
| store/event bus | nenhuma necessidade comprovada |
| sanitizer HTML | contrato não aceita HTML |
| automação de Toast para toda mutation | gera feedback indevido e reduz controle semântico |
| callbacks dentro do catálogo | mistura conteúdo e comportamento |

## Adiadas deliberadamente

- \`description\` opcional;
- identificador semântico persistente;
- deduplicação;
- actions;
- \`toast.promise\`/loading lifecycle;
- timeout por definição;
- priority por definição;
- observabilidade;
- \`mutation.meta.feedback\`;
- barrel \`@/app/feedback\`.

Adiadas significa: compatíveis com o desenho, mas sem justificativa para a v1.

## Decisões abertas antes da implementação

### O-01 — \`description\` obrigatória

Proposta atual: obrigatória na v1. Revisar com inventário dos primeiros feedbacks reais.

### O-02 — forma exata de \`FeedbackCatalog\`

Requisito: validar entradas estáticas e factories sem destruir inferência dos parâmetros. A forma TypeScript deve ser prototipada em bloco próprio e aceita somente se o typecheck demonstrar ergonomia.

### O-03 — regra ESLint precisa

Definir restrição que bloqueie o import direto de \`toast\` pelas features sem impedir a infraestrutura autorizada.

### O-04 — primeiro evento real de Units

Não inventar feedbacks. Identificar o primeiro fluxo mutável real após reaudit da main.

## Regra de aprovação

Este registro deixa de ser "proposta" somente após revisão e aprovação explícita. Nenhuma decisão deste arquivo autoriza implementação por si só.
