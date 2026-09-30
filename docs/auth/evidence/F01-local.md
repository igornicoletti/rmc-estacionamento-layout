# Evidência local F01 — contratos puros

> **Evidência corrente:** este manifesto comprova o SHA de implementação `e1125b0ee90bff810a6365f284581d4e6477332c`. Não representa `PASS_LOCAL`, `PASS_TARGET`, `GO` ou autorização para iniciar F02.

| Campo | Valor |
| --- | --- |
| `schemaVersion` | `1` |
| `contractVersion` | `1.0` |
| `phase` | `F01` |
| `repositorySha` | `e1125b0ee90bff810a6365f284581d4e6477332c` |
| `environment` | `LOCAL`, Windows, checkout `rmc-estacionamento-layout` |
| `versions` | Node `24.18.1`; npm `11.6.0`; TypeScript `6.0.2`; Vitest `5.0.1`; Zod `4.6.5` |
| `configuration` | Auth `disabled`; sem SDK Supabase, Worker, banco, Queue, SMS ou secrets |
| `executionWindow` | `2026-09-30`, encerrada às `16:59:25-03:00` |

## Procedimentos e resultados

| Procedimento | Exit | Resultado |
| --- | ---: | --- |
| `git diff --check` | 0 | Sem erros de whitespace. |
| `npm run lint` | 0 | ESLint sem warnings. |
| `npm run typecheck` | 0 | TypeScript aprovado. |
| `npm run unused:check` (`npx knip`) | 0 | Sem exports, arquivos ou dependências bloqueantes. Não existe script `npm run knip`; o nome canônico do projeto é `unused:check`. |
| `npm audit --audit-level=high` | 0 | `0` vulnerabilidades. |
| testes focados F00/F01 | 0 | `6` arquivos, `39` testes. |
| `npx vitest run --maxWorkers=1 --reporter=verbose` | 0 | `54` arquivos, `227` testes. |
| `npm run test:coverage` | 0 | `54` arquivos, `227` testes; statements `87.07%`, branches `82.40%`, functions `86.02%`, lines `87.30%`. |
| `npm run build` | 0 | `tsc -b`, Vite (`3629` módulos) e bundle-size check aprovados. |
| `npm run test:e2e:check` | 0 | Chromium, `19/19` testes. |

## Revisão e limites

- Transições lifecycle/onboarding agora são funções runtime totais: entrada desconhecida, fato ausente e transição proibida retornam `DENY`, sem exceção.
- `AuthScope` é público e estrito; a chave externa de unidade é texto opaco, sem suposição de UUID.
- IDs internos/contextuais/comandos foram formalizados como UUID v4 no ADR-001; segredos de 256 bits permanecem categoria distinta.
- `CryptoProvider`, `QueuePublisher` e `AuditSink` são somente portas puras. Adapters, criptografia efetiva, Queue e auditoria persistente não estão implementados nem comprovados nesta fase.
- Os barrels sem prefixo foram removidos e os imports agora apontam diretamente para módulos prefixados.
- T10, T21 e T31 continuam comprovados apenas em suas parcelas puras. Banco/concorrência, HTTP real, provider, staging e target pertencem às fases posteriores.
- GitHub Actions bloqueado por billing não é CI verde. A validação acima é local e vinculada ao SHA informado.
