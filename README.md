# RMC Estacionamento Layout

Base frontend criada com Vite, React e TypeScript, usando Tailwind CSS v4 e
shadcn/ui com Base UI no estilo Luma.

## Requisitos

- Node.js 22.12 ou superior (Node 24 LTS recomendado)
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
- Zod 4 para validação em runtime
- Vitest, Testing Library e cobertura V8
- Playwright em Chromium, Firefox e WebKit

## Organização dos testes

```text
tests/
├─ unit/          # unidades isoladas e contratos do repositório mock
├─ integration/   # composição React entre componentes, providers e domínio
├─ e2e/           # jornadas reais executadas pelo Playwright
└─ support/       # setup e utilitários compartilhados exclusivamente por testes
```

O diretório `src` contém somente código da aplicação. O Vitest executa as
suítes `unit` e `integration`; o Playwright fica restrito a `tests/e2e`.

As configurações seguem as documentações oficiais de cada projeto.

## Referências oficiais

- [Vite](https://vite.dev/guide/)
- [React com TypeScript](https://react.dev/learn/typescript)
- [Tailwind CSS com Vite](https://tailwindcss.com/docs/installation/using-vite)
- [shadcn/ui com Vite](https://ui.shadcn.com/docs/installation/vite)
- [shadcn/ui Luma](https://ui.shadcn.com/docs/changelog/2026-03-luma)
- [TanStack Table para React](https://tanstack.com/table/latest/docs/framework/react/quick-start)
- [Zod](https://zod.dev/packages/zod)
- [Vitest](https://vitest.dev/config/environment.html)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright](https://playwright.dev/docs/intro)
