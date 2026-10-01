# Header

**Natureza:** referência vigente. **Escopo:** src/components/header.
**Revisão:** 01/10/2026. **Baseline:** `6daa9bed8971928ed7b63749e9b493645de78025` + manutenção pré-F03 nesta branch.
**Status:** implementação existente descrita; resultados de execução ficam no [manifesto](../auth/evidence/pre-f03-maintenance-local.md), não são inferidos desta referência.

## Sumário navegável

- [Contratos](#c1)
- [Uso](#c2)
- [Testes](#c3)
- [Limites e fontes](#c4)

<a id="c1"></a>

## Contratos

Header monta trigger de sidebar mobile e children. HeaderUserMenu recebe nome/avatar/e-mail, destino de perfil, callback logout e isSigningOut; consome tema e usa avatar fallback. HeaderNotifications recebe itens, status loading/ready/unavailable, callbacks individuais/em lote, estados pending e destino opcional.

Notificações: preview máximo cinco, badge +99 acima de 99, nome acessível depende do estado/contagem; link individual impede repetição enquanto reading. Não expõe payload técnico ou resolve permissões.

<a id="c2"></a>

## Uso

Destinos vêm do shell/runtime. Estado vazio difere de indisponibilidade; marcar como lida e logout pertencem ao consumidor. Menu respeita disabled; avatar e links mantêm semântica. Alinhamento mobile considera viewport e trigger.

<a id="c3"></a>

## Testes

`tests/unit/components/header/header-notifications.test.tsx` e `tests/unit/components/header/header-user-menu.test.tsx`: estados, badges, ações, destinos e bloqueio. Integração shell/sign-out e E2E completam os fluxos; [catálogo](../project/validation.md#catalog).

<a id="c4"></a>

## Limites e fontes

Itens atuais são demonstração, sem serviço de notificações real. [Popover](https://base-ui.com/react/components/popover), [Dropdown Menu](https://ui.shadcn.com/docs/components/base/dropdown-menu).
