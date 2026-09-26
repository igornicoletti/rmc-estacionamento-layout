# Contrato arquitetural de feedback transitório

**Status:** contrato v1 aprovado e implementado no escopo atual.

## 1. API pública

Uso estático:

```ts
notify(SCOPE_FEEDBACK.event)
```

Uso dinâmico:

```ts
notify(
  SCOPE_FEEDBACK.event({
    namedData,
  }),
)
```

A feature informa qual evento ocorreu. Ela não monta Toast nem altera a definição.

## 2. Contrato v1

```ts
export type FeedbackType = "success" | "info" | "warning" | "error"
export type FeedbackPriority = "low" | "high"

export interface FeedbackDefinition {
  readonly title: string
  readonly description?: string
  readonly priority?: FeedbackPriority
  readonly type: FeedbackType
}

export type FeedbackFactory = (...args: never[]) => FeedbackDefinition
export type FeedbackCatalog =
  Readonly<Record<string, FeedbackDefinition | FeedbackFactory>>
```

Catálogos usam `as const satisfies FeedbackCatalog` para validar estrutura sem degradar inferência.

## 3. Conteúdo

- `title` obrigatório;
- `description` opcional quando acrescenta informação;
- strings vazias proibidas por convenção/review;
- conteúdo restrito a `string`; HTML, JSX e `ReactNode` ficam fora da v1.

## 4. Type e priority

`type` descreve o resultado visual/semântico. `priority` descreve urgência do anúncio acessível.

Regras:
- `priority` é opcional e pertence ao catálogo;
- `error` não implica `high`;
- ausência de `priority` preserva o default do Base UI;
- `high` é raro e deliberado;
- `loading` continua fora do contrato comum.

## 5. `notify()`

```ts
export function notify(feedback: FeedbackDefinition): void
```

O adapter:
1. recebe definição resolvida;
2. seleciona explicitamente `title`, `description`, `priority` e `type`;
3. chama o manager global;
4. ignora o ID retornado;
5. retorna `void`;
6. não captura nem transforma exceções do manager.

Não usar spread. Novas propriedades só alcançam o primitive após decisão explícita.

## 6. Ownership dos catálogos

O catálogo pertence ao menor escopo semanticamente proprietário do evento.

Eventos de produto ficam no domínio, como Session e Clients. Comportamento realmente reutilizável pode pertencer ao próprio componente/infraestrutura reutilizável, como cópia genérica de registros da DataTable.

Responsabilidades:
- linguagem pública;
- `type`;
- `priority`, quando necessária;
- factories puras;
- interpolação;
- reutilização de presentation helpers do escopo.

Catálogo não executa I/O, não chama `notify()`, não conhece manager, QueryClient, router ou regra de negócio.

## 7. Conteúdo dinâmico

Toda factory dinâmica recebe um único objeto nomeado com parâmetros mínimos e tipados.

Evitar `Error`, `Response`, QueryClient, DTO amplo ou infraestrutura. Valores externos reutilizam apresentação já definida no domínio/escopo.

## 8. Definição inline

Objeto literal direto em `notify()` permanece proibido por contrato arquitetural. A v1 não adiciona branding/runtime helper apenas para impedir structural typing.

## 9. Segurança

Erro técnico deve ser classificado antes de chegar ao catálogo. Não expor `error.message`, stack, SQL, endpoints internos, tokens/credenciais ou mensagens cruas de serviços.

`notify()` não possui sanitizer HTML, redactor universal ou parser de erros.

## 10. Operações técnicas reutilizáveis

Operações como Clipboard não embutem política de feedback.

A função técnica executa a operação e expõe sucesso/falha pelo contrato natural da API. O escopo consumidor/orquestrador seleciona a definição apropriada.

O `catch` deve abranger somente a operação que está sendo classificada. Falha do próprio `notify()` não pode ser confundida com falha da Clipboard API ou de outra integração.

## 11. Fora da v1

- timeout customizado por definição;
- dedupe por ID;
- `update`/`close` públicos;
- `toast.promise`/loading lifecycle;
- actions;
- observabilidade/telemetria.

## 12. Fallbacks

`notify()` não escolhe fallback automaticamente. A operação seleciona uma definição pública controlada antes do dispatcher.

## 13. Critério de sucesso

No uso comum, o consumidor conhece somente o catálogo proprietário e `notify()` ou uma ação reutilizável que encapsule a operação.

Se o call site precisar conhecer manager, ID, timeout, lifecycle ou decidir prioridade arbitrariamente, a abstração falhou.
