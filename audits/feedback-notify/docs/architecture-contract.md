# Contrato arquitetural de feedback transitório

**Status:** contrato aprovado para implementação v1 em 26/09/2026.

## 1. Decisão central

Uso estático:

\`\`\`ts
notify(UNITS_FEEDBACK.createFailed)
\`\`\`

Uso dinâmico:

\`\`\`ts
notify(
  UNITS_FEEDBACK.updated({
    unitName,
  }),
)
\`\`\`

A feature escolhe o evento ocorrido. Ela não monta Toast nem altera a definição.

## 2. Contrato v1

\`\`\`ts
export type FeedbackType =
  | "success"
  | "info"
  | "warning"
  | "error"

export interface FeedbackDefinition {
  readonly title: string
  readonly description?: string
  readonly type: FeedbackType
}

export type FeedbackFactory =
  (...args: never[]) => FeedbackDefinition

export type FeedbackCatalog =
  Readonly<Record<string, FeedbackDefinition | FeedbackFactory>>
\`\`\`

Uso normativo:

\`\`\`ts
export const UNITS_FEEDBACK = {
  createFailed: {
    title: "Não foi possível cadastrar a unidade",
    description: "Tente novamente.",
    type: "error",
  },

  copied: {
    title: "Conteúdo copiado",
    type: "success",
  },

  updated: ({ unitName }: { unitName: string }) => ({
    title: "Unidade atualizada",
    description: \`\${unitName} foi atualizada com sucesso.\`,
    type: "success",
  }),
} as const satisfies FeedbackCatalog
\`\`\`

### Por que \`FeedbackFactory = (...args: never[])\`

Esse tipo serve como constraint do catálogo: aceita factories específicas e valida que o retorno é uma \`FeedbackDefinition\`, sem substituir a assinatura concreta inferida de cada função.

Regra adicional de estilo: toda factory dinâmica da v1 recebe exatamente **um objeto nomeado** como parâmetro. Essa regra é normativa mesmo que o constraint estrutural não tente codificá-la com um helper genérico mais complexo.

## 3. \`title\` obrigatório; \`description\` opcional

Decisão final:
- \`title\` é obrigatório e deve comunicar sozinho o resultado;
- \`description\` só existe quando acrescenta contexto, consequência ou próxima ação;
- não criar descrição redundante apenas para preencher o Toast.

Exemplo suficiente:

\`\`\`ts
copied: {
  title: "E-mail copiado",
  type: "success",
}
\`\`\`

Exemplo em que descrição agrega valor:

\`\`\`ts
updateFailed: {
  title: "Não foi possível atualizar a unidade",
  description: "Tente novamente.",
  type: "error",
}
\`\`\`

Strings vazias são proibidas por convenção e review; a v1 não adiciona validator runtime apenas para verificar conteúdo interno compilado.

## 4. \`notify()\`

Assinatura normativa:

\`\`\`ts
export function notify(
  feedback: FeedbackDefinition,
): void
\`\`\`

Comportamento:
1. recebe definição já resolvida;
2. seleciona explicitamente apenas \`title\`, \`description\` e \`type\`;
3. chama o manager global existente;
4. ignora deliberadamente o ID retornado pelo manager;
5. retorna \`void\`;
6. não captura nem transforma exceções do manager.

Forma conceitual:

\`\`\`ts
toast.add({
  title: feedback.title,
  description: feedback.description,
  type: feedback.type,
})
\`\`\`

Não usar spread do objeto no adapter. A seleção explícita impede que novas propriedades do catálogo sejam encaminhadas ao primitive sem decisão arquitetural.

## 5. Responsabilidades

### Catálogo do domínio

Responsável por:
- linguagem pública;
- \`type\`;
- factories puras;
- interpolação;
- reutilização de formatadores/normalizadores puros já existentes no próprio domínio quando o valor dinâmico precisar de apresentação consistente.

Não pode:
- executar I/O;
- chamar \`notify()\`;
- chamar Toast;
- navegar;
- acessar QueryClient;
- invalidar/refazer queries;
- receber DTO completo quando valores escalares bastam;
- decidir autorização ou regra de negócio;
- duplicar sanitizer/formatter já existente.

### \`notify()\`

Responsável apenas por adaptar \`FeedbackDefinition\` para o manager.

Não pode:
- decidir se a operação teve sucesso;
- receber \`Error\`;
- mapear status HTTP;
- interpretar Supabase/RBAC/API;
- escolher fallback automaticamente;
- fazer retry;
- navegar;
- persistir;
- fazer logging;
- sanitizar/formatar dados de domínio;
- deduplicar na v1.

### \`components/ui/toast\`

Responsável por primitive, renderer, viewport, ícones, ações visuais e integração Base UI. Não conhece domínios.

## 6. Conteúdo dinâmico

Conteúdo dinâmico faz parte da v1.

Regra:

\`\`\`ts
event: ({ valueA, valueB }: Params) => FeedbackDefinition
\`\`\`

Parâmetros:
- um único objeto nomeado;
- tipos específicos;
- somente valores necessários à mensagem;
- não receber \`Error\`, \`Response\`, DTO amplo, QueryClient ou objeto de infraestrutura;
- nullable/optional somente quando a própria mensagem prevê esse estado.

### Normalização dos valores interpolados

Regra final:
- \`notify()\` nunca sanitiza o conteúdo;
- a factory pode reutilizar um formatter/normalizer puro já existente no domínio;
- se a camada chamadora já trabalha com um valor de apresentação oficialmente produzido pelo domínio, ele pode ser passado diretamente;
- não criar um segundo algoritmo de casing, correção ortográfica, Unicode ou whitespace dentro do catálogo.

Exemplo conceitual para Units:

\`\`\`ts
updated: ({ unitName }: { unitName: string }) => ({
  title: "Unidade atualizada",
  description: \`\${formatUnitName(unitName)} foi atualizada com sucesso.\`,
  type: "success",
})
\`\`\`

Isso reutiliza a apresentação existente e mantém a regra fora de \`notify()\`.

Correto:

\`\`\`ts
notify(
  UNITS_FEEDBACK.exported({
    count,
    fileName,
  }),
)
\`\`\`

Proibido:

\`\`\`ts
notify({
  ...UNITS_FEEDBACK.exported,
  description: customText,
})
\`\`\`

## 7. Definição inline

Proibido:

\`\`\`ts
notify({
  title: "Unidade atualizada",
  type: "success",
})
\`\`\`

A v1 não introduz branding/helper runtime apenas para impedir structural typing. A regra será garantida por arquitetura, review e, se necessário após o piloto, lint específico. Não distorcer o contrato TypeScript para resolver um problema que ainda não exige infraestrutura própria.

## 8. Nomenclatura das entradas

Usar eventos/resultados:
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

Evitar nomes orientados ao componente ou à severidade:
- \`success\`
- \`error\`
- \`toastSuccess\`
- \`formError\`
- \`tableError\`

## 9. Segurança

Erro técnico deve ser classificado antes:

\`\`\`text
Error / Response
      ↓
classificação da operação/domínio
      ↓
FeedbackDefinition controlada
      ↓
notify()
\`\`\`

Proibido propagar diretamente:
- \`error.message\`;
- stack;
- status text arbitrário;
- SQL;
- nome de tabela;
- endpoint interno;
- token/credencial;
- identificador sensível sem necessidade explícita;
- mensagem crua de banco/serviço.

A v1 não possui sanitizer HTML porque HTML não entra no contrato. Também não possui redactor universal: conteúdo inseguro não deve chegar ao catálogo/dispatcher.

## 10. Tipos e conteúdo

\`FeedbackType\` v1:
- \`success\`: ação concluída;
- \`info\`: informação transitória neutra;
- \`warning\`: condição que requer atenção, sem caracterizar necessariamente falha;
- \`error\`: ação não concluída.

\`loading\` fica fora do contrato comum porque representa lifecycle, não resultado final.

## 11. Timeout e prioridade

A v1 não envia \`timeout\` nem \`priority\`.

Consequência:
- timeout segue o default do Base UI;
- prioridade segue \`low\`;
- \`error\` nunca implica automaticamente prioridade \`high\`.

Qualquer mudança futura exige decisão explícita de política.

## 12. Dedupe, ID, update e close

Fora da v1.

Embora Base UI ofereça ID, upsert, \`update\` e \`close\`, \`notify()\` retorna \`void\` e não expõe o manager.

Caso surja lifecycle real, uma extensão separada será desenhada; consumidores não devem guardar IDs do primitive por fora do adapter.

## 13. Actions

Fora da v1. Callbacks nunca pertencem ao catálogo.

Se action for necessária no futuro:
- texto/definição permanece em contrato de conteúdo;
- comportamento permanece no chamador/application layer;
- API será desenhada separadamente.

## 14. Promise/lifecycle

Fora da v1. Não encapsular \`toast.promise\` preventivamente.

Evitar duplicação:

\`\`\`text
Button: [spinner] Salvando…
Toast:  Salvando…
\`\`\`

Lifecycle só será adotado quando a operação precisar de feedback transitório além do ponto de interação.

## 15. Fallbacks

\`notify()\` não possui fallback automático.

Se uma operação precisa comunicar erro inesperado, o domínio/application scope deve escolher uma definição genérica controlada. Isso mantém classificação de erro fora do adapter.

## 16. Observabilidade

Fora da v1. \`notify()\` não loga nem envia analytics.

O ponto único preserva possibilidade futura, mas instrumentação deverá receber contrato próprio e não usar conteúdo textual/sensível como identidade de evento.

## 17. Critério de sucesso

O consumidor conhece apenas:

\`\`\`ts
notify(DOMAIN_FEEDBACK.event)
\`\`\`

ou:

\`\`\`ts
notify(
  DOMAIN_FEEDBACK.event({
    namedData,
  }),
)
\`\`\`

Se a feature precisar conhecer manager, timeout, priority, ID, pipeline ou Base UI, a abstração falhou.
