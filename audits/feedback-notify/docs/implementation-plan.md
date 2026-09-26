# Plano de implementação — estado revisado

## Estado atual

Concluído:
- contrato TypeScript e adapter `notify()`;
- testes unitários do contrato e adapter;
- piloto real de Session/logout;
- teste de integração do logout;
- enforcement ESLint para acesso direto ao Toast;
- suporte opcional a `priority` preservando a prioridade alta do erro de logout.

A validação local completa deve ser repetida no HEAD atual antes do merge. O GitHub Actions não é evidência útil enquanto os jobs forem encerrados sem runner (`runner_id: 0`, `steps: []`).

## Gate do PR atual

Antes do merge:
1. sincronizar a branch local;
2. executar `git diff --check`;
3. executar testes focados de feedback e integração do shell;
4. executar lint, typecheck e build;
5. executar `check:full`;
6. revisar o diff final;
7. manter o merge bloqueado se qualquer etapa falhar.

## Próximo domínio

Não criar catálogo apenas para preencher arquitetura. O próximo domínio entra quando existir uma ação real que necessite feedback transitório.

## Conteúdo dinâmico

O primeiro caso real deve validar:
- factory com objeto nomeado;
- parâmetros mínimos e tipados;
- ausência de DTO inteiro ou erro técnico;
- reutilização de presentation helpers existentes;
- nenhuma regra de negócio no catálogo.

## TanStack Query

Manter callbacks tipados locais quando feedback depender de `data`, `variables` ou classificação específica de erro. Reavaliar `mutation.meta.feedback` somente se mutations reais mostrarem boilerplate estático repetitivo. Queries não recebem Toast global automático.

## Extensões futuras

Somente mediante caso real e nova decisão documentada:
- dedupe/id;
- promise/loading lifecycle;
- actions;
- timeout customizado;
- observabilidade.

## Checklist por mudança

1. mudança pequena e auditável;
2. documentação oficial vigente confrontada;
3. nenhum arquivo não relacionado;
4. nenhum hardcode permanente fora de catálogo;
5. nenhuma mensagem técnica exposta;
6. TypeScript preserva inferência;
7. testes cobrem comportamento próprio;
8. lint/typecheck/tests/build passam.
