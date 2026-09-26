# Plano de testes — v1

## Cobertura implementada

- contrato TypeScript e `notify()`;
- Clipboard técnica: encaminhamento e rejeição;
- ação de cópia de DataTable: sucesso, falha da Clipboard e propagação de falha do manager;
- fluxo dinâmico de Clients para cópia de e-mail;
- integração de Session/logout com feedback controlado e prioridade alta preservada.

## Regras

Testar comportamento próprio do projeto, não internals de Base UI, React Query, Tailwind ou animações.

Não congelar copy estática sem lógica. Factories são testadas quando fazem parte de comportamento observável ou possuem transformação própria.

## Política visual

A cor dos ícones do Toast é uma decisão visual de tema, não regra de negócio.

Portanto:
- não criar asserts para `text-success`, `text-info`, `text-warning` ou `text-error`;
- não snapshotar classes do Toast;
- validar mudanças visuais por lint/typecheck/build e inspeção manual;
- continuar testando `type` e `priority` no contrato/adapter, pois esses valores têm semântica de aplicação.

## Gate de manutenção

O HEAD de qualquer follow-up deve passar:
- `git diff --check`;
- lint;
- typecheck;
- Vitest relevante;
- build/check completo conforme scripts do projeto;
- working tree limpo.

## V2

Cada capacidade futura deve trazer testes apenas para comportamento novo do projeto. Não reproduzir testes do Base UI para dedupe, timer, swipe ou animações quando a aplicação apenas delegar ao primitive.
