# Roadmap

Capacidades abaixo só devem ser adicionadas quando houver requisito real.

## Filtragem por acesso

**Serve para:** exibir somente destinos permitidos ao usuário.

**Adotar quando:** RBAC estiver integrado às rotas. A resolução deve acontecer antes de `SidebarApp`; a Sidebar não decide permissões.

## Persistência do estado desktop

**Serve para:** restaurar expanded/collapsed após reload.

**Adotar quando:** houver requisito de produto para lembrar essa preferência.

## Seções dinâmicas

**Serve para:** montar grupos a partir de configuração remota ou capacidades variáveis.

**Adotar quando:** a navegação deixar de ser estática. Preservar um modelo resolvido antes da renderização.

## Observabilidade

**Serve para:** medir uso de destinos, abertura de grupos e padrões de navegação.

**Adotar quando:** existir estratégia de analytics. Não acoplar telemetria ao primitive `ui/sidebar.tsx`.

## Atualizações de primitives

Mudanças do registry shadcn/Base UI devem ser tratadas como manutenção explícita. Revisar documentação oficial, diff do primitive e comportamento desktop/mobile antes de atualizar.

## Referências oficiais

- shadcn Sidebar: https://ui.shadcn.com/docs/components/base/sidebar
- Base UI Collapsible: https://base-ui.com/react/components/collapsible
