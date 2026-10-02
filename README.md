# RMC Estacionamento Layout

SPA de demonstração React/TypeScript/Vite, shadcn/Base UI Luma, Tailwind v4,
React Router Data Mode, TanStack Query e Table v9. Sem Next.js/RSC.

## Estado real

Clientes, veículos e Unidades têm tabelas de demonstração. Demais telas são placeholders.
Auth **disabled**: F00/F01/F02 têm evidências locais específicas; não há login,
BFF funcional de login ou autorização de produção. F03 introduz Worker/HTTP e
PREAUTH/CSRF exclusivamente local; nenhum SDK Supabase está no browser.
F04 tem implementação controlada e gate integral local concluídos, aguardando revisão:
saga, day-zero, autorização por intenção, reconciliação e compensação sem sessões.
Sem endpoint Users; step-up real, revogação de sessões e Units operacionais seguem fases próprias.
Build e preview não são release. [Estado e contrato](docs/auth/README.md).

## Começar

Node `24.18.1` (.node-version), npm `11.6.0`; Docker somente para gate de banco.

```bash
npm ci
npm run dev
```

E2E Chromium: `npx playwright install chromium`. Três navegadores: `npx playwright install`.
Linux pode exigir `--with-deps`.

## Validar

| Comando | Escopo |
| --- | --- |
| `npm run check` | Diff, lint, tipos, docs, tooling e testes |
| `npm run check:app` | Aplicação: audit/Knip, cobertura, build e Chromium |
| `npm run check:db` | Exclusivamente local e destrutivo: dois resets e provas DB |
| `npm run check:full` | Aplicação, Worker, banco e HTTPS local; build/reset compartilhados |
| `npm run check:bff` | Worker, dois resets, banco e integração HTTPS/Chromium local |
| `npm run check:worker` | Tipos gerados, TypeScript Worker, runtime e dry-run; exige build |
| `npm run test:worker:integration` | Build, banco exclusivo e HTTPS local; sem deploy |
| `npm run test:provisioning:local` | Banco exclusivo e saga Worker/provider real sintético; cleanup próprio |
| `npm run test:e2e` | Build e Chromium/Firefox/WebKit |
| `npm run docs:check` | Links, anchors, inventários, integridade e Markdown |
| `npm run deps:status` | Atualizações informativas |

Gate DB recusa stack já iniciado para não apagar/interromper trabalho de outro processo.
Relatórios sanitizados: validation-results (ignorado). CI billing não é aprovação.

## Documentação

- [Índice e padrão](docs/README.md)
- [Desenvolvimento/dependências](docs/project/development.md)
- [Comandos e catálogo completo de testes](docs/project/validation.md)
- [Arquitetura](docs/architecture/application.md)
- [Features e lib](docs/architecture/features-and-lib.md)
- [UI compartilhada](docs/ui/app.md)
- [Contratos ERP](docs/contracts/hub-erp.md)
- [Auth, gates e evidências](docs/auth/README.md)

Nunca registrar secrets em VITE_*, logs ou documentação. Migrations são a fonte evolutiva;
dumps são evidência derivada. Gate local não autoriza deploy, migration remota, SMS,
merge ou início da próxima fase automaticamente.
