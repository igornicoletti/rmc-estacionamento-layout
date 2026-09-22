# Auditoria normativa de `src/app`

## Escopo e baseline

Esta implementação confronta a auditoria arquitetural anexada com o estado do
`rmc-estacionamento-layout`. O projeto `rmc-estacionamento` foi usado apenas
como referência comportamental para sessão fail-closed, lifecycle cancelável,
isolamento de cache e separação entre layout e autorização.

Antes da mudança, `src/app` continha somente `app-providers.tsx`, compondo
tooltip e toast. O entrypoint instalava esses providers diretamente e
`src/App.tsx` era simultaneamente tratado como raiz e página inicial. Não havia
router, sessão, Query Client nem boundaries globais.

## Matriz de conformidade

| Área | Estado | Evidência da implementação |
| --- | --- | --- |
| Bootstrap | Resolvido | `bootstrap/app.tsx` é o composition root; `main.tsx` mantém apenas DOM e Strict Mode. |
| Falha acima do router | Resolvido | `bootstrap/app-error-boundary.tsx` usa fallback independente e sanitizado. |
| Providers | Resolvido | `providers/app-providers.tsx` apenas compõe infraestrutura transversal. |
| Query | Resolvido | Client estável, defaults explícitos e mutations sem retry. |
| Sessão | Estruturalmente preparado | Estados discriminados, comandos injetáveis, bootstrap cancelável e indisponibilidade distinta de anonimato. |
| Routing | Resolvido | Router singleton, factory testável, rotas declarativas e root boundary. |
| Acesso | Estruturalmente preparado | Policy pura e fail-closed; a única rota real continua pública. |
| Layouts | Estruturalmente preparado | Layouts não executam fetch, sessão ou guards. |
| Autorização server-side | Não verificável | Este repositório não contém backend ou endpoints protegidos. |
| Integração de sessão real | Não verificável | A porta padrão resolve sessão anônima até existir autoridade externa. |

## Decisões críticas

- A página `/` mantém `authentication: "either"`; não foi criada uma falsa
  jornada de login.
- `SessionProvider` possui estado e comandos, enquanto
  `SessionBootstrapBoundary` possui a decisão visual.
- Falha ao consultar a autoridade produz `unavailable`, nunca `anonymous`.
- Refresh é ortogonal ao snapshot, evitando desmontar uma sessão válida.
- A porta de autoridade retorna somente estados resolvidos (`anonymous` ou
  `authenticated`); bootstrap e indisponibilidade pertencem ao provider.
- Logout e troca de identidade removem apenas queries marcadas com
  `meta.identityScoped: true`; cache público é preservado.
- `ProtectedLayout` não é guard. `RouteAccessBoundary` aplica políticas no
  browser somente para experiência; não concede autorização de backend.
- `route-access-fallback`, `root-hydrate-fallback` e `public-layout` foram
  omitidos porque os estados correspondentes ainda não existem.
- Políticas inválidas são negadas em runtime, e uma rota protegida só pode
  redirecionar quando o destino de autenticação for configurado explicitamente.
- Retry de queries é limitado a status HTTP transitórios conhecidos; erros sem
  classificação falham sem repetição.

## Riscos residuais e próximos gates

1. Substituir `anonymousSessionCommands` por uma implementação de autoridade
   apenas quando existir contrato HTTP definido, timeout, validação de payload e
   testes positivos/negativos.
2. Registrar queries privadas com `meta.identityScoped: true`; sem essa marcação
   não há como inferir com segurança a confidencialidade do cache.
3. Adicionar rotas protegidas somente com capabilities e assurance reais.
4. Validar autorização em cada request no backend; esconder rota ou botão não
   protege recurso.
5. Criar fallbacks condicionais somente quando hydration ou decisão assíncrona
   de acesso forem introduzidas.

## Resultado

`src/app` passa a ter owners explícitos para bootstrap, providers, sessão,
routing, acesso e layouts. A implementação materializa os contratos presentes
sem deslocar regras de feature para a infraestrutura global e sem representar
o frontend como autoridade de segurança.
