# Plano de diretórios, nomes e fronteiras

**Status:** estrutura v1 implementada e mantida como contrato.

## 1. Infraestrutura transversal

```text
src/app/feedback/
├─ feedback-contract.ts
└─ notify.ts
```

Responsabilidades:
- `feedback-contract.ts`: tipos do contrato;
- `notify.ts`: único adapter autorizado ao manager de Toast.

Não criar na v1 Provider/Context, Hook, service class, registry, resolver global, sanitizer, pipeline fragmentado ou barrel público.

## 2. Ownership dos catálogos

### Domínio/produto

```text
src/<scope>/<domain>/content/<domain>-feedback.ts
```

Exemplos: Session e Clients.

### Escopo reutilizável

Quando o evento é realmente genérico e compartilhado, o catálogo permanece junto ao componente/infraestrutura semanticamente proprietário.

Exemplo:

```text
src/components/data-table/
├─ actions/
│  └─ copy-data-table-record.ts
└─ data-table-feedback.ts
```

Isso evita duplicar o mesmo feedback em múltiplos domínios.

## 3. Presentation helpers

Catálogos podem importar formatadores/normalizadores puros do mesmo escopo quando precisarem interpolar valores externos. Não mover sanitização para a infraestrutura de feedback nem duplicar regras de apresentação.

## 4. Operações técnicas

Utilitários técnicos reutilizáveis não possuem feedback visual embutido.

`src/lib/copy-to-clipboard.ts` expõe somente a operação de Clipboard. A ação/orquestrador proprietário trata a Promise e seleciona o catálogo apropriado.

Side effects reutilizáveis de DataTable ficam em `data-table/actions`, não em `data-table/core`.

## 5. Grafo permitido

```text
feature/component
   ├─> owner feedback catalog
   └─> app/feedback/notify ou reusable action

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

## 6. Dependências proibidas em catálogos

Não importar React, TanStack Query, router, QueryClient, componentes UI, manager de Toast, serviços HTTP ou DTO amplo sem necessidade. Factories permanecem puras.

## 7. Testes

```text
tests/unit/app/feedback/
tests/unit/components/data-table/actions/
tests/unit/lib/
```

Fluxos reais recebem teste no escopo correspondente quando o feedback fizer parte do comportamento relevante. Não criar testes apenas para congelar copy estática.

## 8. ESLint

O enforcement está implementado com `no-restricted-imports`: consumidores normais só podem importar `Toaster` quando necessário; o manager fica restrito ao adapter; caminhos relativos equivalentes também são cobertos.

## 9. Documentação

A auditoria permanece em `audits/feedback-notify/` e não é dependência runtime.
