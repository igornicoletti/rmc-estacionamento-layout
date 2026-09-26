# Plano de implementação — estado revisado

## Estado atual

Concluído:
- contrato TypeScript e adapter `notify()`;
- testes unitários do contrato e adapter;
- piloto real de Session/logout;
- teste de integração do logout;
- enforcement ESLint para acesso direto ao Toast;
- suporte opcional a `priority` preservando a prioridade alta do erro de logout;
- separação da operação de Clipboard do feedback visual;
- ação e catálogo reutilizáveis para cópia de registros de DataTable;
- primeiro caso real de conteúdo dinâmico com `CLIENTS_FEEDBACK.emailCopied({ email })`;
- testes de Clipboard, DataTable, Clients e integração do shell.

A validação local completa deve ser repetida no HEAD atual antes do merge. O GitHub Actions não é evidência útil enquanto os jobs forem encerrados sem runner (`runner_id: 0`, `steps: []`).

## Gate do PR atual

Antes do merge:
1. sincronizar a branch local;
2. executar `git diff --check`;
3. executar testes focados de feedback, clipboard, DataTable, Clients e integração do shell;
4. executar lint, typecheck e build;
5. executar `check:full`;
6. revisar o diff final;
7. manter o merge bloqueado se qualquer etapa falhar.

## Próximos domínios

Não criar catálogo apenas para preencher arquitetura. Novos catálogos entram somente quando houver uma ação real que necessite feedback transitório.

## Conteúdo dinâmico

O caso de Clients validou factory com objeto nomeado, parâmetro mínimo/tipado e conteúdo controlado pelo catálogo. Próximos casos devem manter as mesmas fronteiras e reutilizar presentation helpers quando necessário.

## Operações reutilizáveis

Operações técnicas, como Clipboard, não incorporam feedback visual. Orquestradores reutilizáveis pertencem ao escopo que conhece a ação e selecionam o catálogo adequado.

Blocos `catch` classificam somente a operação técnica correspondente; erros do manager de feedback continuam propagando normalmente.

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
