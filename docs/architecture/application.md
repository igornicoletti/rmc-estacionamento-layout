# Arquitetura da aplicação

**Natureza:** referência vigente. **Escopo:** composição, rotas, cache e scaffold.
**Revisão:** 01/10/2026. **Baseline:** `74c7b24e647691e28df7935871c1b9afb6e34826` + F03 nesta branch.
**Status:** implementação existente descrita; resultados de execução ficam no [manifesto](../auth/evidence/pre-f03-maintenance-local.md), não são inferidos desta referência.

## Sumário navegável

- [Bootstrap e fronteiras](#c1)
- [Rotas e dados](#c2)
- [Sessão provisória e cache](#c3)
- [Testes e limites](#c4)
- [Fontes](#c5)

<a id="c1"></a>

## Bootstrap e fronteiras

`src/main.tsx` resolve DOM e monta StrictMode/App. `src/app/app.tsx` é composition root injetável; `src/app/app-router.ts` cria router uma vez fora da árvore React. AppProviders monta Query, tema, Auth provisório, Tooltip e Toaster.

app-routes concentra IDs/paths/builders/títulos de documento; app-metadata define produto; route-tree compõe entradas lazy. Conteúdo de tela pertence à feature, labels de navegação ao Sidebar. src/app é plano; não há config/root/layouts/session/shell internos. Erros React/rota/UX Auth têm boundaries distintos; [fallbacks](../ui/fallback.md).

<a id="c2"></a>

## Rotas e dados

Runtime atual monta MockShellRoute, explicitamente demo, sem seleção automática por ambiente. Rotas declaram authentication= either e são públicas; não há availability. /rmc é showcase em mocks. Lazy de rota carrega a feature; wrappers lazy redundantes foram removidos. 404 desconhecida fica fora do shell.

Loader pai não serializa loader filho automaticamente. Boundary visual não impede consulta privada; gate antes dos loaders/actions e enforcement definitivo BFF pertencem F03/F10/F11. Não transformar route metadata em autoridade servidor.

<a id="c3"></a>

## Sessão provisória e cache

AuthProvider provisório distingue bootstrap/anonymous/authenticated/unavailable. Cancelamento e descarte de resultados obsoletos protegem concorrência local; falhas de confirmação não viram logout. Mudança de identidade cancela/remove queries marcadas identityScoped antes de publicar contexto novo; Query é cache, nunca autoridade.

`src/lib/query/query-client.ts` centraliza client/retry/backoff/Retry-After. SessionCommands atuais não integram Supabase nem eventos reais, e não comprovam logout global/MFA/múltiplas abas. Contratos puros F01 têm autoridades canônicas, AAL e freshness separados; não coexistem como autoridades de produção.

<a id="c4"></a>

## Testes e limites

App routing/shell/navigation/errors/access/session/query/theme estão no [catálogo](../project/validation.md#catalog). Testes preservam cancelamento, cache seletivo, falha de sign-out, redirects query/hash, títulos e classificação. Não provam RLS/provider/BFF/MFA ou gate hospedado.

F00/F01/F02 são evidências locais históricas. F03 tem runtime próprio, não integra o scaffold ao Auth real. [Estado Auth](../auth/README.md).

### Fronteira F03

`worker/src/worker-entry.ts` despacha `/api` e `/api/*` antes dos assets. API desconhecida/desabilitada retorna Problem Details 404 mesmo com Accept HTML. Somente health público e contexto PREAUTH local são habilitáveis; ambientes hospedados mantêm contexto fechado.

Pipeline: roteamento → configuração → Origin/Fetch Metadata/cookie → leitura limitada → schema → RPC estreita → schema de saída → headers. Body: 8 KiB reais; URL: 2.048 bytes; Cookie: 4.096 bytes. Worker tem 12 s, upstream 5 s incluindo resposta; resposta pública 16 KiB e RPC 64 KiB são ADR, não limites normativos. Cancelamento não prova rollback.

Contexto usa jornada PREAUTH, cookie opaco HttpOnly e CSRF persistido hash+ciphertext AES-GCM; reentrega não renova TTL de 30 min. Criação/limiter são transacionais. Chaves distintas Cookie/CSRF/rate; AAD inclui versão, finalidade, contexto e generation. Sessões NORMAL e outras jornadas não são rebaixadas para PREAUTH. Protection helper valida Origin exato, cookie, CSRF e authority atual antes do handler; mutations futuras continuam 404.

API aplica no-store/nosniff/CSP e request ID inclusive no catch. HTML/assets usam `public/_headers`; hashes de estilos existentes são preservados. Scripts não permitem unsafe-inline/eval; style-src-attr unsafe-inline é exceção necessária ao posicionamento Base UI. HSTS/preload dependem do domínio hospedado validado. Logs têm apenas operação allowlisted, duração, status e request ID.

Teste HTTPS usa origem fixa `https://localhost:8787`, Supabase loopback 55321, chaves sintéticas efêmeras e certificado aceito somente pelo runner/browser de teste. Nenhuma confiança do sistema ou recurso remoto é alterado. Prova operacional hospedada continua F13.

<a id="c5"></a>

## Fontes

[Data Mode](https://reactrouter.com/start/modes), [createBrowserRouter](https://reactrouter.com/api/data-routers/createBrowserRouter), [useMatches](https://reactrouter.com/api/hooks/useMatches), [Query cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation).
