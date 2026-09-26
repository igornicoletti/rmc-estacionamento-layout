# Plano de diretórios, nomes e fronteiras

**Status:** estrutura fechada para aprovação; nenhum caminho funcional foi criado.

## 1. Produção futura

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

Demais domínios seguem:

\`\`\`text
src/pages/clients/content/clients-feedback.ts
src/pages/users/content/users-feedback.ts
\`\`\`

## 2. \`src/app/feedback\`

Justificativa:
- \`notify()\` é infraestrutura de aplicação;
- não é primitive visual;
- não é utilitário genérico independente do produto;
- não pertence a um domínio específico;
- não exige React Context.

Arquivos v1:
- \`feedback-contract.ts\`: tipos do contrato;
- \`notify.ts\`: único adapter permitido ao manager de Toast.

Não criar na v1:
- provider;
- context;
- hook;
- service class;
- registry;
- resolver global;
- pipeline em arquivos separados;
- barrel.

## 3. \`<domain>/content\`

Catálogos são conteúdo de domínio e ficam em:

\`\`\`text
src/pages/<domain>/content/<domain>-feedback.ts
\`\`\`

Isso não implica migração de outros conteúdos existentes. O diretório passa a ser o ownership dos novos contratos de feedback daquele domínio.

## 4. Nomenclatura

Tipos:
- \`FeedbackType\`
- \`FeedbackDefinition\`
- \`FeedbackFactory\`
- \`FeedbackCatalog\`

Dispatcher:
- \`notify\`

Catálogo:
- constante: \`<DOMAIN>_FEEDBACK\`;
- arquivo: \`<domain>-feedback.ts\`.

Entradas:
- nomeadas pelo evento/resultado, não por UI ou severidade.

## 5. Imports canônicos

Consumidor:

\`\`\`ts
import { notify } from "@/app/feedback/notify"
import { UNITS_FEEDBACK } from "@/pages/units/content/units-feedback"
\`\`\`

Catálogo:

\`\`\`ts
import type { FeedbackCatalog } from "@/app/feedback/feedback-contract"
\`\`\`

\`notify.ts\`:

\`\`\`ts
import type { FeedbackDefinition } from "@/app/feedback/feedback-contract"
import { toast } from "@/components/ui/toast"
\`\`\`

Não criar barrel na v1. Imports explícitos preservam ownership e evitam uma API pública maior do que o necessário.

## 6. Grafo permitido

\`\`\`text
feature/page/component
   ├─> pages/<domain>/content/*-feedback
   └─> app/feedback/notify

pages/<domain>/content/*-feedback
   └─> app/feedback/feedback-contract (type-only)

app/feedback/notify
   ├─> app/feedback/feedback-contract (type-only)
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
- componentes UI;
- manager de Toast;
- serviços HTTP;
- DTO amplo sem necessidade.

Factories são funções puras.

## 8. Testes futuros

Infraestrutura espelha \`src/app/feedback\`:

\`\`\`text
tests/
└─ unit/
   └─ app/
      └─ feedback/
         ├─ feedback-contract.test.ts
         └─ notify.test.ts
\`\`\`

Catálogo com lógica própria:

\`\`\`text
tests/
└─ unit/
   └─ pages/
      └─ units/
         └─ content/
            └─ units-feedback.test.ts
\`\`\`

Isso cria subtrees novos e não mistura os arquivos com testes existentes.

## 9. ESLint futuro

Após o piloto:
- consumidores normais podem importar somente \`Toaster\` do módulo visual;
- \`notify.ts\` é a exceção autorizada para importar o manager;
- paths relativos equivalentes também entram na restrição;
- a configuração existente de \`@tests/*\` deve continuar efetiva.

A forma normativa está registrada em \`decision-register.md\`.

## 10. Documentação desta auditoria

\`\`\`text
audits/feedback-notify/
├─ README.md
├─ docs/
├─ research/
└─ tests/
\`\`\`

A documentação não deve ser movida para \`src/\` ou misturada aos testes executáveis.
