# Registro de pesquisa oficial Auth

## 2026-09-30 — preparação da F02

Esta consulta prepara decisões futuras; não instala dependências, não cria migrations e não autoriza a F02.

| Tema | Fonte oficial | Versão ou decisão observada | Impacto planejado |
| --- | --- | --- | --- |
| CLI e migrations locais | https://supabase.com/docs/guides/local-development/cli-workflows | Supabase CLI candidata `2.118.0` | Pinar somente após autorização; reconstruir com `supabase db reset`. |
| Database migrations | https://supabase.com/docs/guides/local-development/database-migrations | migrations como fonte evolutiva | Snapshot será evidência derivada, não fonte concorrente. |
| Testes de banco e pgTAP | https://supabase.com/docs/guides/local-development/testing/overview e https://supabase.com/docs/guides/database/extensions/pgtap | pgTAP no stack local | Cobrir objetos, grants, RLS, constraints e funções. |
| SDK servidor | https://supabase.com/docs/guides/auth/choosing-a-server-package | `@supabase/supabase-js` candidato `2.117.2` | Uso futuro apenas no BFF, request-scoped; nenhum SDK no browser. |
| Funções de banco | https://supabase.com/docs/guides/database/functions e https://www.postgresql.org/docs/17/sql-createfunction.html | invoker por padrão; definer excepcional e endurecido | RPC estreita, `search_path=''`, grants explícitos e nomes qualificados. |
| Row Level Security | https://supabase.com/docs/guides/database/postgres/row-level-security e https://www.postgresql.org/docs/17/ddl-rowsecurity.html | grants e RLS são controles distintos; `service_role` pode bypassar RLS | Contraprovas separadas; nunca declarar FORCE RLS como contenção de `service_role`. |
| Mudanças incompatíveis | https://supabase.com/changelog?types=breaking-change | PostgreSQL 17 e exposição opt-in da Data API devem ser verificadas no stack real | Registrar `show server_version`; não presumir minor nem exposição de schema. |
| Unicidade condicional | https://www.postgresql.org/docs/17/indexes-partial.html | unique partial index | Aplicar às cardinalidades correntes após autorização da F02. |

Versões candidatas são fotografia desta pesquisa. Antes da F02, elas devem ser verificadas novamente no registry/changelog oficial, pinadas exatamente no PR da fase e confrontadas com a versão efetivamente iniciada pelo stack local.
