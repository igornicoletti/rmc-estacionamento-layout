# Evidência local F01 — contratos puros

> **Evidência histórica mais recente:** este manifesto comprova o SHA de implementação `8aa2148e78f6ff8c2c643f4d28e71ee60ba643b7`. Após essa execução, a revisão do PR #31 identificou uma correção fail-closed adicional para AAL desconhecido em freshness. O SHA corrente da branch deve ser revalidado antes de retornar a `verified-local`.

| Campo | Valor |
| --- | --- |
| `schemaVersion` | `1` |
| `contractVersion` | `1.0` |
| `phase` | `F01` |
| `requirementIds` | estados e DTOs públicos; parâmetros canônicos implementados neste bloco; lifecycle/onboarding; reconhecimento de capability desconhecida (parcela de AUTHZ-05); schema de Problem Details (parcela pura de T21); T03; parcela pura de T10 e T31 |
| `repositorySha` | `8aa2148e78f6ff8c2c643f4d28e71ee60ba643b7` |
| `environment` | `LOCAL`, Windows, checkout `rmc-estacionamento-layout` |
| `versions` | Node `24.18.1`; npm `11.6.0`; TypeScript `6.0.2`; Vitest `5.0.1`; Zod `4.6.5` |
| `configuration` | Auth permanece `disabled`; sem SDK Supabase, Worker, banco, Queue, SMS ou secrets |
| `executionWindow` | execução end-to-end não imprimiu timestamps próprios; o estágio Vitest registrou início em `2026-09-30 15:18:59 -03:00` e duração de `122.93s` |
| `responsible` | execução local solicitada pelo responsável do repositório; revisão técnica assistida |

## Procedimento e resultados

| Procedimento | Exit | Resultado |
| --- | ---: | --- |
| `npm run check:full` | 0 | Gate agregado concluído sem falhas. |
| `npm run unused:check` | 0 | Knip sem issues. |
| `npm run audit:security` | 0 | `npm audit --audit-level=moderate`: 0 vulnerabilidades. |
| `npm run lint` | 0 | ESLint aprovado com `--max-warnings=0`. |
| `npm run build` | 0 | `tsc -b`, Vite e bundle-size check aprovados; chunk inicial `358.71 kB`, abaixo do limite de `400 kB`. |
| `npm run test:coverage` | 0 | 54 arquivos e 223 testes Vitest aprovados; cobertura global: 87.03% statements, 82.15% branches, 85.93% functions e 87.23% lines. |
| `npm run test:e2e:check` | 0 | 19 testes Playwright/Chromium aprovados com 1 worker. |
| `git diff --check origin/main...HEAD` | 0 | Sem erros de whitespace no delta contra `origin/main`. |
| `git status` | 0 | Working tree clean e branch sincronizada com `origin/fix/auth-f01-naming-pages`. |

No SHA acima, os testes provaram parsing estrito e shapes desconhecidos (T03), restricted steps fechados por jornada, política canônica versionada, fail-closed para provas malformed, binding temporal/sessão/intenção/AMR/AAL da parcela pura de freshness (T10), mapa fechado de Problem Details no nível do body/schema (parcela pura de T21), e limites locais Unicode/NFC/code points/bytes sem truncamento (parcela pura de T31).

A cobertura específica de `src/shared/auth` no gate acima ficou em 98.96% statements, 94.64% branches, 100% functions e 98.88% lines; `src/shared/authorization` ficou em 100% nas quatro métricas.

## Revisão e limitações

- O PR #31 recebeu revisão posterior ao gate acima. A correção para rejeitar AAL desconhecido em runtime foi incorporada à branch e exige nova execução completa; a evidência deste arquivo não é transportada automaticamente para esse SHA posterior.
- AUTHZ-03 não é declarado como comprovado pela F01. Hierarquia, target, scope e enforcement autoritativo permanecem em F10. A F01 comprova o catálogo fechado e a negação de capability desconhecida.
- T21 não foi comprovado end-to-end: correspondência entre status HTTP real, headers, media type e Problem Details pertence à F03. Este gate comprova somente a parcela pura do schema/mapa.
- T10 não foi comprovado com provider/assinatura/AMR real; a prova completa pertence à integração de F07. Este gate comprova a parcela pura de binding, assurance, AMR e limites temporais.
- A prova completa de T31 ainda depende dos adapters e caminhos de escrita F06/F09.
- E2E local de Chromium foi executado e aprovado, mas não substitui staging/target nem promove `PASS_LOCAL`, `PASS_TARGET` ou `GO`; esses estados continuam reservados às fases F12–F14.
- O relatório de performance do Vitest indica custo elevado de criação repetida de `jsdom`. A suíte permanece funcional e isolada; eventual migração para `vmThreads` deve ser tratada como otimização separada e medida, não como condição da F01.
- O timeout de cobertura foi mantido finito em 10 s somente para `test:coverage`; o `npm test` normal preserva o timeout padrão mais estrito.
