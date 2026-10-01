# Toast

**Natureza:** referência vigente. **Escopo:** src/components/toast.
**Revisão:** 01/10/2026. **Baseline:** `6daa9bed8971928ed7b63749e9b493645de78025` + manutenção pré-F03 nesta branch.
**Status:** implementação existente descrita; resultados de execução ficam no [manifesto](../auth/evidence/pre-f03-maintenance-local.md), não são inferidos desta referência.

## Sumário navegável

- [Contrato e fronteira](#c1)
- [Uso e aparência](#c2)
- [Testes](#c3)
- [Limites e fontes](#c4)

<a id="c1"></a>

## Contrato e fronteira

Fluxo: operação → catálogo do escopo → notify(ToastDefinition) → toast.add → Toaster global. `src/components/toast/toast-contract.ts` define title, description?, type e priority?; `src/components/toast/toast-notify.ts` é o único adapter de produção. AppProviders importa somente Toaster; ESLint restringe demais imports nativos.

Catálogos vivem em notifications das features; DataTable tem catálogo compartilhado. Factories recebem escalares necessários, nunca Error/Response/DTO amplo. Adapter não classifica erros ou autoriza.

<a id="c2"></a>

## Uso e aparência

Toast anuncia resultado transitório. Falha de campo fica no campo; erro persistente fica no componente; confirmação usa AlertDialog; ausência de dados usa Empty. priority high decorre de urgência, não automaticamente de type error. loading nativo não é resultado no contrato.

CSS em src/index.css usa data-type e data-slot=toast-icon para colorir somente SVG por tokens semânticos. Revalidar seletores ao atualizar primitive; não copiar renderer para colorir status.

Exemplo: importe notify e sessionNotify de auth-notify e execute `notify(sessionNotify.signOutFailed)`; não usar error.message ou toast.add no consumidor.

<a id="c3"></a>

## Testes

`tests/unit/components/toast/toast.test.tsx` monta Toaster nativo e verifica mensagem; integração DataTable verifica cópia/feedback e sign-out verifica mensagem pública/urgente. Não duplicar tests upstream de animação/classes. [Catálogo](../project/validation.md#catalog).

<a id="c4"></a>

## Limites e fontes

Não é canal para detalhes técnicos, credenciais ou dados pessoais. [Toast shadcn](https://ui.shadcn.com/docs/components/base/toast), [Base UI Toast](https://base-ui.com/react/components/toast), [WAI-ARIA](https://www.w3.org/TR/wai-aria/).
