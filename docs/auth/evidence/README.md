# Evidência reproduzível

**Natureza:** formato de manifesto. **Revisão:** 01/10/2026. **Status:** convenção vigente; não é resultado de execução.

## Sumário navegável

- [Campos obrigatórios](#fields)
- [Regras](#rules)

Cada execução registra um SHA/ambiente. Histórico não é transportado por inferência.

<a id="fields"></a>

## Campos obrigatórios

| Campo | Conteúdo |
| --- | --- |
| `schemaVersion` | Versão deste formato de manifesto |
| `contractVersion` | Versão do contrato canônico |
| `phase` | Fase F00–F14, ou manutenção explicitamente fora das fases |
| `requirementIds` | Requisitos e testes T vinculados |
| `repositorySha` | SHA completo efetivamente testado |
| `environment` | Ambiente canônico; não usar `candidate` como ambiente |
| `versions` | Node, npm, dependências, provider, banco e deployment aplicáveis |
| `configuration` | Configuração não secreta relevante |
| `procedure` | Comando ou procedimento exato |
| `startedAt` / `finishedAt` | Instantes ISO 8601 |
| `exitCode` | Código de saída quando automatizado |
| `results` | Casos, totais, checksums e resultado por requisito |
| `limitations` | Itens não executados, indisponíveis ou inconclusivos |
| `responsible` | Pessoa ou automação que produziu a evidência |

<a id="rules"></a>

## Regras

- Nunca registrar secrets, cookies, senhas, OTPs, tokens, payloads pessoais ou URLs privilegiadas.
- Falha de runner ou teste não iniciado não é PASS.
- Um arquivo pode registrar `passed`, `failed`, `blocked` ou `not-run`; não pode promover manualmente `validated`.
- `PASS_LOCAL`, `PASS_TARGET` e GO exigem os conjuntos completos definidos pelo contrato, não apenas um comando verde.
- Artefatos sanitizados recebem SHA-256 e caminho relativo; logs brutos com dados sensíveis não são anexados.
