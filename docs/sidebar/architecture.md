# Arquitetura

## Responsabilidades

### `src/components/ui/sidebar.tsx`

Primitive shadcn/Base UI responsável por `SidebarProvider`, estado desktop/mobile, layout, trigger, menus e comportamento responsivo. Não conhece rotas, sessão, RBAC ou domínio.

### `src/components/ui/collapsible.tsx`

Primitive usado para controlar seções recolhíveis por `open` e `onOpenChange`.

### `src/app/shell/app-navigation.ts`

Define a navegação da aplicação. Título e caminho vêm de `appPages`; ordem, seção, ícone e `end` pertencem à configuração de navegação.

### `src/components/sidebar/sidebar-navigation.ts`

Define o modelo tipado e centraliza o matching com `matchPath`.

### `src/components/sidebar/sidebar-app.tsx`

Compõe branding, perfil, itens, seções e trigger. Mantém somente o estado de interação que não pode ser derivado da rota.

## Fluxo

```text
appPages
   ↓
app-navigation.ts
   ↓
SidebarNavigationItem / SidebarNavigationSection
   ↓
sidebar-navigation.ts + pathname
   ↓
sidebar-app.tsx
   ↓
ui/sidebar.tsx + ui/collapsible.tsx
```

## Estado

A seção ativa é derivada do `pathname`. O único override armazenado representa a escolha manual do usuário para a rota atual.

Assim:

- apenas uma seção pode ficar aberta;
- não existe estado booleano por seção;
- não é necessário sincronizar pathname com `useEffect`;
- a navegação para outra rota descarta naturalmente o override anterior.

## Fronteiras

- primitives `ui/` não recebem regras da aplicação;
- Sidebar não decide autorização ou sessão;
- paths e títulos não são duplicados fora de `appPages`;
- matching programático usa uma única política;
- `NavLink` permanece responsável pela semântica do link ativo.

## Referências oficiais

- shadcn Sidebar: https://ui.shadcn.com/docs/components/base/sidebar
- Base UI Collapsible: https://base-ui.com/react/components/collapsible
- React — Choosing the State Structure: https://react.dev/learn/choosing-the-state-structure
- React — You Might Not Need an Effect: https://react.dev/learn/you-might-not-need-an-effect
- React Router `matchPath`: https://reactrouter.com/api/utils/matchPath
