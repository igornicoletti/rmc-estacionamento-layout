# RMC Estacionamento Layout

Base frontend criada com Vite, React e TypeScript, usando Tailwind CSS v4 e
shadcn/ui com Base UI no estilo Luma.

## Requisitos

- Node.js 24.18.1 (fixado em `.node-version`; versões compatíveis 24.x são aceitas por `engines`)
- npm 11.6.0

## Comandos

```bash
npm ci
npm run dev
npm run check
npm run test:e2e
```

Na primeira execução dos testes E2E, instale os navegadores:

```bash
npx playwright install
```

## Stack

- Vite 8, React 19 e TypeScript 6
- Tailwind CSS 4 via plugin oficial para Vite
- shadcn/ui Luma sobre Base UI
- TanStack Query 5 e TanStack Table 9
- Vitest, Testing Library e cobertura V8
- Playwright em Chromium, Firefox e WebKit

## Organização dos testes

```text
tests/
├─ unit/          # unidades isoladas de regras e componentes reutilizáveis
├─ integration/   # composição entre router, providers e shell
├─ e2e/           # jornadas reais executadas pelo Playwright
└─ support/       # setup e utilitários compartilhados exclusivamente por testes
```

O Vitest executa as suítes `unit` e `integration`; o Playwright fica restrito
a `tests/e2e`. O workflow `validate` executa lint, typecheck, testes, build e
uma jornada E2E em Chromium.

## Organização do código

- `src/app/app.tsx`: composition root da aplicação; recebe o router criado em `main.tsx`.
- `src/app/app-config.ts`: identidade, metadados e política de acesso declarativa das páginas.
- `src/app/app-layout.tsx`: título da navegação e outlet raiz.
- `src/app/app-shell.tsx`: composição do sidebar, header e conteúdo das rotas liberadas.
- `src/app/app-navigation.ts`: modelo de navegação derivado do catálogo de páginas.
- `src/app/app-preview.ts`: fixture visual do shell; nunca resolve autenticação ou autorização.
- `src/app/app-providers.tsx`: montagem estável de Query, tema, sessão, tooltip e toast.
- `src/app/query-client.ts`: política de cache/retry e fábrica do QueryClient.
- `src/app/app-error-boundary.tsx`: recuperação de falhas de renderização da aplicação.
- `src/app/routing/`: rotas, política pura de acesso, bloqueio visual e erros de rota.
- `src/app/session/`: contratos, comandos, contexto, provider e estados de bootstrap.
- `src/components/common/`: composições visuais sem regra de negócio.
- `src/components/sidebar/`: apresentação e interações do shell lateral.
- `src/pages/<page>/<page>.layout.tsx`: único arquivo de entrada de cada página.

Cada página reserva `components/` para UI local, `contracts/` para contratos
externos, `rules/` para regras puras, `types/` para tipos locais e `schemas/`
para validação de dados em runtime. Pastas e arquivos usam inglês; URLs e
conteúdo exibido usam português brasileiro. Imports internos usam `@/` e imports
exclusivamente de tipos usam `import type`.

A nomenclatura `*.layout.tsx` é uma convenção deste projeto. No Data Mode,
o React Router associa explicitamente os componentes às rotas e não depende
dessa extensão para descobrir arquivos.

## Decisões atuais

As páginas continuam sendo scaffolds públicos de layout. A política
`authentication: "either"` está declarada no catálogo de páginas para que a
migração futura para autenticação real seja feita por rota, sem alterar a
infraestrutura do router. `availability` descreve somente o estágio de entrega
da página e não autorização.

O `RouteAccessBoundary` compõe as políticas de todos os route matches
registrados. Assim, uma rota filha não pode enfraquecer silenciosamente uma
restrição declarada por uma rota ancestral.

A sessão diferencia bootstrap, anonimato, autenticação e indisponibilidade.
Operações concorrentes usam `AbortController` e epoch. Quando a autoridade
muda, queries em andamento são canceladas e o QueryClient é limpo antes do novo
snapshot ser publicado, evitando reutilização de dados de outra identidade.

O shell usa os primitives oficiais do shadcn/ui com Base UI e mantém regras de
dados fora dos componentes visuais. `AppShell` recebe dados e comandos por
contrato; `AppShellRoute` é o adaptador temporário dos fixtures de preview.
Estados de carregamento, indisponibilidade e ações pendentes continuam
controlados fora dos componentes visuais.

Antes de adicionar loaders privados, a autorização deverá migrar para uma
barreira executada antes dos loaders, como middleware de rota quando a integração
real estiver definida e a API escolhida estiver estável para o caso de uso.
O boundary visual atual não deve ser tratado como proteção de dados.

## Referências oficiais

- [React Router](https://reactrouter.com/)
- [React Router Middleware](https://reactrouter.com/how-to/middleware)
- [TanStack Query](https://tanstack.com/query/latest)
- [shadcn/ui Sidebar](https://ui.shadcn.com/docs/components/base/sidebar)
- [Base UI](https://base-ui.com/react/overview/quick-start)
- [Vite](https://vite.dev/guide/)
- [React com TypeScript](https://react.dev/learn/typescript)
- [Tailwind CSS com Vite](https://tailwindcss.com/docs/installation/using-vite)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/docs/intro)
