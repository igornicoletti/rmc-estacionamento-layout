# Componentes de interface da aplicação

`src/components/ui` contém os componentes instalados pelo shadcn/ui (Base UI). `src/components/app` contém composições com decisões próprias da aplicação. A API `App*` é menor que a do primitive e não contém regras de domínio.

| Componente | Decisão centralizada | Uso atual |
| --- | --- | --- |
| `AppAlertDialog` | `AlertDialogCancel` opcional e `AlertDialogAction` obrigatória | Sessão |
| `AppDialog` | Corpo rolável e `DialogClose` configurável no rodapé | Upload de imagem |
| `AppEmpty` | Título semântico; ícone ou avatar compostos pelo wrapper | Shell, rotas, DataTable |
| `AppCombobox` | Seleção simples pesquisável, limpeza e grupos | Filtro da DataTable |
| `AppBadge` | Tons semânticos e ícone opcional | Prévia `/rmc` |
| `AppCalendar` | Fuso local como padrão, com override | Prévia `/rmc` |
| `AppSheet` | Corpo rolável e `SheetClose` configurável no rodapé | Prévia `/rmc` |

Use `ui/*` diretamente quando não houver decisão compartilhada, como o `Badge` de contagem da DataTable. A rota `/rmc` permite inspecionar todos os `App*` visualmente, mas uma prévia não equivale a um fluxo funcional de produto.

## Pendências do levantamento

- Revisar a permanência de `AppBadge`, `AppCalendar` e `AppSheet` quando houver dados de uso: hoje eles só têm consumidores na prévia e nos testes.
- Revalidar a geometria de `AppSheet` quando ele ganhar um fluxo de produto com conteúdo real.

## Leitura complementar

- [Fronteiras e nome](architecture.md)
- [Contratos de uso](usage.md)
- [Testes e lacunas](testing.md)
