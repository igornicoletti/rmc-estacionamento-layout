# Evidência local F01 — contratos puros

> **Evidência histórica:** este manifesto comprova somente o SHA `f57c29158af7ddd7b47079df4938bf858c2190b8`. Correções posteriores da F01 não herdam este resultado e exigem nova execução antes de retornar a `verified-local`.

| Campo | Valor |
| --- | --- |
| `schemaVersion` | `1` |
| `contractVersion` | `1.0` |
| `phase` | `F01` |
| `requirementIds` | estados e DTOs públicos; parâmetros canônicos implementados neste bloco; lifecycle/onboarding; reconhecimento de capability desconhecida (parcela de AUTHZ-05); schema de Problem Details (parcela pura de T21); T03; parcela pura de T10 e T31 |
| `repositorySha` | `f57c29158af7ddd7b47079df4938bf858c2190b8` |
| `environment` | `LOCAL`, Windows, checkout `rmc-estacionamento-layout` |
| `versions` | Node `24.18.1`; npm `11.6.0`; TypeScript `6.0.2`; Vitest `5.0.1`; Zod `4.6.5` |
| `configuration` | Auth permanece `disabled`; sem SDK Supabase, Worker, banco, Queue, SMS ou secrets |
| `startedAt` | `2026-09-30T12:29:05-03:00` |
| `finishedAt` | `2026-09-30T12:41:17-03:00` |
| `responsible` | Codex, execução local solicitada pelo responsável do repositório |

## Procedimento e resultados

| Procedimento | Exit | Resultado |
| --- | ---: | --- |
| `npm run lint` | 0 | ESLint aprovado; fronteira `src/shared` proíbe imports de React, Router, TanStack, Supabase, Cloudflare, UI, features, lib e testes. |
| `npm run typecheck` | 0 | TypeScript aprovado. |
| `npm run unused:check` | 0 | Knip aprovado. |
| `npm run audit:security` | 0 | 0 vulnerabilidades reportadas pelo npm. |
| `npm run build` | 0 | Build aprovado; chunk inicial 358.850 bytes, abaixo do limite de 400.000 bytes. |
| `npx vitest run --maxWorkers=1 --reporter=verbose` | 0 | 54 arquivos e 209 testes aprovados, incluindo 9 arquivos e 46 casos diretamente alterados/adicionados pela F01. |
| `git diff --check` | 0 | Sem erros de whitespace no delta de implementação. |

No SHA acima, os testes provaram parsing estrito e shapes desconhecidos (T03), a parcela temporal/binding então implementada de freshness (T10), o mapa fechado de Problem Details no nível do body/schema (parcela pura de T21), e limites locais Unicode/NFC/code points/bytes sem truncamento (parcela pura de T31).

## Revisão e limitações

- A primeira tentativa de build identificou Zod no chunk inicial e excedeu o limite em 8.775 bytes. O catálogo leve de capabilities foi separado dos schemas Zod; o build final aprovado ficou 41.150 bytes abaixo do limite. O limite não foi alterado.
- Esta evidência referencia o commit de implementação. O commit documental posterior contém somente esta evidência e atualizações de status; não altera o código testado.
- E2E de navegador, Worker, banco, provider, staging e GitHub Actions não eram aplicáveis ao gate puro executado neste SHA e não foram usados como prova.
- A verificação hospedada permaneceu indisponível por billing. Isso não é CI verde e não promove `PASS_LOCAL` global.
- AUTHZ-03 não foi comprovado por este SHA como evaluator completo; hierarquia, target, scope e enforcement permanecem em F10. A F01 comprovou o catálogo fechado e a negação de capability desconhecida.
- T21 não foi comprovado end-to-end: correspondência entre status HTTP real, headers, media type e Problem Details pertence à F03. Este SHA comprovou somente a parcela pura do schema/mapa.
- T10 não foi comprovado com provider/assinatura/AMR real; a prova completa pertence à integração de F07. Este SHA comprovou somente a parcela pura então implementada.
- A prova completa de T31 ainda depende dos adapters e caminhos de escrita F06/F09.
