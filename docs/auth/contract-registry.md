# Registro do contrato e baseline — F00

## Fonte normativa

| Campo | Valor |
| --- | --- |
| Contrato | Contrato canônico de autenticação — rmc-estacionamento-layout — v1.0 |
| Versão de contrato | `1.0` |
| Data da consolidação | 28/09/2026 |
| Artefato recebido | `C:\Users\igor.nicoletti\Downloads\Contrato canônico de autenticação — rmc-estacionamento-layout — v1.0.md` |
| SHA-256 do artefato recebido | `74D7ABC89647F2AD668C933C89821EE1D08C451A08C80E194909AFB05AFDA148` |
| Checkout no início da F00 | `a097e74b8cba1822c1c73f2a47900106cf315b39` em `main` |

Uma alteração material do contrato requer nova versão, justificativa, impacto e
supersessão explícita. Este registro não substitui o contrato.

## Baseline observada

| Item | Evidência no checkout |
| --- | --- |
| Runtime | Node `v24.18.1`; npm `12.1.0` no ambiente de início. O manifesto requer Node `^24.18.1` e npm `11.6.0`. |
| SPA | Vite `8.3.0`, React `19.3.0`, TypeScript `6.0.2`, React Router `8.4.0`, TanStack Query `5.103.2` e Base UI `1.8.0` declarados no lockfile. |
| Auth existente | Scaffold de sessão com `anonymousSessionCommands`; não há adapter BFF, Worker, Supabase ou banco. |
| Rotas | O shell mock e as rotas estão explicitamente públicas (`authentication: either`); não representam autorização de produção. |
| Segredos | Nenhum segredo foi adicionado. `.env*` continua ignorado, exceto `.env.example`. |

## Ameaças e invariantes aplicáveis desde agora

O desenho deve resistir a credential stuffing, enumeração, CSRF, XSS que atue
na sessão, fixation, replay, BOLA/IDOR, escalada de privilégio, corridas de
refresh, respostas tardias, abuso de SMS, exaustão de memória, bypass de
autorização, perda/duplicação de mensagens e revogação incompleta.

Antes de habilitar qualquer fluxo, preservar no mínimo: negação por padrão;
tokens do provider apenas no servidor; sessão opaca em cookie; separação entre
identidade, papel, lifecycle e unidade; DTOs decodificados; cache privado por
contexto; CSRF sincronizador; e indisponibilidade distinta de sessão anônima.

## Feature flag e bloqueios

| Controle | Estado | Regra |
| --- | --- | --- |
| `VITE_AUTH_STAGE` | `disabled` por padrão; `candidate` no ambiente pessoal | Sem API origin, fluxo permanece fechado. |
| `candidate` | `https://rmc-estacionamento.igor93nicoletti.workers.dev` | Exige `VITE_AUTH_API_ORIGIN` HTTPS canônica; não torna o fluxo disponível. |
| `validated` | Bloqueado no bundle | Só pode ser concluído por manifesto/evidência target. |
| Domínio canônico, cookies e allowlist | Pendente de responsável | Não informado no contrato/anexo como configuração ativa deste checkout. |
| Provider, DB, Queue/DLQ, SMS e chaves | Pendente de infraestrutura | Não criar placeholders secretos nem adapter permissivo. |
| Contrato de Units/ERP real | Pendente | Bloqueia os gates dependentes de F02/F10. |

## Rastreabilidade inicial

| Requisitos do contrato | Entrega F00 |
| --- | --- |
| D16, CFG-01, CFG-02, CFG-04, SEC-20 | Validador explícito e fail-closed de configuração pública. |
| F00 | Baseline, inventário de pins, ameaça, registry e flags nesta pasta. |
| T37/T38 | Testes unitários para flags inválidas; rastreabilidade documental. Não constituem PASS_LOCAL. |

O deploy do Worker e os probes de SPA/API constituem a evidência operacional da
F00. Nenhum resultado histórico ou deste registro é evidência de PASS_LOCAL ou
PASS_TARGET.
