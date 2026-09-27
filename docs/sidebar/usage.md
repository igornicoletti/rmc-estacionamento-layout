# Uso

## Configuração

Itens da Sidebar são declarados em `src/app/shell/app-navigation.ts`.

```ts
navigationItem("clients", TruckIcon, false)
```

O identificador aponta para `appPages`, que fornece `path` e `title`. Use `end: false` apenas quando uma rota pai precisar permanecer ativa em descendentes, como `/clientes/:id`.

## Composição

`AppShell` monta o provider e passa o modelo resolvido para a Sidebar:

```tsx
<SidebarProvider>
  <SidebarApp
    primaryItems={primaryNavigation}
    profile={currentUser.profile}
    sections={navigationSections}
  />
  <SidebarInset>{/* conteúdo */}</SidebarInset>
</SidebarProvider>
```

## Nova página

Para incluir uma página na navegação:

1. registre a página em `appPages`;
2. adicione o `AppPageId` em `app-navigation.ts`;
3. escolha item principal ou seção;
4. informe o ícone e, quando necessário, `end: false`;
5. execute os testes de navegação.

## Regras

Não colocar em `sidebar-app.tsx`:

- paths ou títulos hardcoded;
- consulta de dados;
- regra de sessão ou RBAC;
- lógica específica de uma página.

O menu mobile é fechado pela própria composição após a navegação. O estado expandido/recolhido desktop pertence ao `SidebarProvider`.
