# RMC Estacionamento Layout

Base frontend criada com Vite, React e TypeScript, usando Tailwind CSS v4 e
shadcn/ui com Base UI no estilo Luma.

Este repositório é uma SPA cliente em React executada pelo Vite. Não utiliza
Next.js nem React Server Components.

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
- shadcn/ui Luma sobre Base UI, sem RSC
- React Router em Data Mode
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
a `tests/e2e`. Os testes priorizam comportamento e contratos da aplicação, sem
fixar copy visual, cores ou detalhes internos de primitives de terceiros. O
workflow `validate` executa lint, typecheck, testes, build e uma jornada E2E
em Chromium.

## Organização do código

- `src/main.tsx`: bootstrap do React; resolve o DOM root e monta App com StrictMode.
- `src/app/app.tsx`: composition root da aplicação; recebe o router e dependências injetáveis.
- `src/app/app-router.ts`: cria o Data Router uma única vez, fora da árvore React.
- `src/app/app-routes.ts`: fonte única de IDs, paths, builders e títulos de documento; não contém conteúdo de tela nem availability.
- `src/app/app-metadata.ts`: identidade mínima do produto e título-base do navegador.
- `src/app/app-route-tree.ts`: composição do Data Router, entradas lazy e atualização do título pelo handle.
- `src/app/app-route-error-boundary.tsx`: classificação de erros de rota; apresentação delegada a fallback.
- `src/app/app-providers.tsx`: montagem estável de Query, tema, Auth provisório, tooltip e toast.
- `src/app/app-error-boundary.tsx`: captura global de falhas de renderização; apresentação delegada a fallback.
- `src/lib/query/query-client.ts`: política de cache/retry e fábrica do QueryClient.
- `src/features/auth/`: scaffold de autoridade/lifecycle e guard de UX. A integração real e o redesenho dos contratos aguardam auditoria do projeto `igornicoletti/rmc-estacionamento`.
- `src/components/layout/`: composição visual de página e shell; recebe conteúdo, callbacks e destinos por props.
- `src/components/fallback/`: apresentação de falhas da aplicação, rota, carregamento e indisponibilidade de sessão. Cada boundary decide seu próprio estado.
- `src/components/sidebar/`: conteúdo, itens de navegação e apresentação do sidebar; paths derivados do registro de rotas.
- `src/components/header/`: Header, menu do usuário, notificações e conteúdo próprio.
- `src/components/app/`: decisões reutilizáveis da aplicação sobre primitives de `ui/`, sem regra de negócio.
- `src/mocks/mock-shell-route.tsx`: integração do shell no runtime de demonstração atual; usuário e notificações simulados não representam autoridade autenticada.
- `src/mocks/mock-shell-fixtures.ts`: dados desse shell de demonstração, consumidos exclusivamente pelo módulo mock.
- `src/pages/<page>/<page>.layout.tsx`: entradas atuais de domínio, ainda aguardando a branch de migração para features.

`src/app` não possui subdiretórios: contém apenas composição e metadados técnicos.
Auth real continua adiado. O router atual monta explicitamente o shell mock;
a integração real deverá substituí-lo, remover seus dados simulados e auditar o
scaffold de acesso. Não há seleção automática por ambiente nem integração Supabase.

A migração `pages → features` acontecerá em branch própria, começando por Clientes
e Unidades. Nela serão auditados prefixos, `*-content.ts`, `*-page.tsx`, fixtures e
subdomínios reais, sem copiar automaticamente pastas técnicas genéricas. Imports
internos usam `@/`; arquivos/diretórios usam inglês e conteúdo/URLs usam pt-BR.

A [auditoria de auth/routing](docs/architecture/auth-routing-audit.md) registra
os contratos confirmados, riscos e ordem da reconstrução. O primeiro bloco de
`refactor/app-architecture` organiza o composition root; a remoção de config,
layouts e do arquivo de metadados ainda em root continua nos blocos seguintes.
Pages → Features será uma etapa posterior.

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

- [React](https://react.dev/)
- [React com TypeScript](https://react.dev/learn/typescript)
- [React Router](https://reactrouter.com/)
- [React Router Middleware](https://reactrouter.com/how-to/middleware)
- [Vite](https://vite.dev/guide/)
- [TanStack Query](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com/)
- [shadcn/ui Sidebar](https://ui.shadcn.com/docs/components/base/sidebar)
- [Base UI](https://base-ui.com/react/overview/quick-start)
- [Tailwind CSS com Vite](https://tailwindcss.com/docs/installation/using-vite)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/docs/intro)
- [ESLint](https://eslint.org/docs/latest/)
