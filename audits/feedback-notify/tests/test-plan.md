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

## Gate

O HEAD final deve passar:
- Vitest focado;
- lint;
- typecheck;
- build;
- `check:full`;
- working tree limpo.
