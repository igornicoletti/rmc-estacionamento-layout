# Plano de implementação — estado pós-merge

## V1 concluída

A v1 foi mergeada na `main` em 26/09/2026 após validação local completa.

Implementado:
- contrato TypeScript e adapter `notify()`;
- Session/logout com catálogo e prioridade acessível preservada;
- enforcement ESLint do manager de Toast;
- Clipboard técnica desacoplada de feedback visual;
- DataTable com ação/catálogo compartilhados para cópia de registros;
- Clients com factory dinâmica real para cópia de e-mail;
- testes das fronteiras implementadas.

## Follow-up pós-merge

A branch `refactor/toast-v1-v2-audit` executa apenas manutenção da v1:
1. alinhar `src/components/ui/toast.tsx` ao hook oficial `cn-toast` do preset Luma;
2. manter o visual nativo do container;
3. aplicar cor somente aos ícones por tokens semânticos existentes;
4. corrigir inconsistências documentais pós-merge;
5. consolidar riscos e melhorias não bloqueantes;
6. documentar a v2 sem implementá-la.

## Gate do follow-up

Antes de mergear esta manutenção:
- `git diff --check`;
- lint;
- typecheck;
- testes relevantes;
- build/check completo conforme scripts do projeto;
- working tree limpo;
- revisão final do diff.

Não criar testes que apenas congelem classes de cor do Toast.

## V2

Nenhuma capacidade v2 está autorizada apenas por constar no roadmap. Cada item exige caso real, revisão do contrato e teste proporcional ao comportamento próprio do projeto.
