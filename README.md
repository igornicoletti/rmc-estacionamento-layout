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
npm run check:full
```

`npm run check` executa lint, build com typecheck e testes Vitest uma única vez.
`npm run check:full` acrescenta Knip, auditoria de dependências, cobertura e E2E
determinístico em Chromium, sem repetir o build ou a suíte Vitest.

Na primeira execução dos testes E2E, instale os navegadores necessários. Para o
`check:full`, Chromium é suficiente:

```bash
npx playwright install chromium
```

Para executar `npm run test:e2e` em todos os projetos configurados:

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
workflow `validate` instala Chromium e executa `check:full`, que concentra o gate
hospedado sem repetir etapas já cobertas pelo próprio script.

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
- `src/features/auth/`: scaffold de UX/lifecycle do layout. Não substitui os contratos canônicos puros nem concede autoridade servidor.
- `src/shared/auth/`: contratos puros da F01. Arquivos de escopo usam prefixo `auth-*`; `index.ts` permanece como barrel convencional do domínio.
- `src/shared/authorization/`: catálogo/schemas puros de autorização. Arquivos de escopo usam prefixo `authorization-*`; `index.ts` permanece como barrel do domínio.
- `src/components/layout/`: composição visual de página e shell; recebe conteúdo, callbacks e destinos por props.
- `src/components/fallback/`: apresentação de falhas da aplicação, rota, carregamento e indisponibilidade de sessão. Cada boundary decide seu próprio estado.
- `src/components/sidebar/`: conteúdo, itens de navegação e apresentação do sidebar; paths derivados do registro de rotas.
- `src/components/header/`: Header, menu do usuário, notificações e conteúdo próprio.
- `src/components/app/`: decisões reutilizáveis da aplicação sobre primitives de `ui/`, sem regra de negócio.
- `src/mocks/mock-shell-route.tsx`: integração do shell no runtime de demonstração atual; usuário e notificações simulados não representam autoridade autenticada.
- `src/mocks/mock-shell-fixtures.ts`: dados desse shell de demonstração, consumidos exclusivamente pelo módulo mock.
- `src/features/clients/`, `src/features/units/` e demais páginas migradas: módulos `*-page.tsx` na raiz da feature; implementação interna separada por responsabilidade quando necessário.
- `src/features/clients/vehicles/`: subdomínio de veículos com seus próprios contratos.

`src/app` não possui subdiretórios: contém apenas composição e metadados técnicos.
Auth real continua fechado pelos gates do contrato canônico. O router atual monta
o shell mock; a integração real deverá substituí-lo, remover seus dados simulados
e seguir as fases responsáveis por controller, BFF, persistência e enforcement.
Não há seleção automática por ambiente nem integração Supabase no browser.

A migração `pages → features` usa `*-page.tsx` para as entradas de tela. Arquivos
de implementação pertencentes a um escopo usam prefixo do domínio quando isso
remove ambiguidade; barrels `index.ts` são a exceção intencional a essa regra.
Fixtures demonstrativas ficam em `src/mocks`. Imports internos usam `@/`; arquivos
e diretórios usam inglês e conteúdo/URLs usam pt-BR.

A [auditoria de auth/routing](docs/architecture/auth-routing-audit.md) registra
a reconstrução integrada no PR #22. A [migração de features](docs/architecture/features-migration.md)
detalha as fronteiras e as áreas adiadas até a auditoria de Auth.

## Decisões atuais

As rotas atuais continuam públicas. A composição da árvore declara
`authentication: "either"` explicitamente enquanto o runtime Auth real permanece
em fases posteriores; `availability` foi removido do contrato de rotas e de layout.

O `AuthAccessBoundary` preserva a avaliação agregada dos matches e a negação
por padrão do scaffold. O scaffold de UX não transforma capabilities, assurance
ou estado local em autorização final. Fresh step-up é prova transacional vinculada
à sessão e à intenção no servidor; não é uma flag global de freshness da rota.

A sessão de demonstração diferencia bootstrap, anonimato, autenticação e
indisponibilidade. Operações concorrentes usam cancelamento e descartam resultados
obsoletos. Mudanças de autoridade cancelam e removem apenas queries marcadas com
`meta.identityScoped === true`, antes da publicação da nova sessão.

O `LayoutShell` recebe dados de apresentação, navegação e comandos por props.
O `MockShellRoute` mantém a integração temporária com usuário/notificações de
demonstração. Esses dados não comprovam identidade nem autorização.

Loaders e serviços privados deverão ser implementados nos gates correspondentes.
O boundary visual orienta navegação e não protege dados; a integração real deverá
definir a barreira de acesso e o enforcement no serviço/RLS.

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

A organização vigente e a revisão dos componentes compartilhados estão em
[Features e componentes compartilhados](docs/architecture/shared-components-review.md).

Os campos ERP de Clientes, Veículos e Unidades seguem o OpenAPI compartilhado;
[proveniência e limites dos contratos](docs/contracts/hub-erp.md).
