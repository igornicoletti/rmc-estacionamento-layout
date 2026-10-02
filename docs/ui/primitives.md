# Primitives shadcn / Base UI

**Natureza:** referência vigente. **Escopo:** src/components/ui.
**Revisão:** 01/10/2026. **Baseline:** `6daa9bed8971928ed7b63749e9b493645de78025` + manutenção pré-F03 nesta branch.
**Status:** implementação existente descrita; resultados de execução ficam no [manifesto](../auth/evidence/pre-f03-maintenance-local.md), não são inferidos desta referência.

## Sumário navegável

- [Inventário e fronteira](#c1)
- [Manutenção e uso](#c2)
- [Testes](#c3)
- [Limites e referências](#c4)

<a id="c1"></a>

## Inventário e fronteira

Base Luma, Base UI, Tailwind v4, Lucide, SPA sem RSC. Código instalado em `src/components/ui` é a camada primitiva; regra de produto pertence às features, composição compartilhada com contrato pertence a `components/app`.

| Família | Primitives instalados |
| --- | --- |
| Ações/feedback | button, badge, alert, empty, spinner, skeleton, toast, tooltip |
| Formulários | input, textarea, input-group, combobox, select, calendar |
| Overlays/menus | dialog, alert-dialog, sheet, popover, hover-card, dropdown-menu |
| Estrutura/dados | avatar, item, separator, collapsible, sidebar, table |

Não há componentes de formulário Auth implementados nem autorização por primitive.

<a id="c2"></a>

## Manutenção e uso

Use variants e estados nativos antes de CSS adicional. Composição Base UI usa `render`, não `asChild`. Botões mantêm `disabled` nativo; links preservam semântica de link. Dialog/Sheet exigem título acessível. Ícones decorativos usam `aria-hidden`.

Tipografia mobile existente: `src/index.css`, até47.999rem, aplica0.875rem aos controles e placeholders, incluindo input-group-control. O slot é usado por InputGroupInput/InputGroupTextarea e descrito na [documentação oficial](https://ui.shadcn.com/docs/components/base/input-group). Componente copiado não foi atualizado. E2E clientes390px verifica14px no controle/placeholder, foco e ausência de overflow; Chromium não prova comportamento de autozoom do Safari físico. Zoom do usuário não é desabilitado.

Atualização de pacote não atualiza source copiado. Consulte `npx shadcn@latest info --json`, `docs <component>`, `add <component> --dry-run` e `--diff <file>` antes de modificar; revise alterações locais. Não execute overwrite global. O alias utils no CLI não é consumidor runtime: primitives atuais importam `cn` do pacote; não criar src/lib/utils por inferência.

<a id="c3"></a>

## Testes

Contratos acrescentados são testados nas composições/consumidores, não em cópias dos testes upstream. ESLint e Knip excluem source gerado em `ui`; isso não é certificação de acessibilidade. [Catálogo completo](../project/validation.md#catalog). E2E da prévia cobre overlays, teclado e geometria.

<a id="c4"></a>

## Limites e referências

Não alegar leitor de tela, produção ou upstream atualizado a partir de preview. [shadcn CLI](https://ui.shadcn.com/docs/cli), [components.json](https://ui.shadcn.com/docs/components-json), [Base UI](https://base-ui.com/react/overview/quick-start).
