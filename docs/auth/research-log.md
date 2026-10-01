# Registro de pesquisa oficial Auth

## 2026-09-30 — execução local da F02

A F02 foi autorizada após a integração e validação do saneamento F00/F01. As fontes oficiais foram reconferidas antes das migrations; nenhum ambiente remoto foi vinculado ou alterado.

| Tema | Fonte oficial | Versão ou decisão observada | Impacto planejado |
| --- | --- | --- | --- |
| CLI e migrations locais | https://supabase.com/docs/guides/local-development/cli-workflows | CLI `2.118.0` pinada; registry já oferece `2.119.0` | Mantida `2.118.0` por decisão aprovada; reconstrução feita por `supabase db reset`. |
| Database migrations | https://supabase.com/docs/guides/local-development/database-migrations | migrations são a única fonte evolutiva | Dumps por schema são evidência derivada e recebem checksum. |
| Testes de banco e pgTAP | https://supabase.com/docs/guides/local-development/testing/overview e https://supabase.com/docs/guides/database/extensions/pgtap | pgTAP `1.3.3` no stack local | Provar objetos, grants, RLS, constraints, RPCs e invariantes. |
| SDK servidor | https://supabase.com/docs/guides/auth/choosing-a-server-package | `@supabase/supabase-js` `2.117.2` pinado | Reservado ao adapter BFF futuro; a exceção temporária no Knip é explícita e nenhum import de browser foi criado. |
| Funções de banco | https://supabase.com/docs/guides/database/functions e https://www.postgresql.org/docs/17/sql-createfunction.html | as quatro RPCs corrigidas são `SECURITY INVOKER` e `search_path=''` | API expõe funções estreitas; nenhum `SECURITY DEFINER` foi necessário. |
| Row Level Security | https://supabase.com/docs/guides/database/postgres/row-level-security e https://www.postgresql.org/docs/17/ddl-rowsecurity.html | grants e RLS são controles distintos; `service_role` tem `BYPASSRLS` | Contraprovas separadas; FORCE RLS não é descrito como contenção do papel. |
| Mudanças incompatíveis | https://supabase.com/changelog?types=breaking-change | hosted registra PostgreSQL `17.11`; imagem local efetiva é `17.6.1.171`, servidor `17.6` | Major 17 compatível; minor local é registrado sem ser promovido a prova do target. Data API usa exposição opt-in. |
| Unicidade condicional | https://www.postgresql.org/docs/17/indexes-partial.html | unique partial indexes | Cardinalidades correntes de assignment, manager e sessão NORMAL são protegidas no banco. |

O stack local usa portas `55320`–`55329` porque outro projeto já ocupava a faixa padrão; nenhum processo do outro projeto foi interrompido. A prova hospedada, versões do target e advisors remotos permanecem fora do escopo da F02.

## 2026-10-01 — reauditoria crítica da F02

Busca dirigida por `CHECK NULL`, `foreign key nullable`, `FOR UPDATE column privileges`, `SECURITY INVOKER`, `BYPASSRLS`, `clock_timestamp` e `Supabase database CI`. Aceitas somente fontes oficiais PostgreSQL 17, Supabase e W3C. O contrato foi confrontado primeiro; fontes externas fundamentaram escolhas técnicas, sem redefinir regras de negócio. Achados, correções e limites estão em [f02-critical-audit.md](f02-critical-audit.md).

| Fonte consultada | Consequência na implementação |
| --- | --- |
| https://www.postgresql.org/docs/17/ddl-constraints.html | NULL tratado explicitamente; FKs compostas para purpose/binding/generation e triggers para identidade nullable. |
| https://www.postgresql.org/docs/17/explicit-locking.html e https://www.postgresql.org/docs/17/transaction-iso.html | Locks em ordem por identidade/contexto; validação após aquisição; nenhuma chamada externa na transação. |
| https://www.postgresql.org/docs/17/sql-select.html | UPDATE por coluna `id` necessário para row locks com invoker; triggers garantem ID imutável. |
| https://supabase.com/docs/guides/database/functions e https://www.postgresql.org/docs/17/sql-createfunction.html | Overloads com clock externo removidos; quatro RPCs invoker e grants mínimos. |
| https://supabase.com/docs/guides/api/using-custom-schemas e https://www.postgresql.org/docs/17/ddl-rowsecurity.html | Provas SQL com roles reais e probes HTTP locais; service_role não é contido por RLS. |
| https://supabase.com/docs/guides/deployment/ci/testing | Job específico de banco acrescentado ao workflow existente, CLI pelo lockfile, startup sem imprimir chaves; execução hosted continua dependente de billing. |
| https://www.w3.org/TR/WebCryptoAPI/ | Perfil binário SHA-256/AES-GCM documentado em ADR-002; SQL prova forma, adapter futuro provará criptografia. |

`supabase db advisors --local --type all --level warn --fail-on warn` existe na CLI pinada e foi executado; substitui a inferência anterior baseada somente em queries parciais de advisors.
