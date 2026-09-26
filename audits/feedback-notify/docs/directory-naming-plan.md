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
      │  └─ unit-presentation.ts
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
- sanitizer;
- pipeline em arquivos separados;
- barrel.

## 3. \`<domain>/content\`

Catálogos são conteúdo de domínio e ficam em:

\`\`\`text
src/pages/<domain>/content/<domain>-feedback.ts
\`\`\`

Isso não implica migração de outros conteúdos existentes. O diretório passa a ser o ownership dos novos contratos de feedback daquele domínio.

## 4. Relação com apresentação do domínio

Catálogos podem importar **formatadores/normalizadores puros de apresentação do mesmo domínio** quando precisarem interpolar dados externos de forma consistente.

Exemplo permitido:

\`\`\`text
pages/units/content/units-feedback
   └─> pages/units/model/unit-presentation
\`\`\`

Não mover \`sanitizeErpText\` para a infraestrutura de feedback e não duplicar suas regras.

Se o chamador já possui um valor oficialmente formatado para apresentação, a factory pode recebê-lo diretamente. O importante é existir uma única regra de apresentação para aquele dado.

## 5. Nomenclatura

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

## 6. Imports canônicos

Consumidor:

\`\`\`ts
import { notify } from "@/app/feedback/notify"
import { UNITS_FEEDBACK } from "@/pages/units/content/units-feedback"
\`\`\`

Catálogo:

\`\`\`ts
import type { FeedbackCatalog } from "@/app/feedback/feedback-contract"
\`\`\`

Quando necessário:

\`\`\`ts
import { formatUnitName } from "@/pages/units/model/unit-presentation"
\`\`\`

\`notify.ts\`:

\`\`\`ts
import type { FeedbackDefinition } from "@/app/feedback/feedback-contract"
import { toast } from "@/components/ui/toast"
\`\`\`

Não criar barrel na v1. Imports explícitos preservam ownership e evitam uma API pública maior do que o necessário.

## 7. Grafo permitido

\`\`\`text
feature/page/component
   ├─> pages/<domain>/content/*-feedback
   └─> app/feedback/notify

pages/<domain>/content/*-feedback
   ├─> app/feedback/feedback-contract (type-only)
   └─> pages/<domain>/model/*-presentation (opcional, puro)

app/feedback/notify
   ├─> app/feedback/feedback-contract (type-only)
   └─> components/ui/toast

components/ui/toast
   X-> app/feedback
   X-> domain catalog
\`\`\`

## 8. Dependências proibidas em catálogos

Não importar:
- React;
- TanStack Query;
- router;
- QueryClient;
- componentes UI;
- manager de Toast;
- serviços HTTP;
- DTO amplo sem necessidade.

Factories são funções puras. Import de formatter puro do próprio domínio é permitido.

## 9. Testes futuros

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

## 10. ESLint futuro

Após o piloto:
- consumidores normais podem importar somente \`Toaster\` do módulo visual;
- \`notify.ts\` é a exceção autorizada para importar o manager;
- paths relativos equivalentes também entram na restrição;
- a configuração existente de \`@tests/*\` deve continuar efetiva.

A forma normativa está registrada em \`decision-register.md\`.

## 11. Documentação desta auditoria

\`\`\`text
audits/feedback-notify/
├─ README.md
├─ docs/
├─ research/
└─ tests/
\`\`\`

A documentação não deve ser movida para \`src/\` ou misturada aos testes executáveis.
