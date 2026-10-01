# Features e utilitários

**Natureza:** referência vigente. **Escopo:** src/features, src/lib, src/shared e mocks.
**Revisão:** 01/10/2026. **Baseline:** `6daa9bed8971928ed7b63749e9b493645de78025` + manutenção pré-F03 nesta branch.
**Status:** implementação existente descrita; resultados de execução ficam no [manifesto](../auth/evidence/pre-f03-maintenance-local.md), não são inferidos desta referência.

## Sumário navegável

- [Organização vigente](#c1)
- [Lib e compartilhamento](#c2)
- [Shared e escopo Auth](#c3)
- [Testes e pendências](#c4)
- [Fontes](#c5)

<a id="c1"></a>

## Organização vigente

Raiz de cada feature contém somente entradas *-page.tsx. Responsabilidades existentes ficam em components/contracts/queries/mapping/presentation/content/notifications; sem pastas vazias. Clientes/Unidades completos; veículos é subdomínio de Clientes. Dashboard/Pátio/Relatórios/Preços/Regras/Perfil/Usuários/Permissões/Segurança/Auditoria/Notificações têm placeholders em features, não pages.

Query keys/readers loadDemo e fixtures em mocks são demonstração usada no runtime, não fixtures exclusivas de testes. Nenhuma API real ou política de cache de produção foi presumida. Aliases internos @/; domínio prefixa módulos técnicos; shared/auth e authorization usam imports diretos/prefixados, sem barrels.

<a id="c2"></a>

## Lib e compartilhamento

| Diretório | Contrato |
| --- | --- |
| browser | Clipboard API e propagação de falha |
| csv | Serialização CRLF/escaping e download |
| erp | Readers defensivos, CPF/CNPJ, UF, data/fuso e formatação ERP |
| http | Leitura defensiva de status |
| query | Fábrica de client e política de retry |
| records | Campos, cópia e projeção CSV |
| user | Iniciais de apresentação |

Raiz de lib vazia; não introduzir barrel/utility genérico. CPF Auth versus ERP têm fronteiras distintas, não duplicação removível. Source real preservado, formatação na apresentação/cópia/CSV. [ERP](../contracts/hub-erp.md).

AppTooltipButton centraliza tooltip/nome/disabled; DataTableActions/RowActions centralizam CSV/cópia/feedback. Features não importam implementações umas das outras; facetas semelhantes são oportunidade, não motivo para absorver consultas em página genérica.

<a id="c3"></a>

## Shared e escopo Auth

F01 em `src/shared/auth` e `src/shared/authorization` é puro: schemas/estados/ports/evaluator parcial sem React/SDK/I-O. ESLint corrigido e contraprovas impedem import proibido ser sobrescrito por regra genérica. Migrations F02 permanecem fonte evolutiva; snapshots somente derivados. [Plano/matriz](../auth/plan-and-requirements.md).

<a id="c4"></a>

## Testes e pendências

Mappers/presentation/fixtures/contratos/tabelas testados por domínio; libs por contrato; [catálogo](../project/validation.md#catalog). UI preview-only não é unused: retirar requer decisão e diff de consumidores.

Identidade ERP autoritativa em Units não comprovada, capacidades unit-scoped fechadas. Reader demo deve ser substituído somente na fase autorizada; novas extrações exigem duplicação semântica e consumidor real. Histórico de migrações/auditorias ficou no Git; [mapa](../documentation-standard.md#migration).

<a id="c5"></a>

## Fontes

[React state](https://react.dev/learn/choosing-the-state-structure), [TanStack Query](https://tanstack.com/query/latest), [contrato Auth](../auth/contract-v1.0.md#c27).
