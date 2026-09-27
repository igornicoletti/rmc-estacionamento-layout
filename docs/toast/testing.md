# Testes

## Princípio

Testar comportamento público na fronteira reutilizável. Não criar teste apenas porque um helper, catálogo ou novo consumidor existe.

Refactors internos que preservam comportamento não devem exigir reescrever a suíte.

## Cobertura do Toast

`tests/unit/components/toast/toast.test.tsx`

Valida o fluxo público:

```text
notify()
  ↓
Toaster nativo
  ↓
mensagem visível
```

O teste pode montar `Toaster` diretamente porque está validando a própria infraestrutura Toast. Ele não testa classes, cores, animações ou internals do Base UI.

As cores dos ícones são uma regra CSS externa baseada no estado `data-type` documentado pelo Base UI e nos `data-slot` presentes no source oficial do shadcn. Não duplicar essa implementação em testes unitários de componentes.

## Cobertura da DataTable

`tests/unit/components/data-table/data-table-row-actions.test.tsx`

Valida uma única vez:
- operação de cópia concluída → notificação de sucesso;
- operação de cópia rejeitada → notificação de erro.

Páginas que apenas reutilizam `DataTableRowActions` não repetem testes de Toast.

## Regras específicas de produto

Um escopo mantém teste próprio somente quando possui comportamento adicional relevante. O sign-out, por exemplo, protege que uma falha use mensagem pública controlada e prioridade urgente sem expor o erro interno.

## Validação durante desenvolvimento

Para mudanças pequenas, priorizar testes relacionados e lint focado:

```bash
npx vitest related <arquivo-alterado> --run
npx vitest --changed origin/main
```

Executar `npm run typecheck` quando contratos, imports ou tipos forem alterados.

## Gates

Fechamento de um bloco:

```bash
npm run check
```

Antes de merge:

```bash
npm run check:full
```

`check:full` é gate final de integração; não é o loop padrão após cada pequena alteração.

## Referências oficiais

- Testing Library — Guiding Principles: https://testing-library.com/docs/guiding-principles/
- Vitest CLI: https://vitest.dev/guide/cli
- Vitest `changed`: https://vitest.dev/config/changed
