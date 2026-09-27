# App Components

Camada reutilizável da aplicação construída sobre os primitives em `src/components/ui`.

## Estrutura

```text
src/components/ui/   primitives shadcn/ui e Base UI
        ↓
src/components/app/  decisões reutilizáveis da aplicação
        ↓
features e páginas   regras e necessidades do domínio
```

A camada `App*` não substitui nem replica a API completa do shadcn/ui. Um wrapper existe quando centraliza uma decisão estável, como semântica, composição, acessibilidade ou comportamento compartilhado.

## Componentes atuais

- `AppAlertDialog`: decisões que exigem resposta explícita.
- `AppBadge`: tons semânticos da aplicação.
- `AppCalendar`: Calendar com timezone local explícito por padrão.
- `AppCombobox`: seleção simples, busca, limpeza e grupos opcionais.
- `AppDialog`: dialog controlado com corpo rolável.
- `AppEmpty`: estado vazio com heading semântico e media opcional.
- `AppSheet`: painel lateral direito com corpo rolável.

`Item` permanece como primitive nativo porque os consumidores atuais exigem composição granular e `render` polimórfico; não há política de aplicação suficiente para justificar `AppItem`.

## Regras principais

- não adicionar regra de negócio em `components/app`;
- não modificar `components/ui` para acomodar wrappers;
- preferir o visual nativo do shadcn/ui;
- estilos extras devem representar layout, acessibilidade ou semântica compartilhada;
- uso direto de `ui/*` continua válido quando a composição não pertence ao contrato `App*`;
- capacidades novas entram somente quando um caso real justificar a complexidade.

## Referências

- Arquitetura: `docs/app-components/architecture.md`
- Uso: `docs/app-components/usage.md`
- Testes: `docs/app-components/testing.md`
- Evoluções: `docs/app-components/roadmap.md`

Fontes oficiais:
- https://ui.shadcn.com/docs/components/base
- https://base-ui.com/react/overview/quick-start
- https://daypicker.dev/
