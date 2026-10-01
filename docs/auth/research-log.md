# Registro de pesquisa oficial Auth

## 2026-09-30 — execução local da F02

A F02 foi autorizada após a integração e validação do saneamento F00/F01. As fontes oficiais foram reconferidas antes das migrations; nenhum ambiente remoto foi vinculado ou alterado.

| Tema | Fonte oficial | Versão ou decisão observada | Impacto planejado |
| --- | --- | --- | --- |
| CLI e migrations locais | https://supabase.com/docs/guides/local-development/cli-workflows | CLI `2.118.0` pinada; registry já oferece `2.119.0` | Mantida `2.118.0` por decisão aprovada; reconstrução feita por `supabase db reset`. |
| Database migrations | https://supabase.com/docs/guides/local-development/database-migrations | migrations são a única fonte evolutiva | Dumps por schema são evidência derivada e recebem checksum. |
| Testes de banco e pgTAP | https://supabase.com/docs/guides/local-development/testing/overview e https://supabase.com/docs/guides/database/extensions/pgtap | pgTAP `1.3.3` no stack local | Provar objetos, grants, RLS, constraints, RPCs e invariantes. |
| SDK servidor | https://supabase.com/docs/guides/auth/choosing-a-server-package | `@supabase/supabase-js` `2.117.2` pinado | Reservado ao adapter BFF futuro; a exceção temporária no Knip é explícita e nenhum import de browser foi criado. |
| Funções de banco | https://supabase.com/docs/guides/database/functions e https://www.postgresql.org/docs/17/sql-createfunction.html | as três RPCs são `SECURITY INVOKER` e `search_path=''` | API expõe funções estreitas; nenhum `SECURITY DEFINER` foi necessário. |
| Row Level Security | https://supabase.com/docs/guides/database/postgres/row-level-security e https://www.postgresql.org/docs/17/ddl-rowsecurity.html | grants e RLS são controles distintos; `service_role` tem `BYPASSRLS` | Contraprovas separadas; FORCE RLS não é descrito como contenção do papel. |
| Mudanças incompatíveis | https://supabase.com/changelog?types=breaking-change | hosted registra PostgreSQL `17.11`; imagem local efetiva é `17.6.1.171`, servidor `17.6` | Major 17 compatível; minor local é registrado sem ser promovido a prova do target. Data API usa exposição opt-in. |
| Unicidade condicional | https://www.postgresql.org/docs/17/indexes-partial.html | unique partial indexes | Cardinalidades correntes de assignment, manager e sessão NORMAL são protegidas no banco. |

O stack local usa portas `55320`–`55329` porque outro projeto já ocupava a faixa padrão; nenhum processo do outro projeto foi interrompido. A prova hospedada, versões do target e advisors remotos permanecem fora do escopo da F02.
