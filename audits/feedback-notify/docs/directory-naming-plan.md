# Plano de diretórios, nomes e fronteiras

**Importante:** esta é a estrutura proposta para implementação futura. Nenhum destes caminhos de produção/teste foi criado nesta branch.

## 1. Estrutura de produção proposta

\`\`\`text
src/
├─ app/
│  └─ feedback/
│     ├─ feedback-contract.ts
│     └─ notify.ts
│
└─ pages/
   └─ units/
      ├─ components/
      ├─ data/
      ├─ model/
      └─ content/
         └─ units-feedback.ts
\`\`\`

Outros domínios:

\`\`\`text
src/pages/clients/content/clients-feedback.ts
src/pages/users/content/users-feedback.ts
\`\`\`

## 2. Por que \`src/app/feedback\`

\`notify()\` é infraestrutura transversal da aplicação, mas não é primitive visual. Portanto não pertence a:
- \`components/ui\`;
- \`lib\` genérico;
- domínio Units/Clients;
- React Context.

## 3. Por que \`<domain>/content\`

A definição textual pertence ao domínio. \`content\` permite, no futuro, contratos próprios para outras famílias de conteúdo sem tornar o Toast dono de todo texto do domínio.

Esta auditoria não migra nem depende de sistemas de copy existentes.

## 4. Nomes

Infraestrutura:
- \`feedback-contract.ts\`
- \`notify.ts\`

Catálogo:
- constante: \`<DOMAIN>_FEEDBACK\`
- arquivo: \`<domain>-feedback.ts\`

Exemplo:
\`\`\`ts
UNITS_FEEDBACK.updated
CLIENTS_FEEDBACK.createFailed
\`\`\`

## 5. Imports

Consumidor:
\`\`\`ts
import { notify } from "@/app/feedback/notify"
import { UNITS_FEEDBACK } from "@/pages/units/content/units-feedback"
\`\`\`

Não criar barrel automaticamente. Avaliar apenas se o padrão do repositório justificar.

## 6. Grafo de dependências permitido

\`\`\`text
page/component
   ├─> domain/content/*-feedback
   └─> app/feedback/notify

domain/content/*-feedback
   └─> app/feedback/feedback-contract (type only quando possível)

app/feedback/notify
   ├─> app/feedback/feedback-contract
   └─> components/ui/toast

components/ui/toast
   X-> app/feedback
   X-> domain catalog
\`\`\`

## 7. Dependências proibidas em catálogos

Não importar:
- React;
- TanStack Query;
- router;
- QueryClient;
- componentes visuais;
- manager de Toast;
- serviços HTTP.

Factories devem ser puras.

## 8. Estrutura de testes futura

Criar subtree novo, sem editar testes existentes:

\`\`\`text
tests/
└─ unit/
   └─ feedback/
      ├─ notify.test.ts
      └─ feedback-contract.test.ts
\`\`\`

Testes específicos de catálogo podem ficar no domínio correspondente apenas quando houver lógica de factory relevante:

\`\`\`text
tests/unit/pages/units/units-feedback.test.ts
\`\`\`

Não adicionar testes de copy estática apenas para congelar redação.

## 9. Enforcement futuro

Depois que o piloto e a migração forem aprovados, configurar \`no-restricted-imports\` para restringir import do símbolo \`toast\` pelas features.

A regra não deve bloquear o próprio \`src/app/feedback/notify.ts\` nem ferramentas explicitamente autorizadas.

## 10. Estrutura documental desta auditoria

A documentação permanece isolada em:

\`\`\`text
audits/feedback-notify/
├─ README.md
├─ docs/
├─ research/
└─ tests/
\`\`\`

Ela não deve ser misturada aos arquivos funcionais do projeto.
