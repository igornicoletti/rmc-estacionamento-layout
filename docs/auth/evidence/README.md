# Evidência reproduzível de Auth

Cada arquivo de evidência representa uma execução ou procedimento sobre um único SHA e ambiente. Evidência histórica não é transportada para outro commit por inferência.

## Campos obrigatórios

| Campo | Conteúdo |
| --- | --- |
| `schemaVersion` | Versão deste formato de manifesto |
| `contractVersion` | Versão do contrato canônico |
| `phase` | Fase F01–F14 vinculada |
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

## Regras

- Nunca registrar secrets, cookies, senhas, OTPs, tokens, payloads pessoais ou URLs privilegiadas.
- Falha de runner ou teste não iniciado não é PASS.
- Um arquivo pode registrar `passed`, `failed`, `blocked` ou `not-run`; não pode promover manualmente `validated`.
- `PASS_LOCAL`, `PASS_TARGET` e GO exigem os conjuntos completos definidos pelo contrato, não apenas um comando verde.
- Artefatos sanitizados recebem SHA-256 e caminho relativo; logs brutos com dados sensíveis não são anexados.
