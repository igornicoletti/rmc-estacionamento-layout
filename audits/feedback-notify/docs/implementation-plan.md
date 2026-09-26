# Plano de implementação — estado final do PR

## Concluído

- contrato TypeScript e adapter `notify()`;
- Session/logout com catálogo e prioridade acessível preservada;
- enforcement ESLint do manager de Toast;
- Clipboard técnica desacoplada de feedback visual;
- DataTable com ação/catálogo compartilhados para cópia de registros;
- Clients com factory dinâmica real para cópia de e-mail;
- testes das fronteiras implementadas;
- documentação arquitetural atualizada.

## Gate do PR

Antes do merge:
1. sincronizar `feat/feedback-notify` no HEAD publicado;
2. executar `git diff --check`;
3. executar testes focados de feedback, clipboard, DataTable, Clients e shell;
4. executar `check:full`;
5. confirmar working tree limpo;
6. revisar o diff final.

O merge permanece bloqueado se qualquer etapa falhar. GitHub Actions continua não autoritativo enquanto jobs forem encerrados sem runner.

## Expansões futuras

Novos domínios/capacidades entram somente mediante evento real. Permanecem fora da v1: dedupe/id, promise/loading lifecycle, actions, timeout customizado, observabilidade e integração global por MutationCache.
