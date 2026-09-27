# Sidebar

Documentação ativa da navegação lateral da aplicação.

## Objetivo

A Sidebar é reconstruída sobre os primitives oficiais do shadcn/Base UI, preservando o resultado visual e comportamental aprovado e reduzindo estado redundante, matching duplicado e fragmentação de componentes.

A implementação anterior serve como referência visual e comportamental, não como arquitetura a ser copiada.

A documentação de Toast do projeto é apenas referência de governança: fronteiras explícitas, manutenção consciente de primitives, testes na fronteira pública e gates de validação. A arquitetura concreta da Sidebar é própria deste contexto.

## Estrutura

```text
src/app/shell/app-navigation.ts
src/app/shell/app-shell.tsx
src/components/sidebar/sidebar-app.tsx
src/components/sidebar/sidebar-navigation.ts
src/components/ui/sidebar.tsx
src/components/ui/collapsible.tsx

tests/integration/app-shell-navigation.test.tsx
tests/e2e/app.spec.ts
```

## Responsabilidades

### `src/components/ui/sidebar.tsx`

Primitive shadcn/Base UI. Possui infraestrutura de layout, estado desktop/mobile, `SidebarProvider`, `Sidebar`, `SidebarInset`, `SidebarTrigger`, grupos, menus e comportamento responsivo.

Não conhece rotas da aplicação, grupos de navegação, sessão, RBAC ou domínio.

Mudanças no primitive são tratadas como manutenção explícita e confrontadas com o registry/documentação oficial antes de serem aplicadas.

### `src/components/ui/collapsible.tsx`

Primitive Base UI/shadcn. A Sidebar usa `open` e `onOpenChange` para grupos controlados; regras específicas de navegação não entram no primitive.

### `src/app/shell/app-navigation.ts`

Configura quais páginas aparecem, em qual ordem e seção, e quais ícones utilizam. Título e caminho continuam derivados de `appPages` para evitar fontes duplicadas.

O modelo resolvido entrega `end` explicitamente para cada item.

### `src/components/sidebar/sidebar-navigation.ts`

Mantém o modelo estrutural reutilizado pela Sidebar e a política pura de matching necessária para item/seção ativa.

É detalhe interno da implementação: não possui suíte própria e pode ser renomeado, incorporado ou dividido futuramente sem alterar os testes de comportamento quando o contrato público permanecer igual.

### `src/components/sidebar/sidebar-app.tsx`

Compositor visual da Sidebar da aplicação. Monta branding, perfil, itens principais, seções recolhíveis e trigger usando os primitives oficiais.

Pode manter apenas o estado de interação que não é derivável da rota atual. Não possui regras de domínio, autorização, sessão ou acesso a dados.

## Estado das seções

A seção ativa é derivada de `pathname` + modelo de navegação durante a renderização.

O único estado adicional representa uma decisão manual do usuário para o pathname atual. A mudança de rota invalida naturalmente esse override, sem `key={pathname}` e sem Effect de sincronização.

Regras:

- rota dentro de uma seção abre essa seção;
- somente uma seção pode ficar aberta por vez;
- o usuário pode fechar manualmente a seção da rota ativa;
- o usuário pode abrir outra seção manualmente;
- ao navegar, o contexto da nova rota volta a determinar a seção apropriada;
- rotas principais não mantêm uma seção contextual indevida.

## Matching

A política programática utiliza `matchPath` do React Router com `path` e `end` do modelo resolvido.

`NavLink` permanece responsável pela semântica do link e por `aria-current="page"`.

`end: false` é utilizado somente quando uma rota pai precisa permanecer ativa em descendentes, como `Clientes` em `/clientes/:id`.

## Desktop e mobile

O estado estrutural expanded/collapsed e o estado mobile pertencem a `SidebarProvider`/`useSidebar`.

No mobile, selecionar um item fecha o menu após iniciar a navegação.

No desktop recolhido, todos os destinos permanecem navegáveis por ícone; não é criada uma segunda política de matching ou uma segunda implementação dos itens.

Persistência entre reloads não faz parte deste escopo sem requisito de produto explícito.

## Testes

Os testes protegem a navegação do shell, não nomes de arquivos, helpers, classes Tailwind ou internals do Base UI.

`tests/integration/app-shell-navigation.test.tsx` cobre:

1. rota ativa e seção correspondente;
2. rota descendente mantendo o item pai ativo;
3. somente uma seção aberta;
4. fechamento manual da seção da rota ativa;
5. troca de seção ao navegar entre grupos;
6. navegação para item principal sem seção contextual indevida;
7. fechamento do menu mobile após navegação;
8. navegação funcional com Sidebar desktop recolhida.

`tests/e2e/app.spec.ts` mantém apenas fluxos de alto valor para navegação real desktop e mobile.

Não testar isoladamente:

- `sidebar-navigation.ts`;
- helpers de matching;
- classes, cores, tamanhos ou animações;
- ícones específicos;
- internals de `SidebarProvider`, `Sheet`, Tooltip ou Collapsible.

## Fluxo de execução

1. criar branch limpa a partir de `origin/main`;
2. inventariar dependências e comportamentos atuais;
3. remover a implementação legada da Sidebar e referências órfãs;
4. auditar `ui/sidebar.tsx` e `ui/collapsible.tsx` contra fontes oficiais;
5. revisar `app-navigation.ts` sem duplicar `appPages`;
6. criar `sidebar-navigation.ts`;
7. criar `sidebar-app.tsx` do zero;
8. integrar no `AppShell`;
9. criar/realocar testes comportamentais;
10. revisar visual desktop/mobile, claro/escuro, expandido/recolhido;
11. revisar o diff final e remover código residual;
12. executar `npm run check` durante estabilização;
13. executar `npm run check:full` antes de merge;
14. abrir PR somente com o escopo da Sidebar;
15. exigir CI verde e aceite visual/comportamental;
16. após merge, sincronizar `main` local e remover a branch de trabalho.

## Gates

Durante estabilização:

```bash
npm run check
```

Gate final:

```bash
npm run check:full
```

O gate final inclui código não utilizado, auditoria de segurança, lint, tipos, Vitest, build, coverage e E2E determinístico conforme os scripts do projeto.

## Fora de escopo

- redesign visual;
- novos grupos ou páginas;
- implementação de RBAC;
- nova persistência de preferência;
- refatorações de toolbar, notificações ou menu do usuário sem dependência obrigatória;
- wrappers adicionais apenas por simetria com outros componentes;
- testes pixel-perfect.

## Referências oficiais

- shadcn Sidebar: https://ui.shadcn.com/docs/components/base/sidebar
- Base UI Collapsible: https://base-ui.com/react/components/collapsible
- React — Choosing the State Structure: https://react.dev/learn/choosing-the-state-structure
- React — You Might Not Need an Effect: https://react.dev/learn/you-might-not-need-an-effect
- React Router `matchPath`: https://reactrouter.com/api/utils/matchPath
- React Router `NavLink`: https://reactrouter.com/api/components/NavLink
- Testing Library — Guiding Principles: https://testing-library.com/docs/guiding-principles/
- Testing Library — ByRole: https://testing-library.com/docs/queries/byrole/
- Playwright — Best Practices: https://playwright.dev/docs/best-practices
