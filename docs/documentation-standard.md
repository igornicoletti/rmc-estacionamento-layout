# Padrão documental

**Natureza:** convenção e rastreabilidade editorial. **Revisão:** 01/10/2026.
**Baseline:** main 6daa9be + manutenção pré-F03. **Status:** adotado nesta branch; não altera contrato.

## Sumário navegável

- [Formato](#format)
- [Integridade](#integrity)
- [Mapa de consolidação](#migration)
- [Validação](#validation)

<a id="format"></a>

## Formato

Um arquivo por escopo em inglês/kebab-case, sem prefixo da pasta ou numeração temática.
README é entrada, não cópia da referência. FXX ordena fases reais; ADR identifica decisões
estáveis dentro do documento. Não criar escopos vazios/fases futuras.
Dados iniciais: natureza, escopo, status, revisão e baseline. Em seguida: resumo/limites,
sumário navegável, responsabilidades/consumidores, contratos/uso, testes e fontes.
Anchors explícitos são estáveis; tabelas concentram inventários. Exemplos preservam
entradas/saídas/erro/a11y sem copiar source inteiro. Remover repetição, não invariantes.
Datas representam revisão real; versões/contagens antigas ficam em evidência histórica.

<a id="integrity"></a>

## Integridade

Fontes primárias: mantenedores/documentação oficial; registrar URL/data/versão/impacto.
Contrato byte-for-byte protegido por .gitattributes e SHA-256. Formatter não altera
contrato, manifestos FXX ou snapshots SQL. Editorial histórico preserva resultados,
SHA, horários e limites; reparos de links são registrados abaixo.

<a id="migration"></a>

## Mapa de consolidação

| Origem em main 6daa9be | Destino | Preservado / removido |
| --- | --- | --- |
| docs/app/{README,architecture,usage,testing}.md | [ui/app.md](ui/app.md) | Contratos/uso/consumidores/limites; suites inexistentes corrigidas |
| docs/sidebar/{README,architecture,usage,testing}.md | [ui/sidebar.md](ui/sidebar.md) | Estado/navegação/a11y; appPages e app/shell retirados da referência vigente |
| docs/toast/{README,architecture,usage,testing}.md | [ui/toast.md](ui/toast.md) | Adapter/catálogos/urgência; paths e testes antigos corrigidos |
| docs/data-table/{README,architecture,usage,testing,roadmap}.md | [ui/data-table.md](ui/data-table.md) | Factory/lifecycle/CSV/limites; roadmap especulativo retirado; refetch conforme source |
| docs/architecture/auth-routing-audit.md | [Aplicação](architecture/application.md), [Auth](auth/plan-and-requirements.md) | Fronteiras/pendências válidas; planos executados/paths removidos/fresh-aal2 supersedidos ficam no Git |
| docs/architecture/{features-migration,shared-components-review,lib-audit}.md | [Features/lib](architecture/features-and-lib.md), UI | Decisões vigentes; totais antigos não transportados como prova atual |
| docs/auth/{implementation-plan,requirements-matrix}.md | [Plano/matriz](auth/plan-and-requirements.md) | Sequência/gates/requisitos/status/limites completos |
| docs/auth/adr-001-opaque-identifiers.md e adr-002-persistence-profile.md | [Decisões](auth/decisions.md) | IDs/justificativas/consequências preservados |
| docs/auth/contract-registry.md | [README Auth](auth/README.md), [contrato](auth/contract-v1.0.md) | Registro/hash/baselines e limites; catálogos duplicados substituídos pelo normativo |
| docs/auth/research-log.md | [Pesquisa](auth/research.md) | Histórico preservado; manutenção acrescentada |
| docs/auth/f02-critical-audit.md | [F02 audit](auth/F02-critical-audit.md) | Filename identificado pela fase; relatório preservado |
| F02-local.md e F02-reaudit-local.md | Mesmos arquivos evidence | Somente case do link da auditoria; SHA/resultados/horários/limites inalterados |
| docs/contracts/hub-erp.md | Mesmo caminho | Proveniência/campos/limites/OpenAPI preservados; dados/sumário/testes adicionados; resultados antigos retirados da referência |
| README raiz | [README](../README.md) | Quickstart/estado/comandos; inventários extensos migrados |

Não há redirecionamentos vazios nem cópias históricas. Git retém o conteúdo removido no
SHA de origem; contrato, snapshots e manifestos FXX permanecem no checkout.

<a id="validation"></a>

## Validação

`npm run docs:check`: AST Markdown, links/anchors locais, paths declarados, catálogo sem
lacunas/duplicatas, checksum do contrato/snapshots e regras de workflow; Markdownlint
nas referências atuais. Links externos ficam na pesquisa, fora do gate offline.
Existência de path não prova semântica: revisão de contratos/consumidores é manual.

[Diátaxis](https://diataxis.fr/start-here/), [markdownlint-cli2](https://github.com/DavidAnson/markdownlint-cli2),
[remark](https://github.com/remarkjs/remark), [pesquisa](auth/research.md).
