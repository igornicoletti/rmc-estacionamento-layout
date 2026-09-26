# Plano independente de testes

**Status:** planejamento fechado para aprovação. Nenhum teste executável foi adicionado nesta branch.

## 1. Estrutura futura

Infraestrutura:

\`\`\`text
tests/
└─ unit/
   └─ app/
      └─ feedback/
         ├─ feedback-contract.test.ts
         └─ notify.test.ts
\`\`\`

Catálogo com lógica:

\`\`\`text
tests/
└─ unit/
   └─ pages/
      └─ units/
         └─ content/
            └─ units-feedback.test.ts
\`\`\`

Esses caminhos são novos e não exigem alterar o include atual do Vitest.

## 2. Escopo

Testar somente comportamento do projeto.

Não testar Base UI, Tailwind, animações ou detalhes visuais que a aplicação não implementa.

## 3. \`feedback-contract.test.ts\`

Objetivos de typecheck:
- aceita \`success | info | warning | error\`;
- rejeita \`"sucess"\` e outros valores;
- exige \`title\`;
- aceita ausência de \`description\`;
- rejeita retorno de factory que não satisfaça \`FeedbackDefinition\`;
- preserva parâmetros concretos de factory;
- rejeita parâmetro dinâmico ausente ou de tipo incorreto;
- confirma que \`as const satisfies FeedbackCatalog\` não degrada a assinatura da factory.

Ferramentas:
- \`expectTypeOf\` quando útil;
- \`@ts-expect-error\` para contratos negativos deliberados.

Evitar casts apenas para fazer o teste passar.

## 4. \`notify.test.ts\`

Mockar somente o manager exportado pelo módulo visual e verificar:
- exatamente uma chamada a \`toast.add\`;
- payload contém apenas \`title\`, \`description\` e \`type\`;
- \`description: undefined\` é aceitável ou omitida de forma equivalente;
- retorno público é \`undefined\`;
- ID retornado pelo mock não é exposto;
- nenhuma propriedade extra é encaminhada;
- erro lançado pelo mock não é silenciosamente engolido;
- nenhum sanitizer/formatter é executado pelo adapter.

Não montar árvore React; o dispatcher não depende de render.

## 5. Factories

Adicionar teste quando a factory possui lógica:
- pluralização;
- branch;
- formatação;
- reutilização de formatter/normalizer de apresentação.

Quando uma factory reutilizar, por exemplo, \`formatUnitName\`, o teste deve proteger o resultado observável da factory, não reimplementar os testes do formatter.

Factory que apenas interpola um valor já apresentado pode ser coberta pelo typecheck e pelo fluxo consumidor, sem snapshot de redação.

## 6. Segurança

Quando existir resolver/classificador de erro:
- erro não classificado escolhe definição pública controlada;
- \`error.message\` não é repassado;
- dados sensíveis não são interpolados sem contrato explícito.

Esses testes pertencem ao resolver/domínio, não a \`notify()\`.

## 7. TanStack Query

V1:
- testar feedback da mutation quando ele for comportamento observável relevante;
- preferir callback configurado em \`useMutation\`;
- mockar \`notify()\`, não internals do MutationCache.

Se metadata for adotado futuramente:
- ausência de metadata não notifica;
- success/error configurados notificam uma vez;
- metadata inválido falha no typecheck;
- nenhuma política global notifica mutations sem opt-in.

## 8. ESLint

Após enforcement:
- \`npm run lint\` deve falhar para consumidor importando manager/primitives de Toast;
- \`Toaster\` permanece importável onde necessário;
- \`notify.ts\` permanece exceção autorizada.

Não criar teste customizado se a própria execução do ESLint prova a regra de forma suficiente.

## 9. Não testar

- animações;
- classes;
- cor;
- ícones do primitive;
- stacking do Base UI;
- implementação de \`toast.add\`;
- timeout default da biblioteca;
- texto estático literal sem lógica;
- internals de React Query;
- internals de \`sanitizeErpText\` em testes do catálogo.

## 10. Gate futuro

Cada bloco deve passar:
- lint;
- typecheck;
- Vitest focado;
- suite relevante;
- build;
- revisão do diff;
- confirmação de ausência de alteração não relacionada.
