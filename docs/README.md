# Documentação do projeto

**Natureza:** índice vigente. **Revisão:** 01/10/2026. **Baseline:** main 74c7b24 + F03/revisão Auth v1.1; SHAs executados nas evidências.
**Status:** referências por responsabilidade; histórico não é prova do checkout atual.

## Sumário navegável

- [Leitura por tarefa](#navigation)
- [Precedência e estado](#state)

<a id="navigation"></a>

## Leitura por tarefa

| Necessidade | Referência |
| --- | --- |
| Ambiente/dependências | [Desenvolvimento](project/development.md) |
| Validar e descobrir testes | [Validação e catálogo](project/validation.md) |
| Composição/rotas/cache/scaffold | [Aplicação](architecture/application.md) |
| Módulos/ERP/utilitários | [Features e lib](architecture/features-and-lib.md) |
| Primitives/composições | [Primitives](ui/primitives.md), [App](ui/app.md) |
| Shell/navegação | [Layout](ui/layout.md), [Sidebar](ui/sidebar.md), [Header](ui/header.md) |
| Tabelas/feedback | [Data Table](ui/data-table.md), [Toast](ui/toast.md) |
| Tema/falhas | [Theme](ui/theme.md), [Fallback](ui/fallback.md) |
| Proveniência de negócio | [ERP](contracts/hub-erp.md) |
| Contrato/gates/evidências | [Auth](auth/README.md) |
| Atualizar/consolidar docs | [Padrão e mapa](documentation-standard.md) |

<a id="state"></a>

## Precedência e estado

Contrato e decisões explícitas prevalecem sobre referências derivadas; source não muda
requisitos silenciosamente. Um escopo mantém uma referência atual. Procedimentos,
contratos e explicações ficam separados por seção, sem proliferar arquivos.
Somente evidência por SHA/ambiente comprova execução. Demo não autentica: BFF/provider,
Queue/SMS/ERP autoritativo e target têm gates pendentes. FXX ordena implementação;
temas não recebem número/prefixo da pasta. [Evidências](auth/evidence/README.md).
