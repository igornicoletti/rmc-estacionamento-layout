# Contrato arquitetural de feedback transitório

**Status:** proposta. Nenhum código autorizado.

## 1. Decisão central

API pública canônica:

\`\`\`ts
notify(UNITS_FEEDBACK.updated)
\`\`\`

Conteúdo dinâmico:

\`\`\`ts
notify(
  UNITS_FEEDBACK.updated({
    unitName,
  }),
)
\`\`\`

A feature informa o evento ocorrido; não monta Toast.

## 2. Responsabilidades

### Domínio / catálogo

Responsável por:
- título;
- descrição;
- tipo;
- factories de conteúdo dinâmico;
- terminologia do domínio.

Não pode:
- executar I/O;
- navegar;
- invalidar queries;
- chamar \`notify()\`;
- chamar Toast;
- conhecer DTOs inteiros quando apenas um valor de apresentação é necessário.

### \`notify()\`

Responsável por:
- receber uma \`FeedbackDefinition\` já resolvida;
- aplicar apenas políticas transversais aprovadas;
- adaptar para o manager de Toast.

Não é responsável por:
- descobrir se a operação teve sucesso;
- interpretar qualquer \`Error\` universalmente;
- mapear HTTP/Supabase/RBAC;
- fazer retry;
- navegar;
- persistir;
- alterar query cache.

### \`components/ui/toast\`

Responsável apenas pela apresentação e integração Base UI. Não conhece catálogos de domínio.

## 3. Contrato mínimo v1

\`\`\`ts
type FeedbackType =
  | "success"
  | "info"
  | "warning"
  | "error"

interface FeedbackDefinition {
  title: string
  description: string
  type: FeedbackType
}
\`\`\`

Decisões:
- \`title\` obrigatório;
- \`description\` obrigatório inicialmente;
- somente \`string\`;
- sem HTML;
- sem \`ReactNode\`;
- sem \`loading\` no contrato comum;
- sem timeout/prioridade/action por definição na v1.

O Base UI aceita uma superfície maior; restringir a API da aplicação é intencional.

## 4. Catálogo

Formato:

\`\`\`ts
export const UNITS_FEEDBACK = {
  createFailed: {
    title: "Não foi possível cadastrar a unidade",
    description: "Tente novamente.",
    type: "error",
  },

  updated: ({ unitName }: { unitName: string }) => ({
    title: "Unidade atualizada",
    description: \`\${unitName} foi atualizada com sucesso.\`,
    type: "success",
  }),
} satisfies FeedbackCatalog
\`\`\`

O tipo exato de \`FeedbackCatalog\` deverá preservar a inferência das funções e validar seus retornos. Não aceitar solução que transforme parâmetros específicos das factories em \`unknown\`/genéricos inúteis.

## 5. Conteúdo dinâmico

Conteúdo dinâmico faz parte da fase 1.

Regras:
- factories puras;
- parâmetros por objeto nomeado;
- receber dados mínimos já apropriados para apresentação;
- não receber \`ApiResponse\`, \`Error\`, QueryClient ou objetos de infraestrutura;
- nenhuma possibilidade de override livre no call site.

Correto:

\`\`\`ts
notify(
  UNITS_FEEDBACK.exported({
    count,
    fileName,
  }),
)
\`\`\`

Incorreto:

\`\`\`ts
notify({
  ...UNITS_FEEDBACK.exported,
  description: customText,
})
\`\`\`

## 6. Nomenclatura dos eventos

Entradas descrevem evento/resultado:
- \`created\`
- \`updated\`
- \`deleted\`
- \`createFailed\`
- \`updateFailed\`
- \`deleteFailed\`
- \`exported\`
- \`exportFailed\`
- \`synchronized\`
- \`synchronizationFailed\`

Evitar:
- \`success\`
- \`error\`
- \`toastSuccess\`
- \`formError\`
- \`message1\`

## 7. API proibida

Não adotar:
\`\`\`ts
notify.success(...)
notify.error(...)
notify("units.updated")
notify({ title: "...", description: "...", type: "success" })
toast.add(...) // fora da infraestrutura autorizada
notify(error.message)
\`\`\`

A severidade pertence ao catálogo. Strings-token criariam registry/resolver desnecessário.

## 8. Erros e segurança

Erro técnico deve ser classificado antes de chegar ao dispatcher.

\`\`\`text
Error/Response
   ↓
regra conhecida da operação
   ↓
FeedbackDefinition controlada
   ↓
notify()
\`\`\`

Não propagar:
- stack;
- SQL;
- endpoint interno;
- token;
- CPF ou identificador sensível sem necessidade explícita;
- \`error.message\`;
- \`statusText\`;
- mensagens de banco.

## 9. Sanitização

Não criar sanitizer HTML na v1. O controle é estrutural: HTML/JSX não entram no contrato.

Também não criar um "normalizador mágico" que altere automaticamente capitalização, pontuação ou nomes. Linguagem é responsabilidade do catálogo.

## 10. Loading, promise e lifecycle

\`loading\` fica fora do contrato comum. Base UI já possui \`promise\`, \`update\` e \`close\`; não recriar essas capacidades antes de um caso real.

Não duplicar:
\`\`\`text
botão com Spinner "Salvando…"
+
Toast "Salvando…"
\`\`\`

Lifecycle de Toast deve ser reservado a operações cujo estado precisa sobreviver ao ponto de interação ou seja realmente útil fora dele.

## 11. Timeout

Base UI documenta 5000 ms como padrão. A v1 não expõe timeout por domínio. Caso seja necessário alterar, política global vem antes de overrides locais.

## 12. Prioridade

Base UI documenta \`low\` e \`high\`. A v1 não expõe prioridade no catálogo. \`error\` não implica \`high\`.

## 13. Deduplicação

Base UI atualiza um Toast quando \`add\` recebe um \`id\` existente. Preservar essa possibilidade, mas não adicionar \`id\` sem caso comprovado.

Deduplicação futura deve identificar operação/evento, não comparar texto.

## 14. Actions

Callbacks não pertencem ao catálogo. Se actions forem necessárias, texto e comportamento deverão continuar separados e receber contrato próprio.

## 15. Observabilidade

Não faz parte da v1. O ponto único \`notify()\` permite instrumentação futura, mas qualquer telemetria deverá usar identificador semântico e políticas próprias de dados.

## 16. Critério de sucesso

Para o consumidor, todo o sistema deve continuar reduzido a:

\`\`\`ts
notify(DOMAIN_FEEDBACK.event)
\`\`\`

ou:

\`\`\`ts
notify(DOMAIN_FEEDBACK.event({ namedData }))
\`\`\`

Se o consumidor precisar conhecer Base UI, timeout, priority, manager ou pipeline, a abstração falhou.
