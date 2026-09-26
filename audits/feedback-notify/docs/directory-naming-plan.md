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

## 2. Catálogos de domínio

Padrão:

```text
src/<scope>/<domain>/content/<domain>-feedback.ts
```

O primeiro piloto real utiliza o escopo de Session. Demais domínios seguem o mesmo princípio quando houver evento real.

Nomenclatura:
- constante: `<DOMAIN>_FEEDBACK`;
- arquivo: `<domain>-feedback.ts`;
- entradas nomeadas pelo evento/resultado, não pelo componente.

## 3. Presentation helpers

Catálogos podem importar formatadores/normalizadores puros do mesmo domínio quando precisarem interpolar valores externos.

Não mover sanitização existente para a infraestrutura de feedback nem duplicar algoritmos de casing, Unicode, whitespace ou formatação.

## 4. Imports canônicos

Consumidor:

```ts
import { notify } from "@/app/feedback/notify"
import { DOMAIN_FEEDBACK } from ".../content/domain-feedback"
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

## 5. Grafo permitido

```text
feature/component
   ├─> domain/content/*-feedback
   └─> app/feedback/notify

domain/content/*-feedback
   ├─> app/feedback/feedback-contract (type-only)
   └─> domain/model/*-presentation (opcional, puro)

app/feedback/notify
   ├─> app/feedback/feedback-contract (type-only)
   └─> components/ui/toast

components/ui/toast
   X-> app/feedback
   X-> domain catalog
```

## 6. Dependências proibidas em catálogos

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

## 7. Testes

Infraestrutura:

```text
tests/unit/app/feedback/
├─ feedback-contract.test.ts
└─ notify.test.ts
```

Fluxos reais recebem teste no escopo correspondente quando o feedback faz parte do comportamento relevante.

Catálogo com lógica própria pode receber teste junto ao domínio; não criar testes apenas para congelar copy estática.

## 8. ESLint

O enforcement está implementado:
- consumidores normais só podem importar `Toaster` do módulo visual quando necessário;
- o manager fica restrito ao adapter;
- caminhos relativos equivalentes também são cobertos;
- a regra de imports de testes em produção permanece ativa.

A configuração usa `no-restricted-imports` com mecanismos nativos do ESLint.

## 9. Documentação

A auditoria permanece em:

```text
audits/feedback-notify/
├─ README.md
├─ docs/
├─ research/
└─ tests/
```

Essa documentação não é dependência da aplicação e não deve ser misturada aos testes executáveis.
