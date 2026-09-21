# Auditoria forense do núcleo Data Table

Data: 21 de setembro de 2026

Escopo: `src/components/data-table` e integração `src/features/users`

## Estado vigente

O projeto mantém uma única composição de domínio: a tabela de usuários. A
infraestrutura visual continua isolada em `src/components/data-table`; schema,
colunas, consulta, controller e regras do domínio permanecem em
`src/features/users`; dados determinísticos permanecem em `src/mocks/users`.
Os módulos de registros e todos os simuladores visuais foram removidos.

A tabela continua server-side desde o início: busca, filtros, ordenação e
paginação atravessam o contrato `UsersRepository`; TanStack Query controla
cache, cancelamento e `placeholderData`; TanStack Table mantém somente o estado
controlado e a renderização headless.

## Filtros

Os filtros de status e perfil usam `DataTableComboboxFilter`, composto com os
primitivos oficiais do Combobox Base UI do shadcn/ui:

- `ComboboxInput` usa `showClear`, que renderiza `Combobox.Clear`; não existe
  sentinel, item artificial “Todos” ou botão customizado para limpar a seleção.
- `ComboboxEmpty` fornece o fallback nativo quando a busca não encontra opções.
- O valor selecionado continua disponível mesmo quando a contagem cruzada cai a
  zero; opções indisponíveis não são oferecidas.
- Cada opção apresenta a contagem em `Badge` secundário com numerais tabulares.
- O trigger ocupa toda a largura em containers estreitos e passa a largura
  intrínseca com mínimo de `10rem` quando a toolbar possui espaço.
- O popup preserva a largura do trigger como mínimo, cresce para labels maiores
  e respeita a largura disponível.
- O botão de limpeza nativo recebe nome acessível contextual.

O componente compartilhado conhece somente `label`, `value` e contagem. Enums,
labels e aplicação do filtro continuam sob responsabilidade de `users`.

## Estrutura final

```text
src/
├─ components/data-table/       # estrutura e comportamento reutilizáveis
├─ features/users/              # domínio, schema, colunas e controller
├─ mocks/
│  ├─ shared/                   # utilitários determinísticos do repositório
│  └─ users/                    # dados e adaptador local substituível
├─ App.tsx                      # composição da única tabela
└─ test/                        # providers de teste
```

Não há importação de `features/users` ou `mocks` pelo diretório compartilhado.
O mock entra somente no ponto de composição da aplicação.

## Segurança e robustez preservadas

- Filtros e respostas do repositório são validados com Zod.
- Campos de ordenação passam por allowlist.
- `AbortSignal` cancela respostas obsoletas.
- A query key contém todos os parâmetros da consulta.
- O skeleton é exclusivo da carga inicial; dados anteriores permanecem visíveis
  durante refetch.
- A última coluna de dados não pode ser ocultada.
- Mensagens cruas de servidor e dados pessoais não são repetidos em feedbacks.
- Uma API real ainda deverá repetir autorização, validação e limites no backend.

## Cobertura de comportamento

Os testes compartilhados verificam badges, exclusão de opções indisponíveis,
seleção, limpeza nativa e fallback vazio. A integração de usuários cobre busca,
facets cruzadas, paginação e detalhes. O E2E cobre o fluxo principal, limpeza do
Combobox, proteção da última coluna e centralização responsiva do estado vazio.

O Sheet de detalhes é carregado somente quando uma linha é aberta. O build usa
os grupos oficiais de code splitting do Rolldown para separar Base UI e TanStack,
dependências estáveis e compartilhadas. O maior chunk inicial caiu de 714.942
bytes para aproximadamente 383 kB, e o gate foi reduzido de 700 kB para 400 kB.

## Evidências finais

- ESLint e TypeScript: aprovados.
- Vitest: 10 arquivos e 35 testes aprovados.
- Núcleo `data-table`: 98,52% de statements, 88,17% de branches, 100% de
  funções e 99,16% de linhas; thresholds aprovados.
- Build: aprovado com maior chunk de 382,55 kB.
- Playwright determinístico: 9 testes aprovados em Chromium, Firefox e WebKit.

## Referências oficiais

- [shadcn/ui — Combobox e clear button](https://ui.shadcn.com/docs/components/base/combobox#clear-button)
- [shadcn/ui — Data Table](https://ui.shadcn.com/docs/components/base/data-table)
- [shadcn/ui — Badge](https://ui.shadcn.com/docs/components/base/badge)
- [TanStack Table — Client-side vs server-side](https://tanstack.com/table/latest/docs/guide/client-side-vs-server-side)
- [TanStack Table — Composable tables](https://tanstack.com/table/latest/docs/framework/react/guide/composable-tables)
- [TanStack Query — Paginated queries](https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries)
- [TanStack Query — Query cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)
- [Vite — Chunking strategy](https://vite.dev/guide/build#chunking-strategy)
- [Rolldown — Code splitting](https://rolldown.rs/reference/OutputOptions.codeSplitting)
