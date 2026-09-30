# Evidência local F01 — contratos puros

> **Evidência corrente:** este manifesto comprova o SHA de implementação `38c4628897f3071b5767daa29f06ec69fbc996b1`. Commits documentais posteriores podem ter SHA diferente, mas não alteram o código testado.

| Campo | Valor |
| --- | --- |
| `schemaVersion` | `1` |
| `contractVersion` | `1.0` |
| `phase` | `F01` |
| `requirementIds` | estados e DTOs públicos; parâmetros canônicos implementados neste bloco; lifecycle/onboarding; reconhecimento de capability desconhecida (parcela de AUTHZ-05); schema de Problem Details (parcela pura de T21); T03; parcela pura de T10 e T31 |
| `repositorySha` | `38c4628897f3071b5767daa29f06ec69fbc996b1` |
| `environment` | `LOCAL`, Windows, checkout `rmc-estacionamento-layout` |
| `versions` | Node `24.18.1`; npm `11.6.0`; TypeScript `6.0.2`; Vitest `5.0.1`; Zod `4.6.5` |
| `configuration` | Auth permanece `disabled`; sem SDK Supabase, Worker, banco, Queue, SMS ou secrets |
| `executionWindow` | revalidação final executada em `2026-09-30` no SHA acima; a saída resumida fornecida pelo responsável terminou em `=== F01 REVALIDADA ===` |
| `responsible` | execução local solicitada pelo responsável do repositório; revisão técnica assistida |

## Procedimento e resultados

| Procedimento | Exit | Resultado |
| --- | ---: | --- |
| `npm run check:full` | 0 | Gate agregado concluído sem falhas no SHA `38c4628`. Como o script usa encadeamento `&&`, Knip, audit, lint, build, coverage e E2E concluíram antes do retorno 0. |
| `npm run unused:check` | 0 | Incluído no gate agregado; Knip sem bloqueio. |
| `npm run audit:security` | 0 | Incluído no gate agregado; `npm audit --audit-level=moderate` sem bloqueio. |
| `npm run lint` | 0 | Incluído no gate agregado; ESLint aprovado com `--max-warnings=0`. |
| `npm run build` | 0 | Incluído no gate agregado; `tsc -b`, Vite e bundle-size check aprovados. |
| `npm run test:coverage` | 0 | Incluído no gate agregado; suíte Vitest com cobertura aprovada. |
| `npm run test:e2e:check` | 0 | Incluído no gate agregado; Playwright/Chromium aprovado. |
| `git diff --check origin/main...HEAD` | 0 | Sem erros de whitespace no delta contra `origin/main`. |
| `git status` | 0 | Working tree clean e branch sincronizada com `origin/fix/auth-f01-naming-pages`. |

O PR #31 identificou, após o gate anterior, um caso fail-open para AAL desconhecido em `evaluateFreshness()`. O SHA comprovado por este manifesto valida a correção que rejeita `requiredAal` e `verifiedAal` fora do conjunto runtime canônico antes do ranking, além das contraprovas correspondentes para valores desconhecidos.

No SHA acima, o gate cobre parsing estrito e shapes desconhecidos (T03), restricted steps fechados por jornada, política canônica versionada, fail-closed para provas malformed, binding temporal/sessão/intenção/AMR/AAL da parcela pura de freshness (T10), mapa fechado de Problem Details no nível do body/schema (parcela pura de T21), e limites locais Unicode/NFC/code points/bytes sem truncamento (parcela pura de T31).

## Revisão e limitações

- AUTHZ-03 não é declarado como comprovado pela F01. Hierarquia, target, scope e enforcement autoritativo permanecem em F10. A F01 comprova o catálogo fechado e a negação de capability desconhecida.
- T21 não foi comprovado end-to-end: correspondência entre status HTTP real, headers, media type e Problem Details pertence à F03. Este gate comprova somente a parcela pura do schema/mapa.
- T10 não foi comprovado com provider/assinatura/AMR real; a prova completa pertence à integração de F07. Este gate comprova a parcela pura de binding, assurance, AMR e limites temporais.
- A prova completa de T31 ainda depende dos adapters e caminhos de escrita F06/F09.
- E2E local de Chromium foi executado e aprovado, mas não substitui staging/target nem promove `PASS_LOCAL`, `PASS_TARGET` ou `GO`; esses estados continuam reservados às fases F12–F14.
- O GitHub Actions do PR #31 não iniciou nenhum step porque a conta estava bloqueada por billing; esse run não é tratado como CI verde nem como falha do código.
- Checks externos de Cloudflare/Supabase no PR não são usados como evidência da F01. O repositório desta fase é exclusivamente `igornicoletti/rmc-estacionamento-layout`; o repositório `igornicoletti/rmc-estacionamento` pertence ao projeto backend separado.
- O timeout de cobertura permanece finito em 10 s somente para `test:coverage`; o `npm test` normal preserva o timeout padrão mais estrito.
