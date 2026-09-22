# RMC Estacionamento Layout

Base frontend criada com Vite, React e TypeScript, usando Tailwind CSS v4 e
shadcn/ui com Base UI no estilo Luma.

## Requisitos

- Node.js 22.22 ou superior (Node 24 LTS recomendado)
- npm 11

## Comandos

```bash
npm install
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
- TanStack Table 9 com features opt-in e tree-shaking
- Vitest, Testing Library e cobertura V8
- Playwright em Chromium, Firefox e WebKit

## Organização dos testes

```text
tests/
├─ unit/          # unidades isoladas dos componentes reutilizáveis
├─ integration/   # composição React entre componentes, providers e domínio
├─ e2e/           # jornadas reais executadas pelo Playwright
└─ support/       # setup e utilitários compartilhados exclusivamente por testes
```

O diretório `src` contém somente código da aplicação. O Vitest executa as
suítes `unit` e `integration`; o Playwright fica restrito a `tests/e2e`.

As configurações seguem as documentações oficiais de cada projeto.

## Organização do código

- `src/app/app.tsx`: composição da aplicação; recebe o router criado em `main.tsx`.
- `src/app/app-config.ts`: identidade, URLs, metadados das páginas e mensagens de erro.
- `src/app/app-layout.tsx`: metadados da navegação e outlet principal.
- `src/app/app-providers.tsx`: montagem estável dos providers.
- `src/app/query-client.ts`: política de cache/retry e fábrica do QueryClient.
- `src/app/app-error-boundary.tsx`: recuperação de falhas de renderização da aplicação.
- `src/app/routing/`: rotas, política pura de acesso, bloqueio visual e erros de rota.
- `src/app/session/`: contratos, comandos, contexto/hook, provider e estados de bootstrap.
- `src/components/common/`: composições visuais sem dependência de `app`.
- `src/pages/<page>/<page>.layout.tsx`: único arquivo de entrada de cada página.

Cada página reserva `components/` para UI local, `contracts/` para contratos
externos, `rules/` para regras puras, `types/` para tipos locais e `schemas/`
para validação de dados em runtime. As pastas sem implementação contêm somente
`.gitkeep`; não se devem duplicar os mesmos tipos entre essas responsabilidades.
`src/pages/auth/` e `src/components/sidebar/` estão reservados, sem implementação.
Pastas e arquivos usam inglês; URLs e conteúdo exibido usam português brasileiro.
Imports internos usam `@/` e imports exclusivamente de tipos usam `import type`.

A nomenclatura `*.layout.tsx` é uma convenção deste projeto. No Data Mode,
o React Router associa explicitamente os componentes às rotas; não depende
dessa extensão para descobrir arquivos.

## Revisão da arquitetura

A revisão consolidou os antigos diretórios `bootstrap`, `config`, `providers`
e `layouts`, além das subdivisões `routing/access` e `routing/root`.
O layout Auth sem consumidor, a fábrica de router que só encapsulava uma chamada,
o módulo isolado de título e os contratos duplicados foram removidos ou incorporados.
Os estados de sessão foram reunidos sem perder o cancelamento de operações,
a preservação de conteúdo durante refresh e a limpeza de cache privado.
Respostas obsoletas são descartadas antes de qualquer limpeza de cache.

O título usa um único proprietário por navegação e mantém o título estático do
HTML. Consultas validam os metadados de rota em runtime; IDs de página são
inferidos da configuração, com o registro de componentes conferido por
`satisfies`. Primitives de UI permanecem independentes de sessão e roteamento.

As páginas atuais são estruturas de layout: `available` no catálogo não indica
integração com backend nem autorização. A sessão padrão continua anônima e as
rotas do catálogo continuam públicas (`authentication: "either"`).
Autenticação real, schemas de API e autorização no servidor dependem da futura
integração. Antes de adicionar loaders privados, a autorização deverá ser
resolvida também antes de buscar dados: um bloqueio visual não protege loaders.

Referências para as decisões: [rotas em Data Mode](https://reactrouter.com/start/data/routing),
[metadados de título no React](https://react.dev/reference/react-dom/components/title),
[`satisfies` no TypeScript](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html)
e [defaults do TanStack Query](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults).

## Referências oficiais

- [Vite](https://vite.dev/guide/)
- [React com TypeScript](https://react.dev/learn/typescript)
- [Tailwind CSS com Vite](https://tailwindcss.com/docs/installation/using-vite)
- [shadcn/ui com Vite](https://ui.shadcn.com/docs/installation/vite)
- [shadcn/ui Luma](https://ui.shadcn.com/docs/changelog/2026-03-luma)
- [TanStack Table para React](https://tanstack.com/table/latest/docs/framework/react/quick-start)
- [Vitest](https://vitest.dev/config/environment.html)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright](https://playwright.dev/docs/intro)
