# Evidência local F00 — baseline

> **Escopo:** manifesto retrospectivo da baseline F00, renovado após a reauditoria F00/F01. Não representa `PASS_LOCAL`, `PASS_TARGET`, `GO` ou autorização de release.

| Campo | Valor |
| --- | --- |
| `schemaVersion` | `1` |
| `contractVersion` | `1.0` |
| `phase` | `F00` |
| `baselineMergeSha` | `b10043a7b516a9056a86c694679a1a453bef90a5` |
| `revalidatedImplementationSha` | `e1125b0ee90bff810a6365f284581d4e6477332c` |
| `contractSha256` | `74D7ABC89647F2AD668C933C89821EE1D08C451A08C80E194909AFB05AFDA148` |
| `environment` | `LOCAL`, Windows, checkout `rmc-estacionamento-layout` |
| `versions` | Node `24.18.1`; npm `11.6.0` |
| `configuration` | Auth `disabled` por padrão; `candidate` não seleciona upstream; sem SDK Supabase, Worker ou secrets no browser |
| `executionWindow` | `2026-09-30`, encerrada às `16:59:25-03:00` |

## Resultado e limites

Os sete arquivos não documentais da F00 foram reconfrontados com o contrato. As alterações posteriores de `package.json` e lockfile pertencem legitimamente à F01. Nenhum defeito funcional crítico foi encontrado na baseline.

A reauditoria incluiu `git diff --check`, lint, typecheck, Knip, audit, testes focados, Vitest serial, cobertura, build e E2E Chromium; os totais consolidados estão no manifesto F01 do mesmo SHA. O GitHub Actions impedido por billing é limitação de infraestrutura e nunca evidência positiva.
