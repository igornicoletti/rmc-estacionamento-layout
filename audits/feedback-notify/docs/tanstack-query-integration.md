# Integração com TanStack Query

## 1. Objetivo

Permitir evolução para feedback declarativo de mutations sem tornar \`notify()\` dependente de TanStack Query.

## 2. Capacidade oficial

TanStack Query documenta \`meta\` em mutations como payload adicional armazenado na entrada do MutationCache e disponível onde a mutation está acessível, inclusive callbacks globais.

Também permite tipar globalmente \`mutationMeta\` por module augmentation.

Referências:
- https://tanstack.com/query/latest/docs/framework/react/reference/interfaces/MutationOptions
- https://tanstack.com/query/latest/docs/framework/react/reference/interfaces/MutationCacheConfig
- https://tanstack.com/query/latest/docs/framework/react/typescript

## 3. Fase 1 — callbacks explícitos

Conteúdo estático:

\`\`\`ts
useMutation({
  mutationFn: updateUnit,
  onError: () => {
    notify(UNITS_FEEDBACK.updateFailed)
  },
})
\`\`\`

Conteúdo dinâmico vindo do resultado:

\`\`\`ts
useMutation({
  mutationFn: updateUnit,
  onSuccess: (unit) => {
    notify(
      UNITS_FEEDBACK.updated({
        unitName: unit.name,
      }),
    )
  },
})
\`\`\`

Conteúdo derivado das variables:

\`\`\`ts
onSuccess: (_data, variables) => {
  notify(
    UNITS_FEEDBACK.deleted({
      unitName: variables.unitName,
    }),
  )
}
\`\`\`

Vantagem: tipos naturais de \`data\` e \`variables\`, fluxo explícito e sem DSL adicional.

## 4. Evolução — metadata

Se surgirem muitos casos completamente estáticos e repetitivos:

\`\`\`ts
useMutation({
  mutationFn: archiveUnit,
  meta: {
    feedback: {
      success: UNITS_FEEDBACK.archived,
      error: UNITS_FEEDBACK.archiveFailed,
    },
  },
})
\`\`\`

Um \`MutationCache\` global poderia ler esse metadata e chamar \`notify()\`.

## 5. Por que não implementar já

Callbacks globais recebem dados amplos/unknown no nível do cache. Feedbacks dinâmicos frequentemente dependem de tipos específicos de:
- \`data\`;
- \`variables\`;
- erro classificado;
- contexto de negócio.

Criar imediatamente uma DSL capaz de resolver todos esses casos adicionaria indireção e casts antes de termos evidência de repetição.

## 6. Regra de adoção

Adicionar integração com \`mutation.meta\` somente quando o levantamento de mutations reais mostrar repetição relevante deste padrão:

\`\`\`ts
onSuccess: () => notify(STATIC_SUCCESS)
onError: () => notify(STATIC_ERROR)
\`\`\`

Metadata continua opt-in. Ausência de \`meta.feedback\` significa ausência de Toast automático.

## 7. Regra contra automação indiscriminada

Nunca:
\`\`\`text
qualquer mutation success -> Toast success
qualquer mutation error   -> Toast error
\`\`\`

Nem toda mutation precisa de feedback adicional.

## 8. Queries

Não introduzir Toast global para query error. Queries podem refazer requisições em background, reconnect e outros ciclos sem ação direta do usuário. Feedback visual persistente/contextual costuma ser mais apropriado.

## 9. Tipagem futura

Se metadata for adotado:

\`\`\`ts
declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: AppMutationMeta
  }
}
\`\`\`

Evitar casts espalhados como \`mutation.meta as ...\`.

## 10. Não impacto sobre o contrato

Mesmo após integração futura, o contrato continua sendo:

\`\`\`ts
notify(FeedbackDefinition)
\`\`\`

Metadata apenas muda a origem da chamada. Catálogos e dispatcher não precisam ser redesenhados.
