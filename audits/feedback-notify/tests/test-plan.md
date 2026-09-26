# Plano independente de testes

**Status:** estratégia em execução na implementação v1.

## Estrutura

Infraestrutura:

```text
tests/unit/app/feedback/
├─ feedback-contract.test.ts
└─ notify.test.ts
```

Fluxos reais de aplicação podem receber testes de integração próprios quando o feedback for comportamento observável relevante.

## Contrato TypeScript

Validar:
- `success | info | warning | error`;
- `low | high` para priority;
- `title` obrigatório;
- `description` opcional;
- `priority` opcional;
- retorno inválido de factory;
- preservação dos parâmetros concretos da factory;
- rejeição de parâmetros dinâmicos ausentes/incorretos;
- `as const satisfies FeedbackCatalog` sem degradação de inferência.

Ferramentas adequadas:
- `expectTypeOf`;
- `@ts-expect-error` para contratos negativos deliberados.

## `notify.test.ts`

Mockar somente o manager visual e verificar:
- uma chamada a `toast.add` por invocação;
- payload contém somente `title`, `description`, `priority` e `type`;
- `description` e `priority` ausentes são aceitos;
- `priority: "high"` é encaminhada quando definida;
- retorno público é `undefined`;
- ID retornado pelo manager não é exposto;
- propriedades extras não são encaminhadas;
- exceções inesperadas do manager não são engolidas;
- nenhum sanitizer/formatter roda no adapter.

Não montar React para testar `notify()`.

## Catálogos

Não congelar copy estática em testes apenas para comparar texto.

Testar factory quando houver lógica própria:
- pluralização;
- branch;
- formatação;
- reutilização de formatter/normalizer.

Quando uma propriedade estrutural tiver efeito funcional/acessível, como `priority`, ela pode ser testada no fluxo real que depende dela.

## Segurança

Quando existir classificador de erro, testar que:
- erro não classificado escolhe definição pública controlada;
- `error.message` não é repassado;
- dados sensíveis não são interpolados sem contrato explícito.

Esses testes pertencem ao domínio/integrador, não a `notify()`.

## ESLint

A execução de lint deve provar que:
- features não importam o manager/primitives do Toast diretamente;
- `Toaster` continua permitido na composição;
- `notify.ts` permanece exceção autorizada;
- restrições existentes de imports de testes em produção continuam válidas.

Não criar teste customizado da rule enquanto a própria execução do ESLint for suficiente.

## TanStack Query

Na v1:
- testar feedback da mutation apenas quando ele fizer parte do comportamento relevante;
- preferir callbacks configurados em `useMutation`;
- mockar `notify()`, não internals do MutationCache.

Se metadata for adotado futuramente, testar opt-in explícito e tipagem global sem criar política universal de Toast.

## Não testar

- animações;
- classes/cores;
- ícones do primitive;
- stacking interno do Base UI;
- timeout default da biblioteca;
- implementação interna de `toast.add`;
- internals do React Query;
- internals de formatadores já cobertos em seu próprio escopo.

## Gate

Cada alteração funcional do sistema de feedback deve passar:
- lint;
- typecheck;
- Vitest focado;
- suite de integração relevante;
- build;
- `check:full` antes do merge final.
