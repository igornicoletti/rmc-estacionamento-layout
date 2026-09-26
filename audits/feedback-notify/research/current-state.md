# Auditoria do estado atual

## Base

V1 mergeada em `main@dde4b6ba070a81d4c0bfeab823038b3fddbb8da2` em 26/09/2026. Esta revisão pós-merge é executada na branch `refactor/toast-v1-v2-audit`.

## Toast

`src/components/ui/toast.tsx` usa `@base-ui/react/toast`, cria um manager global e mantém o renderer local do shadcn/Base UI.

O projeto está configurado com `style: "base-luma"` em `components.json` e importa `shadcn/tailwind.css`.

### Comparação com o registry oficial

O Toast oficial atual usa a classe-hook `cn-toast` no root. O preset Luma aplica `rounded-2xl` por essa classe.

Antes desta revisão, o projeto tinha `rounded-2xl` hardcoded no root e não usava `cn-toast`. A aparência coincidia com o Luma atual, mas o componente não herdaria automaticamente uma futura alteração do preset.

Correção pós-merge:
- restaurar `cn-toast`;
- remover raio hardcoded;
- manter container/typografia/animações nativos;
- aplicar cor somente nos ícones semânticos.

## Tokens visuais

`src/index.css` já define e expõe:
- `--success` / `text-success`;
- `--info` / `text-info`;
- `--warning` / `text-warning`;
- `--error` / `text-error`.

Não é necessário criar tokens exclusivos do Toast.

Política:
- `success`, `info`, `warning`, `error`: cor apenas no ícone;
- `loading`: neutro e animado;
- nenhum fundo, borda, título ou descrição muda por `type`.

## Provider e manager

`src/app/root/app-providers.tsx` instala `<Toaster>`. `notify()` é o único adapter autorizado a acessar o manager pelo contrato de produção.

Não há justificativa para Provider, Context ou Hook adicional.

## Consumidores reais

A v1 migrou e consolidou casos reais:
- Session/logout;
- cópia genérica de registros da DataTable;
- cópia de e-mail em Clients com factory dinâmica.

Clipboard permanece operação técnica neutra.

## Priority

A falha de logout já possuía `priority: "high"` antes da abstração. A implementação final preservou esse comportamento explicitamente em `SESSION_FEEDBACK.signOutFailed`.

Isso confirma a regra: `type` visual e `priority` acessível são independentes. `error` não implica `high`, mas um catálogo pode declarar `high` quando a decisão for deliberada.

## QueryClient

Não existe política global de feedback acoplada ao TanStack Query. Mutations usam callbacks locais quando necessário; queries não geram Toast global automático.

## ESLint

`no-restricted-imports` restringe acesso direto ao módulo de Toast e libera `Toaster`. `notify.ts` recebe a exceção necessária para acessar o manager.

## Normalização e segurança

Dados externos reutilizam normalizadores/formatadores do domínio. `notify()` não sanitiza HTML, não interpreta `Error` e não expõe mensagens cruas de backend.

## Riscos não bloqueantes

- `Toaster` é permitido por símbolo em produção, sem restrição física ao arquivo de providers;
- `ToastClose` mantém `aria-label="Close toast"` do primitive oficial, embora a aplicação seja pt-BR;
- o viewport oficial usa `z-50`; existe risco conhecido no ecossistema shadcn de competição com overlays, ainda não reproduzido neste projeto;
- a regra de factory com um único objeto nomeado continua sendo contrato arquitetural, não enforcement estrutural completo do tipo.

Nenhum desses pontos justifica mudança imediata sem evidência de impacto no projeto.

## Conclusão

A v1 está arquiteturalmente estável. A manutenção pós-merge corrige alinhamento visual ao preset e documentação obsoleta. Capacidades adicionais pertencem à v2 e exigem caso real.
