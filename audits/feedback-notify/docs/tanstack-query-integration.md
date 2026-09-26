# Integração com TanStack Query

## 1. Decisão

\`notify()\` não depende de TanStack Query.

A v1 usa callbacks locais de mutation quando o feedback faz parte do efeito de uma operação. Integração por \`mutation.meta\` fica fora da v1 e só será adotada mediante repetição comprovada de feedback estático.

## 2. Base oficial

TanStack Query documenta que:
- \`meta\` é payload adicional armazenado na mutation;
- ele pode ser lido onde a mutation está disponível, inclusive callbacks globais do \`MutationCache\`;
- callbacks globais executam para todas as mutations do cache;
- nesses callbacks, \`data\` e \`variables\` são \`unknown\`;
- \`mutationMeta\` pode ser tipado globalmente por \`Register\`.

Referências:
- https://tanstack.com/query/latest/docs/framework/react/reference/interfaces/UseMutationOptions
- https://tanstack.com/query/latest/docs/framework/react/reference/interfaces/MutationCacheConfig
- https://tanstack.com/query/latest/docs/framework/react/typescript

## 3. V1 — callback local

Feedback estático:

\`\`\`ts
useMutation({
  mutationFn: updateUnit,

  onError: () => {
    notify(UNITS_FEEDBACK.updateFailed)
  },
})
\`\`\`

Feedback dinâmico vindo de \`data\`:

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

Feedback vindo de \`variables\`:

\`\`\`ts
onSuccess: (_data, variables) => {
  notify(
    UNITS_FEEDBACK.deleted({
      unitName: variables.unitName,
    }),
  )
}
\`\`\`

Esse modelo preserva inferência dos tipos reais da mutation.

## 4. Classificação de erro

\`notify()\` não recebe \`error\`.

Quando a operação possui erros semanticamente diferentes:

\`\`\`ts
onError: (error) => {
  if (isUnitConflict(error)) {
    notify(UNITS_FEEDBACK.conflict)
    return
  }

  notify(UNITS_FEEDBACK.updateFailed)
}
\`\`\`

A classificação pertence à integração/domínio que conhece o erro.

## 5. \`mutate\` callback versus \`useMutation\` callback

Callbacks configurados em \`useMutation\` pertencem à mutation e são adequados para efeitos que devem ocorrer mesmo que a composição de UI mude.

Callbacks adicionais passados a \`mutate(..., { onSuccess })\` são mais apropriados para efeitos específicos do componente; a documentação alerta que esses callbacks podem não executar se o componente desmontar antes da conclusão.

Regra do projeto:
- feedback de resultado da operação deve preferir callbacks configurados em \`useMutation\`;
- callbacks no \`mutate\` ficam reservados a efeitos estritamente locais de UI.

## 6. Evolução por metadata

Somente para feedback estático repetitivo:

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

Um \`MutationCache\` global poderia encaminhar essas definições para \`notify()\`.

## 7. Critério objetivo para adotar metadata

Metadata só entra quando:
1. houver múltiplas mutations reais repetindo o mesmo boilerplate estático;
2. feedback não depender de \`data\`, \`variables\` ou classificação específica;
3. o ganho de remoção de repetição superar a indireção;
4. \`mutationMeta\` for tipado globalmente;
5. ausência de \`meta.feedback\` continuar significando ausência de Toast automático.

Não existe quantidade numérica arbitrária mínima; a decisão deve ser justificada por duplicação real no diff/auditoria.

## 8. Proibições

Nunca:

\`\`\`text
toda mutation success -> notify(success)
toda mutation error   -> notify(error)
\`\`\`

Não adicionar \`MutationCache\` só para criar uma camada "centralizada".

## 9. Queries

Não haverá Toast global automático para query errors.

Razões:
- retries;
- background refetch;
- reconnect;
- múltiplos observers;
- erro de leitura costuma ter representação contextual melhor.

Exceção futura exige decisão específica, não reutilização automática da política de mutations.

## 10. Tipagem futura de metadata

Se adotada:

\`\`\`ts
interface AppMutationMeta extends Record<string, unknown> {
  feedback?: {
    success?: FeedbackDefinition
    error?: FeedbackDefinition
  }
}

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: AppMutationMeta
  }
}
\`\`\`

Esse exemplo é direcional; a versão final deverá evitar permitir objeto inline fora dos catálogos e respeitar o contrato vigente no momento da adoção.

## 11. Não impacto

A integração futura muda somente a origem do despacho.

O contrato continua:

\`\`\`ts
notify(FeedbackDefinition): void
\`\`\`

Catálogos e adapter não precisam ser redesenhados.
