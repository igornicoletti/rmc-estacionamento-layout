# Uso

## Regra geral

Preferir `App*` quando o consumidor se encaixar no contrato compartilhado. Usar `ui/*` diretamente quando a composição precisar de capacidades que deliberadamente não pertencem ao wrapper.

## AppEmpty

Usar para estados vazios e fallbacks que precisam de título, descrição, media opcional e conteúdo complementar. O nível do heading deve respeitar a hierarquia do contexto.

## AppCombobox

Usar para seleção simples com busca, limpeza e grupos opcionais. Os itens seguem `{ label, value, group? }`.

A lista é agrupada somente quando todos os itens possuem `group`. Listas parcialmente agrupadas permanecem planas.

## AppBadge

Usar para estados semânticos da aplicação: `neutral`, `info`, `success`, `warning` e `error`. Contagens e badges meramente visuais podem continuar usando o primitive nativo.

## Overlays

`AppDialog`, `AppAlertDialog` e `AppSheet` são controlados por `open` e `onOpenChange`. Regras para abrir, bloquear, persistir ou navegar pertencem ao consumidor.

## Primitive direto

`Item` continua sendo usado diretamente quando o consumidor precisa de `render`, slots individuais ou classes contextuais. Não ampliar um wrapper apenas para acomodar uma exceção isolada.

## Não colocar em App

- chamadas HTTP;
- TanStack Query;
- regras de sessão ou RBAC;
- copy específica de feature;
- DTOs de domínio quando valores menores bastam.

## Referências oficiais

- https://ui.shadcn.com/docs/components/base/empty
- https://ui.shadcn.com/docs/components/base/combobox
- https://ui.shadcn.com/docs/components/base/badge
