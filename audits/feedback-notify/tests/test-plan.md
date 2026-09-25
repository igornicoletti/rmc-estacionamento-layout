# Plano independente de testes

**Status:** planejamento. Nenhum teste executável adicionado nesta branch.

## 1. Isolamento futuro

Criar novo subtree:

\`\`\`text
tests/unit/feedback/
├─ notify.test.ts
└─ feedback-contract.test.ts
\`\`\`

Não editar testes existentes apenas para acomodar a infraestrutura.

Testes de catálogo do domínio somente quando houver comportamento:

\`\`\`text
tests/unit/pages/units/units-feedback.test.ts
\`\`\`

O \`vitest.config.ts\` atual já inclui \`tests/unit/**/*\`, portanto \`tests/unit/feedback/\` não exige alteração de include.

## 2. Filosofia

Testing Library recomenda testes próximos ao uso real e evita detalhes internos. Vitest oferece mocks/spies para isolar side effects.

Para o dispatcher, o comportamento próprio é: encaminhar uma definição válida ao adapter/manager esperado. Não precisamos testar Base UI.

## 3. Casos mínimos de \`notify()\`

- encaminha \`title\`, \`description\` e \`type\` sem mutação arbitrária;
- chama o manager exatamente uma vez por invocação;
- não adiciona timeout/priority não definidos sem política explícita;
- não depende de React render para funcionar.

## 4. Contrato TypeScript

O typecheck deve demonstrar:
- \`type: "sucess"\` é inválido;
- definição sem \`title\` falha;
- definição sem \`description\` falha enquanto a decisão O-01 permanecer;
- factory cujo retorno possui \`type\` inválido falha;
- parâmetro dinâmico obrigatório ausente falha;
- parâmetro dinâmico de tipo incorreto falha;
- inferência dos parâmetros da factory permanece específica.

Evitar casts para satisfazer testes de tipo.

## 5. Factories

Testar factory somente quando houver lógica que possa quebrar:
- pluralização;
- branches;
- formatação;
- seleção condicional de mensagem.

Não testar cada literal estático apenas para verificar redação.

## 6. Segurança

Quando houver resolver de erro em um domínio, testar que:
- erro não classificado resulta em definição pública controlada;
- \`error.message\` não é repassado;
- valores sensíveis não são interpolados sem contrato explícito.

Esses testes pertencem ao resolver/feature que classifica o erro, não a \`notify()\` quando o dispatcher não conhece \`Error\`.

## 7. TanStack Query

Fase 1:
- testar callback de mutation somente quando seu comportamento de feedback fizer parte do fluxo do domínio;
- mockar \`notify()\` de maneira tipada;
- não testar internals do MutationCache.

Se \`mutation.meta\` for adotado futuramente:
- metadata ausente não notifica;
- success configurado notifica uma vez;
- error configurado notifica uma vez;
- metadata continua opt-in;
- types globais impedem metadata inválido.

## 8. ESLint

Após enforcement, validar fixture/caso de lint quando viável:
- feature importando \`toast\` deve falhar;
- \`notify.ts\` pode importar \`toast\`.

Não introduzir teste duplicado se a própria execução de \`npm run lint\` já cobre suficientemente a regra.

## 9. Não testar

- animações do Toast;
- classes Tailwind do primitive;
- implementação interna do Base UI;
- funcionamento do \`toast.add\` da biblioteca;
- cores;
- ícones salvo quando comportamento próprio depender deles;
- snapshots de copy estática.

## 10. Gate futuro

Bloco de implementação só é aceito com:
- lint;
- typecheck;
- Vitest focado;
- suite completa relevante;
- build;
- ausência de alterações não relacionadas.
