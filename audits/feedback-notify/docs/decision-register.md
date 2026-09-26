# Registro de decisões

**Status:** decisões arquiteturais fechadas para aprovação.  
Não existem itens arquiteturais em aberto nesta revisão.

## Decisões v1

| ID | Decisão | Estado |
|---|---|---|
| D-01 | API pública chamada \`notify()\` | fechada |
| D-02 | \`notify()\` é função normal, não Hook | fechada |
| D-03 | Assinatura: \`notify(FeedbackDefinition): void\` | fechada |
| D-04 | Catálogo separado por domínio | fechada |
| D-05 | Nome do catálogo: \`<DOMAIN>_FEEDBACK\` | fechada |
| D-06 | Arquivo do catálogo: \`<domain>-feedback.ts\` | fechada |
| D-07 | Catálogo fica em \`<domain>/content/\` | fechada |
| D-08 | Referência TypeScript real; sem token string | fechada |
| D-09 | \`type\` pertence à definição, não ao chamador | fechada |
| D-10 | Tipos v1: success/info/warning/error | fechada |
| D-11 | \`title\` obrigatório | fechada |
| D-12 | \`description\` opcional quando não acrescenta informação | fechada |
| D-13 | Conteúdo restrito a string; sem HTML/JSX/ReactNode | fechada |
| D-14 | Conteúdo dinâmico entra na v1 | fechada |
| D-15 | Dinâmico via factory pura com um objeto nomeado | fechada |
| D-16 | \`FeedbackCatalog = Readonly<Record<string, FeedbackDefinition \| FeedbackFactory>>\` | fechada |
| D-17 | \`FeedbackFactory = (...args: never[]) => FeedbackDefinition\` como constraint | fechada |
| D-18 | Catálogos usam \`as const satisfies FeedbackCatalog\` | fechada |
| D-19 | Definição inline é proibida, mas sem branding/runtime helper na v1 | fechada |
| D-20 | \`notify()\` seleciona campos explicitamente; não usa spread | fechada |
| D-21 | \`notify()\` ignora ID do manager e não captura exceções | fechada |
| D-22 | Erro técnico não é conteúdo público | fechada |
| D-23 | Sem sanitizer HTML/redactor universal na v1 | fechada |
| D-24 | Valores externos reutilizam presentation formatter/normalizer do domínio; não existe sanitizer próprio de \`notify()\` | fechada |
| D-25 | Sem fallback automático dentro de \`notify()\` | fechada |
| D-26 | Timeout/prioridade não são expostos na v1 | fechada |
| D-27 | \`error\` não implica prioridade \`high\` | fechada |
| D-28 | Loading/promise lifecycle fora da v1 | fechada |
| D-29 | Dedupe/id/update/close fora da v1 | fechada |
| D-30 | Actions fora da v1; callbacks nunca no catálogo | fechada |
| D-31 | Observabilidade fora da v1 | fechada |
| D-32 | TanStack Query é compatível, mas não dependência de \`notify()\` | fechada |
| D-33 | Fase 1 usa callbacks de mutation tipados quando necessário | fechada |
| D-34 | \`mutation.meta.feedback\` só após repetição comprovada | fechada |
| D-35 | Nenhum Toast automático para toda mutation | fechada |
| D-36 | Nenhum Toast global automático para query errors | fechada |
| D-37 | Testes de infraestrutura ficam em \`tests/unit/app/feedback/\` | fechada |
| D-38 | Testes de catálogo com lógica ficam em \`tests/unit/pages/<domain>/content/\` | fechada |
| D-39 | Enforcement futuro usa \`no-restricted-imports\`, preservando \`Toaster\` | fechada |
| D-40 | Documentação/auditoria permanece isolada em \`audits/feedback-notify/\` | executada |

## Alternativas rejeitadas

| Alternativa | Razão |
|---|---|
| \`t()\` | conflita semanticamente com i18n |
| \`useNotify()\` | não há Hook a reutilizar |
| \`notify.success/error\` | cria segunda fonte de verdade da severidade |
| \`notify("units.updated")\` | introduz resolver/registry runtime sem necessidade |
| objeto inline em \`notify()\` | mantém hardcode e dispersão |
| catálogo global único | reduz ownership de domínio |
| Provider/Context adicional | manager global Base UI já resolve despacho externo à árvore |
| store/event bus | nenhuma necessidade funcional |
| sanitizer HTML | contrato não aceita HTML |
| sanitizer/formatter genérico dentro de \`notify()\` | duplicaria regras de apresentação já existentes nos domínios |
| parser universal de erros em \`notify()\` | mistura infraestrutura com integração/domínio |
| Toast para toda mutation | produz feedback indevido |
| Toast global para queries | background refetch/reconnect podem gerar ruído |
| callbacks dentro do catálogo | mistura conteúdo e comportamento |
| expor ID retornado por \`toast.add\` | acopla consumidores ao lifecycle do primitive |
| exigir \`description\` sempre | força texto redundante em eventos autoexplicativos |

## Fora da v1, mas compatíveis com o desenho

Não são decisões pendentes; estão explicitamente fora do escopo:
- deduplicação por ID;
- \`toast.promise\`;
- update/close;
- actions;
- timeout por definição;
- priority por definição;
- identificador semântico para observabilidade;
- telemetria;
- \`mutation.meta.feedback\`;
- barrel \`@/app/feedback\`;
- lint customizado para proibir objeto literal em \`notify()\`.

Qualquer inclusão exige novo caso de uso e nova decisão documentada.

## Enforcement ESLint decidido

Após o piloto/migração, adicionar uma regra específica para produção que:
- restrinja \`@/components/ui/toast\` e caminhos relativos equivalentes;
- permita somente \`Toaster\` aos consumidores normais;
- exclua \`src/app/feedback/notify.ts\` dessa restrição;
- preserve a restrição já existente contra \`@tests/*\`.

Forma esperada, a ser adaptada à sintaxe final da config existente:

\`\`\`js
{
  files: ["src/**/*.{ts,tsx}"],
  ignores: ["src/app/feedback/notify.ts"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@tests/*"],
            message:
              "Código de produção não deve importar infraestrutura de testes.",
          },
          {
            group: [
              "@/components/ui/toast",
              "**/components/ui/toast",
            ],
            allowImportNames: ["Toaster"],
            message:
              "Use notify() para feedback transitório; Toaster é reservado à composição da aplicação.",
          },
        ],
      },
    ],
  },
}
\`\`\`

O \`src/components/ui\` atual já é ignorado globalmente pelo ESLint. \`notify.ts\` permanece sujeito ao bloco existente de \`@tests/*\`.

## Precondições de execução — não são decisões arquiteturais

Antes do primeiro código:
1. reaudar a HEAD atual da \`main\`;
2. confirmar que Toast/Provider/QueryClient/configs não mudaram;
3. identificar um fluxo mutável real para o piloto;
4. identificar os formatadores/normalizadores de apresentação aplicáveis aos valores dinâmicos desse fluxo;
5. confirmar que não surgiu consumidor direto de Toast;
6. atualizar esta documentação se alguma premissa mudou;
7. receber aprovação explícita para implementar.

Essas precondições não reabrem o contrato; apenas verificam se a realidade do repositório continua compatível com ele.
