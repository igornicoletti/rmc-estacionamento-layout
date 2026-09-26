# Auditoria do estado atual

## Base

Auditoria iniciada sobre `main@32d6cae6a9fe31a744fc9f042c91fe0d1f4d6818` e refinada durante o preflight da implementação em 26/09/2026.

## Constatações confirmadas

### Toast

`src/components/ui/toast.tsx` usa `@base-ui/react/toast` e cria um manager global com `ToastPrimitive.createToastManager()`.

O renderer atual:
- renderiza `title` e `description`;
- reconhece visualmente `success`, `info`, `warning`, `error` e `loading`;
- exporta `toast`, `createToastManager` e `useToastManager`;
- já possui o `Toaster` necessário para o viewport/renderer.

O primitive Base UI aceita uma superfície maior do que a necessária para o contrato de aplicação. A arquitetura reduz deliberadamente essa superfície.

### Provider

`src/app/root/app-providers.tsx` instala `<Toaster>` na árvore. Não há justificativa para novo Provider, Context ou Hook apenas para despachar feedback.

### Consumidores

A busca indexada inicial não revelou consumidores diretos, mas o preflight final arquivo por arquivo encontrou um caso real em `src/app/shell/app-shell.tsx`: a falha de `signOut()` chamava `toast.add(...)` diretamente, consumia `appCopy.feedback.logoutFailure` e forçava `priority: "high"`.

Esse achado corrige a conclusão preliminar da busca e demonstra por que a auditoria não pode depender apenas de code search. O fluxo de logout passou a ser o primeiro piloto real da arquitetura:

```text
signOut() rejeita
    ↓
SESSION_FEEDBACK.signOutFailed
    ↓
notify()
    ↓
Toast Manager
```

A migração remove o acesso direto ao manager no AppShell e deixa `Toaster` como único uso visual permitido fora do adapter.

### QueryClient

`src/app/root/query-client.ts` configura:
- `mutations.retry = false`;
- retry seletivo de queries;
- `retryDelay`;
- `gcTime`;
- `staleTime`;
- `refetchOnReconnect`.

Não existe `MutationCache` customizado. Nenhum mecanismo global de feedback está acoplado às mutations.

### ESLint

`eslint.config.js` já usava `no-restricted-imports` para impedir imports de infraestrutura de testes em produção. Durante a implementação, a mesma regra foi estendida para:
- impedir acesso direto ao módulo de Toast por código de produção;
- manter `Toaster` permitido para composição;
- permitir que `src/app/feedback/notify.ts` acesse o manager;
- preservar a restrição existente de `@tests/*`.

A antecipação desse enforcement é segura porque o preflight identificou e migrou o único consumidor legítimo do manager encontrado fora da infraestrutura.

### Testes

Vitest inclui:
- `tests/unit/**/*.{test,spec}.{ts,tsx}`;
- `tests/integration/**/*.{test,spec}.{ts,tsx}`.

A infraestrutura utiliza `tests/unit/app/feedback/`. O primeiro fluxo real possui teste separado em `tests/integration/app-shell-feedback.test.tsx`, sem misturar o comportamento com os testes de navegação existentes.

### Normalização e apresentação de dados

O projeto já possui normalização e formatação de apresentação fora do Toast:
- `src/lib/erp/erp-record.ts` exporta `sanitizeErpText`, que normaliza Unicode NFC, remove caracteres de controle/formatação, compacta whitespace e aplica trim;
- `src/pages/units/model/unit-presentation.ts` reutiliza esse sanitizer e aplica regras de nome/cidade/data;
- `src/pages/clients/model/client-presentation.ts` faz o mesmo para nomes, cidades, telefone, placa e outros valores.

Consequência: a arquitetura de feedback não cria um segundo sanitizer genérico. Valores interpolados devem reutilizar a apresentação já existente no domínio quando vierem dessas fontes.

## Problemas e riscos confirmados

1. **Acesso direto ao manager existia de fato.** O logout no AppShell demonstrou que sem enforcement a feature pode escolher conteúdo, prioridade e primitive por conta própria.
2. **`type` do Base UI é aberto (`string`).** O contrato da aplicação restringe os tipos aos suportados na v1.
3. **`title` e `description` do primitive aceitam `ReactNode`.** O projeto não possui requisito para conteúdo rico e os restringe a texto.
4. **Acessibilidade não deve ser inferida do tipo visual.** O caso real de logout usava `priority: "high"` para um erro não urgente; a migração remove esse acoplamento e volta à prioridade padrão `low`.
5. **Erro técnico não pode virar conteúdo público.** `error.message`, stack e detalhes de infraestrutura permanecem fora do contrato.
6. **Conteúdo dinâmico é necessidade previsível.** A v1 já suporta factories tipadas, mesmo que o primeiro piloto real seja estático.
7. **Definição inline não resolve centralização.** Trocar `toast.add({...})` por `notify({...})` manteria o mesmo problema.
8. **Automação global de mutations seria prematura.** Callbacks globais do MutationCache recebem `unknown` para data/variables; conteúdo dinâmico permanece próximo do contexto tipado até aparecer repetição comprovada.
9. **Sanitização duplicada seria dívida técnica.** `notify()` não repete regras que já pertencem a `sanitizeErpText` e aos formatadores de apresentação dos domínios.

## Observação fora do escopo

O botão de fechamento do Toast atual contém `aria-label="Close toast"`. Isso demonstra uma inconsistência transversal real, mas esta iniciativa não altera o primitive. Qualquer revisão visual/acessível do componente deve ocorrer em bloco próprio.

## Conclusão

A infraestrutura existente é suficiente para um adapter síncrono e pequeno. O primeiro consumidor real foi migrado e a fronteira de imports foi fechada. Continuam sem justificativa Context, Provider adicional, store, event bus, registry runtime, parser de tokens, sanitizer global de feedback ou `useNotify`.
