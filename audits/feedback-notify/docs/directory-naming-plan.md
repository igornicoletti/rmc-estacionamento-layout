# Plano de diretórios, nomes e fronteiras

**Status:** estrutura v1 implementada e mantida como contrato.

## 1. Infraestrutura transversal

```text
src/app/feedback/
├─ feedback-contract.ts
└─ notify.ts
```

Responsabilidades:
- `feedback-contract.ts`: `FeedbackType`, `FeedbackPriority`, `FeedbackDefinition`, `FeedbackFactory` e `FeedbackCatalog`;
- `notify.ts`: único adapter autorizado ao manager de Toast.

Não criar na v1:
- Provider/Context;
- Hook;
- service class;
- registry;
- resolver global;
- sanitizer;
- pipeline fragmentado;
- barrel público.

## 2. Ownership dos catálogos

### Domínio/produto

Padrão:

```text
src/<scope>/<domain>/content/<domain>-feedback.ts
```

Exemplos implementados:
- `src/app/session/content/session-feedback.ts`;
- `src/pages/clients/content/clients-feedback.ts`.

Nomenclatura:
- constante: `<DOMAIN>_FEEDBACK`;
- arquivo: `<domain>-feedback.ts`;
- entradas nomeadas pelo evento/resultado.

### Escopo reutilizável

Quando o evento é realmente genérico e compartilhado por vários domínios, o catálogo permanece junto ao componente/infraestrutura que é semanticamente proprietário do comportamento.

Exemplo implementado:

```text
src/components/data-table/
├─ actions/
│  └─ copy-data-table-record.ts
└─ data-table-feedback.ts
```

Isso evita duplicar o mesmo feedback de cópia de registro em Clients, Units e outros consumidores.

## 3. Presentation helpers

Catálogos podem importar formatadores/normalizadores puros do mesmo domínio/escopo quando precisarem interpolar valores externos.

Não mover sanitização existente para a infraestrutura de feedback nem duplicar algoritmos de casing, Unicode, whitespace ou formatação.

## 4. Operações técnicas

Utilitários técnicos reutilizáveis não possuem feedback visual embutido.

Exemplo:

```text
src/lib/copy-to-clipboard.ts
```

expõe somente a operação de Clipboard. A ação/orquestrador proprietário trata a Promise e seleciona o catálogo apropriado.

Side effects reutilizáveis de DataTable ficam em `data-table/actions`, não em `data-table/core`.

## 5. Imports canônicos

Consumidor de domínio:

```ts
import { notify } from "@/app/feedback/notify"
import { DOMAIN_FEEDBACK } from ".../content/domain-feedback"
```

Ação reutilizável:

```ts
import { notify } from "@/app/feedback/notify"
import { SCOPE_FEEDBACK } from ".../scope-feedback"
```

Catálogo:

```ts
import type { FeedbackCatalog } from "@/app/feedback/feedback-contract"
```

Adapter:

```ts
import type { FeedbackDefinition } from "@/app/feedback/feedback-contract"
import { toast } from "@/components/ui/toast"
```

Imports explícitos são preferidos na v1; não criar barrel sem necessidade comprovada.

## 6. Grafo permitido

```text
feature/component
   ├─> owner feedback catalog
   └─> app/feedback/notify ou action reutilizável

owner feedback catalog
   └─> app/feedback/feedback-contract (type-only)

reusable action
   ├─> owner feedback catalog
   ├─> app/feedback/notify
   └─> operação técnica reutilizável

app/feedback/notify
   ├─> app/feedback/feedback-contract (type-only)
   └─> components/ui/toast

components/ui/toast
   X-> app/feedback
   X-> catálogos
```

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

Factories permanecem puras.

## 8. Testes

Infraestrutura:

```text
tests/unit/app/feedback/
├─ feedback-contract.test.ts
└─ notify.test.ts
```

Ações reutilizáveis espelham seu diretório de produção:

```text
tests/unit/components/data-table/actions/
└─ copy-data-table-record.test.ts
```

Operações técnicas recebem teste próprio quando seu contrato muda:

```text
tests/unit/lib/copy-to-clipboard.test.ts
```

Fluxos reais recebem teste no escopo correspondente quando o feedback faz parte do comportamento relevante.

Catálogo com lógica própria pode receber teste junto ao domínio; não criar testes apenas para congelar copy estática.

## 9. ESLint

O enforcement está implementado:
- consumidores normais só podem importar `Toaster` do módulo visual quando necessário;
- o manager fica restrito ao adapter;
- caminhos relativos equivalentes também são cobertos;
- a regra de imports de testes em produção permanece ativa.

A configuração usa `no-restricted-imports` com mecanismos nativos do ESLint.

## 10. Documentação

A auditoria permanece em:

```text
audits/feedback-notify/
├─ README.md
├─ docs/
├─ research/
└─ tests/
```

Essa documentação não é dependência da aplicação e não deve ser misturada aos testes executáveis.
