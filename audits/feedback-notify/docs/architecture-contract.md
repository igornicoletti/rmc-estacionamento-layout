# Contrato arquitetural de feedback transitório

**Status:** contrato v1 aprovado e em implementação.

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
export type FeedbackType =
  | "success"
  | "info"
  | "warning"
  | "error"

export type FeedbackPriority = "low" | "high"

export interface FeedbackDefinition {
  readonly title: string
  readonly description?: string
  readonly priority?: FeedbackPriority
  readonly type: FeedbackType
}

export type FeedbackFactory =
  (...args: never[]) => FeedbackDefinition

export type FeedbackCatalog =
  Readonly<Record<string, FeedbackDefinition | FeedbackFactory>>
```

Catálogos usam:

```ts
as const satisfies FeedbackCatalog
```

para validar a estrutura sem degradar a inferência das factories.

## 3. Conteúdo

- `title` é obrigatório e deve comunicar sozinho o resultado.
- `description` é opcional e só deve existir quando acrescenta contexto, consequência ou próxima ação.
- strings vazias são proibidas por convenção/review; não existe validator runtime para conteúdo interno compilado.
- conteúdo é `string`; HTML, JSX e `ReactNode` ficam fora da v1.

## 4. Type e priority

`FeedbackType` descreve o resultado visual/semântico:
- `success`: ação concluída;
- `info`: informação transitória neutra;
- `warning`: condição que requer atenção;
- `error`: ação não concluída.

`FeedbackPriority` descreve a urgência do anúncio acessível:
- `low`: anúncio não urgente; default do Base UI quando omitido;
- `high`: anúncio urgente.

Regras:
- `priority` é opcional e pertence ao catálogo, não ao call site;
- `type: "error"` não implica `priority: "high"`;
- `high` só deve ser usado quando o caso realmente exige anúncio urgente ou quando uma migração precisa preservar comportamento acessível já existente;
- `loading` continua fora do contrato comum porque representa lifecycle, não resultado final.

## 5. `notify()`

Assinatura normativa:

```ts
export function notify(
  feedback: FeedbackDefinition,
): void
```

Comportamento:
1. recebe uma definição já resolvida;
2. seleciona explicitamente `title`, `description`, `priority` e `type`;
3. chama o manager global existente;
4. ignora o ID retornado pelo manager;
5. retorna `void`;
6. não captura nem transforma exceções do manager.

Forma conceitual:

```ts
toast.add({
  title: feedback.title,
  description: feedback.description,
  priority: feedback.priority,
  type: feedback.type,
})
```

Não usar spread do objeto no adapter. Novas propriedades só podem chegar ao primitive após decisão arquitetural explícita.

## 6. Ownership dos catálogos

O catálogo pertence ao menor escopo semanticamente proprietário do evento.

Para eventos de produto/domínio:
- Session possui `SESSION_FEEDBACK`;
- Clients possui `CLIENTS_FEEDBACK`;
- outros domínios seguem o mesmo princípio quando surgirem eventos reais.

Para comportamento realmente reutilizável e independente de domínio, o componente/infraestrutura reutilizável pode possuir seu próprio catálogo. Exemplo: a cópia genérica de um registro de DataTable pertence ao escopo DataTable, evitando duplicar a mesma definição em Clients, Units e outros consumidores.

Responsabilidades do catálogo:
- linguagem pública;
- `type`;
- `priority`, quando necessária;
- factories puras;
- interpolação;
- reutilização de formatadores/normalizadores puros já existentes no escopo proprietário.

Não pode:
- executar I/O;
- chamar `notify()` ou Toast;
- navegar;
- acessar QueryClient;
- invalidar/refazer queries;
- decidir autorização/regra de negócio;
- receber DTO amplo quando valores mínimos bastam;
- duplicar formatter/sanitizer já existente.

## 7. Conteúdo dinâmico

Toda factory dinâmica da v1 recebe exatamente um objeto nomeado:

```ts
event: ({ valueA, valueB }: Params) => ({
  title: "...",
  description: "...",
  type: "success",
})
```

Parâmetros devem:
- ter tipos específicos;
- conter somente dados necessários à mensagem;
- evitar `Error`, `Response`, QueryClient, DTO amplo ou infraestrutura;
- ser nullable/optional apenas quando a própria mensagem prevê o estado.

Valores externos devem usar a apresentação já definida no domínio/escopo. `notify()` nunca sanitiza nem corrige casing, Unicode, ortografia ou whitespace.

## 8. Definição inline

É proibido:

```ts
notify({
  title: "...",
  type: "success",
})
```

A v1 não introduz branding/helper runtime apenas para impedir structural typing. A regra é arquitetural e deve ser reforçada por review; lint customizado só será criado se surgir necessidade real.

## 9. Nomenclatura

Entradas descrevem evento/resultado, por exemplo:
- `created`;
- `updated`;
- `deleted`;
- `createFailed`;
- `updateFailed`;
- `deleteFailed`;
- `rowCopied`;
- `rowCopyFailed`;
- `exported`;
- `exportFailed`.

Evitar nomes orientados ao componente visual ou apenas à severidade, como `success`, `error`, `formError` ou `toastSuccess`.

## 10. Segurança

Fluxo esperado:

```text
Error / Response
      ↓
classificação da operação/domínio
      ↓
FeedbackDefinition controlada
      ↓
notify()
```

Proibido propagar diretamente:
- `error.message`;
- stack;
- SQL;
- endpoints internos;
- tokens/credenciais;
- mensagens cruas de banco/serviço;
- identificadores sensíveis sem necessidade explícita.

A v1 não possui sanitizer HTML nem redactor universal. Conteúdo inseguro não deve chegar ao catálogo/dispatcher.

## 11. Operações técnicas reutilizáveis

Operações como Clipboard não devem embutir política de feedback. A função técnica executa a operação e expõe sucesso/falha pelo contrato natural da API; o escopo consumidor/orquestrador seleciona a definição apropriada.

O `catch` de uma operação técnica deve abranger somente a operação que está sendo classificada. Uma falha do próprio `notify()` não pode ser confundida com falha da Clipboard API ou de outra integração.

## 12. Timeout, dedupe e lifecycle

Fora da v1:
- timeout customizado por definição;
- dedupe por ID;
- `update`/`close` públicos;
- `toast.promise`/loading lifecycle;
- actions;
- observabilidade/telemetria.

Essas capacidades do Base UI permanecem disponíveis para evolução futura, mas consumidores não devem acessar o manager para contornar o adapter.

## 13. Fallbacks

`notify()` não escolhe fallback automaticamente. Uma operação que precise comunicar erro inesperado deve selecionar uma definição pública controlada antes do dispatcher.

## 14. Critério de sucesso

No uso comum, o consumidor conhece apenas:

```ts
notify(SCOPE_FEEDBACK.event)
```

ou:

```ts
notify(SCOPE_FEEDBACK.event({ namedData }))
```

Se o call site precisar conhecer manager, ID, timeout, lifecycle ou decidir prioridade arbitrariamente, a abstração falhou.
