# Composições App

**Natureza:** referência vigente. **Escopo:** src/components/app.
**Revisão:** 01/10/2026. **Baseline:** `6daa9bed8971928ed7b63749e9b493645de78025` + manutenção pré-F03 nesta branch.
**Status:** implementação existente descrita; resultados de execução ficam no [manifesto](../auth/evidence/pre-f03-maintenance-local.md), não são inferidos desta referência.

## Sumário navegável

- [Contratos e consumidores](#c1)
- [Uso](#c2)
- [Testes](#c3)
- [Limites e referências](#c4)

<a id="c1"></a>

## Contratos e consumidores

Wrappers recebem valores/callbacks prontos; não consultam dados, classificam erros, navegam ou autorizam.

| Composição | Contrato acrescentado | Consumidores |
| --- | --- | --- |
| AppTooltipButton | Ícone decorativo, nome acessível obrigatório, tooltip hover/foco, um botão via render, disabled nativo | Tabelas e cópia de e-mail |
| AppEmpty | Título e headingLevel; mídia ícone ou avatar com alt/fallback; ações em children | Shell, fallbacks, tabelas |
| AppCombobox | Seleção simples string/undefined, pesquisa, limpeza, grupos somente se todos os itens têm group | Filtro compartilhado |
| AppDialog / AppSheet | open/onOpenChange/título obrigatórios; corpo rolável; fechamento nativo configurável | Prévia /rmc |
| AppAlertDialog | Descrição/ação obrigatórias; cancelamento nativo opcional | Prévia /rmc |
| AppBadge | Tons primary/info/success/warning/error e ícone opcional | Prévia /rmc |
| AppCalendar | timeZone explícito prevalece sobre fuso do browser | Prévia /rmc |

<a id="c2"></a>

## Uso

Overlays são controlados pelo consumidor; `closeLabel={null}` omite fechamento de Dialog/Sheet; `cancelLabel={null}` omite cancelamento de AlertDialog. `actionProps` e `cancelProps` permitem personalização na confirmação.

No Combobox, mantenha o item selecionado em items; limpeza produz undefined. Grupos parciais viram lista plana; children personaliza a linha sem eliminar identificação textual. AppEmpty compõe o avatar; render envolve interação sem transferir essa composição.

Use primitive direto quando não houver decisão compartilhada, como Badge de contagem. Não criar wrapper só para repassar props.

<a id="c3"></a>

## Testes

As oito suítes em `tests/unit/components/app` cobrem ação/cancelamento nativos, seleção/limpeza/grupos, avatar/heading, fuso e tooltip/disabled. `tests/e2e/rmc.spec.ts` mede overlays, conteúdo e scroll com rodapé visível. Filtro tem cobertura na integração DataTable; [catálogo](../project/validation.md#catalog).

Focado: `npx vitest run tests/unit/components/app`; E2E requer build e navegador instalado.

<a id="c4"></a>

## Limites e referências

AlertDialog/Dialog/Sheet/Badge/Calendar ainda são preview-only; reavaliar quando houver consumidores funcionais, sem removê-los como se fossem unused. Geometria futura de conteúdo real exige nova prova. [Composição Base UI](https://base-ui.com/react/overview/composition), [Button](https://ui.shadcn.com/docs/components/base/button), [Tooltip](https://ui.shadcn.com/docs/components/base/tooltip).
