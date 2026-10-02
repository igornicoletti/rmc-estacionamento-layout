# F05 — revisão crítica após refatoração

Data da pesquisa: 02/10/2026. Branch feat/auth-f05-delivery; base 3cd7336ac374a8fc7f9b2ad3c6ef4ed56b849421. O anexo consolidado é especificação; a decisão do usuário fixa o ambiente gratuito de desenvolvimento como ponto de validação da F05 e adia F13 hospedada para a migração empresarial. [Prova corrente](evidence/F05-local.md) identifica os bytes efetivamente testados.

## Sumário navegável

- [Método e critérios](#method)
- [Achados e correções](#findings)
- [Revisão adversarial e limites](#limits)

<a id="method"></a>

## Método e critérios

Questões: (1) como retomar interrupção antes do efeito sem duplicar um efeito desconhecido? (2) onde persistir recuperação quando retries/retention da plataforma terminam? (3) quais locks/fences se aplicam ao commit local e quais não controlam o fornecedor? (4) como preservar evidência tardia sem conceder autoridade?

Busca dirigida por requisitos do capítulo21 e gate26.7 do contrato. Termos: Cloudflare Queues delivery guarantees; dead letter queues max retries retention; Queue send AbortSignal; PostgreSQL17 row locking transaction isolation; Supabase security invoker function privileges; Workers Web Crypto HMAC AES-GCM. Incluídas somente fontes primárias: documentação dos fornecedores, PostgreSQL e código/contratos do checkout. Fóruns, snippets e guias sem correspondência ao runtime foram excluídos como fundamentos. Não é uma revisão acadêmica de literatura nem prova de um fornecedor SMS real.

| Fonte consultada | Constatação relevante | Consequência na implementação |
| --- | --- | --- |
| [Cloudflare delivery guarantees](https://developers.cloudflare.com/queues/reference/delivery-guarantees/) | Entrega pelo menos uma vez permite duplicatas | IDs estáveis, dedup persistida e lookup; um fence SQL não substitui idempotência do gateway |
| [Queues local development](https://developers.cloudflare.com/queues/configuration/local-development/) | Wrangler/Miniflare exercita produtores e consumidores locais; concorrência de consumer não é simulada | Teste de integração injeta poison na Queue, observa DLQ e exige quarentena persistida; disputa concorrente é testada separadamente no banco |
| [Queues JavaScript API](https://developers.cloudflare.com/queues/configuration/javascript-apis/) | send retorna Promise; a confirmação comprova gravação; assinatura não oferece AbortSignal. Retorno normal do handler reconhece o lote salvo retry explícito | Espera limitada por deadline e listener removido em finally; timeout não cancela nem prova ausência de publicação. Toda mensagem sem persistência recebe retry individual |
| [DLQ](https://developers.cloudflare.com/queues/configuration/dead-letter-queues/) | Esgotar retries sem destino posterior apaga a mensagem; DLQ sem consumer tem retenção finita | Parking posterior, quarentena mínima e fonte persistida no DB; ambiguidades deixam de depender da Queue |
| [Queue configuration](https://developers.cloudflare.com/queues/configuration/configure-queues/) | Retenção configurável até14dias | Não confundir prazo padrão da página DLQ com retenção efetivamente configurada. Parking/retention/alertas requerem prova target |
| [PostgreSQL17 locks](https://www.postgresql.org/docs/17/explicit-locking.html) | Locks de linha coordenam transações locais e duram até seu encerramento | Ordem identity→journey→challenge→outbox→processing; owner/fence/lease são rechecados no begin e finish |
| [PostgreSQL17 isolation](https://www.postgresql.org/docs/17/transaction-iso.html) | READ COMMITTED pode observar estados diferentes entre comandos | Comparação de mensagem após lock; begin revalida o estado novamente. Nenhuma transação DB envolve a chamada de rede |
| [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) | service_role possui BYPASSRLS; grants e policies são controles distintos | Nenhuma nova função/tabela é concedida ao browser; credencial administrativa permanece exclusivamente no Worker |
| [Supabase functions](https://supabase.com/docs/guides/database/functions) | EXECUTE e privilégios de execução precisam ser explícitos; INVOKER usa privilégios do chamador | Novas RPCs INVOKER, search_path vazio, revokes PUBLIC/anon/authenticated e grants service_role. RLS não contém service_role |
| [Workers Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/) | AES-GCM/HMAC/importKey/verify são APIs suportadas | AAD e vetores existentes preservados; receipt verifica bytes exatos com versão explícita e keyring restrito |
| [RFC4648 seção3.5](https://www.rfc-editor.org/rfc/rfc4648.html#section-3.5) | Pad bits não canônicos podem produzir strings distintas para os mesmos bytes | Keyring exige encode(decode(key)) igual à entrada; comparação com chaves proibidas normaliza os bytes; assinatura também exige encoding canônico |
| [Supabase changelog](https://supabase.com/changelog?tags=database) | Atualização PostgreSQL17.11 registrada | Runtime/pins preservados; nenhuma atualização oportunista de dependência |
| [Supabase CLI config](https://supabase.com/docs/guides/local-development/cli/config) | `auth.sms.test_otp` define OTP de teste do Supabase Auth; TOTP possui flags locais próprias | Não substituir o desafio RMC de8 dígitos da F05 por OTP do Auth; TOTP pertence à F07, passkey ainda não possui gate nesta fase |

<a id="findings"></a>

## Achados e correções

Fontes no checkout: [consumer/dispatcher](../../worker/src/delivery/worker-delivery.ts), [RPC adapter](../../worker/src/delivery/worker-delivery-store.ts), [migration](../../supabase/migrations/20261002044315_auth_f05_delivery.sql), [testes Worker](../../worker/tests/worker-delivery.test.ts), [testes SQL](../../supabase/tests/database/auth_delivery.test.sql) e [integração real local](../../worker/scripts/worker-delivery-integration.mjs).

| Achado anterior | Correção | Evidência exigida |
| --- | --- | --- |
| REQUESTED persistia antes de decrypt, bloqueando retomada de falha sem envio | PREPARED recuperável; begin_delivery faz commit da intenção somente após preparar plaintext e repetir validação | Worker: decrypt falha e segunda preparação envia; SQL: lease expirada volta READY; integração DB/Queue retoma preparação interrompida |
| DLQ gravava DEAD antes de lookup | Consultar resultado; unknown grava RECONCILIATION_REQUIRED antes do ack | Worker: outcome aceito é persistido sem decrypt/send; SQL: pending reconciliation permanece recuperável |
| Ambiguidade acabava por limite de tentativas | Claim agendado em lotes5, lease30s, backoff5min e fence; nenhum send/decrypt; não há cutoff destrutivo para reconciliação | SQL: attempts5 não impede lookup; exclusão de lease concorrente; integração: switch DB desligado não impede bookkeeping |
| DEAD/STALE rejeitavam recibo real | Recibo fresco pode atualizar outcome quando requested_at comprova início, sem alterar jornada/sessão | SQL e integração: receipt tardio após DEAD preservado; DELIVERED não regride; receipt antes do início negado |
| Quarentena não correlacionava a fonte | outbox_id somente quando o corpo corresponde integralmente ao DB; nenhum payload armazenado | SQL: mensagem válida encontra fonte; poison recebe metadata redigida |
| Falha persistente na DLQ causava exclusão direta | DLQ posterior auth-delivery-quarantine, sem consumer automático; DB mantém fonte e reconciliação; PUBLISHED sem processamento pode ser republicado com IDs estáveis | Configuração local/dry-run; integração Workerd prova Queue→DLQ→quarentena persistida; política hospedada fica em F13 |
| Backlog e quarentena eram difíceis de inspecionar no desenvolvimento | Comando local de status mostra contagens/idades redigidas; `--assert-drained` participa do gate completo após cleanup | Gate completo falha se unprocessed, ambiguous, prepared, deadLetter ou quarantine restar; não presume monitoramento hospedado |
| queue.send pendurado ultrapassava orçamento e CAS era ignorado | Deadline próprio3s e parent; falha/timeout recupera por lease/CAS; CAS false falha explicitamente | Worker: promessa pendurada termina espera; abort não confirma publicação; fence perdido não é sucesso |
| Receipt tinha uma chave única sem transição | Keyring por versão, seleção explícita por X-Receipt-Key-Version, sem fallback entre chaves | Worker: chave anterior retida verifica; versão incorreta/desconhecida/ausente falha |
| Encoding canônico merecia prova explícita; schema compartilhado já rejeitava pad bits inválidos | Defesa redundante no keyring e retorno false para assinatura não canônica | Worker: bytes equivalentes com grafia alternativa são rejeitados; este ponto é hardening, não vulnerabilidade confirmada anterior |
| Inventário ignorava PHONE e sweep era ilimitado | Inventário PHONE/SMS_DELIVERY; sweep de leases vencidas limitado10 e auditado atomicamente | SQL, lint/advisors e equivalência de migration |
| Jobs scheduled somavam budgets e falha delivery suprimia provisioning | Jobs independentes sob orçamento comum25s e allSettled | Tipos/build e regressões locais; sem declaração de performance target |

<a id="limits"></a>

## Revisão adversarial e limites restantes

A primeira intenção de envio é autorizada no commit de begin. Há uma lacuna inevitável entre esse commit e a chamada ao gateway: um crash nela vira resultado desconhecido mesmo que o gateway nunca tenha recebido a chamada. PREPARED corrige a perda antes desse commit; não elimina atomicamente a fronteira DB/rede. O adapter atual não oferece prova definitiva de ausência. Portanto UNKNOWN consulta, persiste e escala; não há reenvio cego. Habilitar retry do send requer contrato/prova target de idempotência concorrente e janela de retenção adequadas.

Revogação/expiry/kill switch após begin não desfazem uma intenção externa já committed. A revalidação adicional fecha mudanças ocorridas durante lookup/decrypt; não é um lock sobre a rede. Lookup/receipt só concluem bookkeeping, sem NORMAL, promoção de identidade, reabertura de jornada ou novo envio.

Desabilitar o switch DB preserva reconciliação. Desabilitar a flag Worker suspende também lookup/receipt: usar essa parada completa conscientemente e reativar a composição para drenagem. Configuração inválida permanece fail-closed. Não criar fallback que aceite provider/DB arbitrário para resolver disponibilidade.

Reconciliação independe de Queue, chave de decrypt vigente e telefone atual. O source completo permanece privado no DB. Há bounded batch/backoff, mas nenhum timeout é sucesso e nenhum número de tentativas comprova ausência de efeito. A operação deve alertar idade/backlog não resolvido e investigar manualmente resultados que o fornecedor nunca consiga determinar. Logs de lote não comprovam SLO/monitoramento completo.

Parking também expira; não é armazenamento infinito. Para mensagens válidas, outbox/processamento preservam correlação e recuperação. Poison sem fonte não é uma obrigação de SMS e exige investigação se o DB continuar indisponível até o fim da retenção. A nova integração prova o percurso local Queue→DLQ→quarentena e o gate exige status drenado; não prova retenção por dias, consumo manual nem indisponibilidade prolongada. Recursos hospedados, alertas, quota e capacidade passam à F13, conforme a decisão do usuário de validar F05 no ambiente gratuito de desenvolvimento.

service_role continua privilegiado e pode alterar tabelas concedidas; INVOKER/RLS não tornam a credencial segura se comprometida. Ela deve permanecer server-only e restrita na infraestrutura. Nenhuma nova RPC é concedida ao browser. Retirada de chaves exige também Queue/parking, backups, restore, rollback e versão usada pelo emissor de recibos: inventário DB não decide sozinho.

O teste de begin executa também como service_role, não apenas postgres. FOR SHARE na fonte PHONE exigiria UPDATE e foi retirado sem ampliar grants. A autoridade continua bloqueada em identity; staging controlado da F04 também bloqueia identity e não substitui a fonte existente. begin compara o envelope atual. Alteração direta de fonte por administrador fora desse protocolo exige coordenação operacional; não é uma capacidade concedida ao BFF.

Os testes locais cobrem invariantes e falhas específicas, não exclusividade física ou entrega de SMS em produção. HMAC local, relógio±300s e protocolo local não são automaticamente o protocolo do fornecedor. F05 pode encerrar como gate de desenvolvimento, mantendo Auth disabled; F12 global e F13 hospedada continuam fases distintas. Não houve push/merge/deploy nem migração remota nesta refatoração.
