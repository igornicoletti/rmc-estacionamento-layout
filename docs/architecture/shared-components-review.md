# Features e componentes compartilhados

Revisão de 28/09/2026, partindo de `main` em `53348279c615688c2ae73501525dd68ef9e77a34`.
Esta etapa aplica a orientação posterior do usuário sobre subdiretórios em features.
O documento `features-migration.md` registra a etapa anterior, quando a orientação era estrutura plana.

## Organização vigente

Somente entradas `*-page.tsx` ficam diretamente na raiz de cada feature. Os demais
arquivos ficam em subdiretórios conforme a responsabilidade existente:

| Diretório                     | Responsabilidade                                      |
| ----------------------------- | ----------------------------------------------------- |
| `components`                  | Tabelas, colunas e células específicas do domínio     |
| `contracts`                   | Tipos dos registros e da sessão provisória            |
| `queries`                     | Chaves e leitura assíncrona dos dados de demonstração |
| `mapping`                     | Conversão dos registros ERP para os contratos locais  |
| `presentation`                | Formatação, seções de detalhes e colunas CSV          |
| `content`                     | Conteúdo de interface do domínio                      |
| `notifications`               | Catálogo de notificações do domínio                   |
| `auth/access`, `auth/session` | Política de acesso e lifecycle do scaffold existente  |

Não são criadas pastas vazias. Veículos continua como subdomínio de Clientes,
com a mesma separação interna. Placeholders têm apenas o arquivo de página.
`src/app` continua sem subdiretórios. Auth real continua adiado até auditoria
própria do projeto `igornicoletti/rmc-estacionamento`.

## Problemas confirmados e correções

| Problema no baseline                                                                                                             | Correção                                                                                                   | Consumidores                                                 |
| -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Exportar e Gerenciar colunas montavam tooltip/trigger de formas diferentes | `AppTooltipButton` centraliza um único botão, nome acessível, tooltip e `disabled` nativo | Exportar e Gerenciar colunas                                 |
| Ações de ícone sem explicação consistente                                  | Uso do mesmo `AppTooltipButton`                                                    | Limpar filtros, paginação, ações de linha e cópia de e-mails |
| Três tabelas repetiam montagem e processamento da exportação                                                                     | `DataTableActions` recebe tabela, nome do arquivo e colunas CSV                                            | Clientes, Unidades e Veículos                                |
| Exportação podia usar registros antigos durante refetch e não apresentava falha de geração                                       | Bloqueio durante carregamento/atualização; toast de erro na falha síncrona                                 | As três tabelas                                              |
| Cópia de e-mails ficava em HoverCard baseado em PreviewCard, inadequado para controles interativos                               | Popover acionável por clique/teclado; título associado, foco inicial no painel e retorno ao trigger        | Célula de e-mail de Clientes                                 |
| Inventário App atribuía uso em sessão/upload a componentes hoje usados apenas na prévia                                          | Inventário corrigido a partir dos imports atuais                                                           | `docs/app/README.md`                                         |

`AppTooltipButton` compõe `TooltipTrigger` e `Button` pelo `render` do Base UI,
mantendo um único botão com `aria-label`. O estado desabilitado usa o atributo
nativo e as classes já fornecidas pelo primitive shadcn.

`DataTableActions` exporta todo o modelo anterior à paginação, mantendo filtros
e ordenação atuais. Ocultar colunas da tela não modifica o contrato CSV definido
pelo domínio. O callback de exportação é síncrono; download remoto assíncrono
exigirá um contrato próprio quando existir.

## Uso entre escopos

| Composição                                                                     | Compartilhamento e fronteira                                                                                                                          |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DataTableComboboxFilter → AppCombobox → ui/combobox`                          | Clientes e Unidades compartilham pesquisa, limpeza, grupos e contagens; o domínio fornece itens e facetas                                             |
| `DataTableActions → DataTableExport/DataTableViewOptions → AppTooltipButton → ui` | Mesmos contratos para Clientes, Unidades e Veículos                                                                                                |
| `DataTableRowActions`                                                          | Cópia com feedback compartilhado; navegação para detalhes é fornecida por callback do domínio                                                         |
| `DataTableEmpty → AppEmpty`                                                    | Estado vazio compartilhado com conteúdo e limpeza definidos pelo consumidor                                                                           |
| `DataTableError`, `DataTableUpdating`, `DataTablePagination`                   | Estados e controles compartilhados; query e retry pertencem à feature                                                                                 |
| `Badge` de contagem                                                            | Uso direto de `ui/badge` adequado: não representa tom semântico de `AppBadge`                                                                         |
| Limpar busca e limpar Combobox                                                 | Permanecem controles nativos compostos com InputGroup/Combobox; não são botões isolados da toolbar                                                    |
| Header e Sidebar                                                               | Avatar, contador de notificações e trigger do sidebar têm composição própria; não são substituídos por um botão de ícone que perderia esses contratos |
| Dialog, AlertDialog, Sheet, Calendar e Badge App                               | Hoje consumidos pela prévia e testes; não comprovam integração funcional em produto                                                                   |

Não há imports de componentes específicos de Clientes em Unidades. Utilitários
ERP, CSV e clipboard são compartilhados em `lib`; tabelas usam `components/data-table`.
A repetição de nomes de coluna, formatos e conteúdo é específica do domínio.
A preparação semelhante de facetas de cidade ainda existe em Clientes e Unidades:
é oportunidade de extração de regra pura, não foi incluída nesta etapa.
Não foi criada uma página genérica que absorva consultas e regras dos três domínios.

## Evidência e limites

Testes cobrem tooltip por hover/foco, bloqueio por clique/Enter/Espaço,
feedback de falha CSV, exportação na ordem do modelo filtrado e bloqueio durante
atualização. As suítes dos domínios cobrem filtros, CSV e ações de linha.
Chromium verifica os triggers reais, menu por teclado, exportação sem resultados,
Popover de e-mails e retorno do foco, além das jornadas anteriores.

Validação local desta etapa: suíte completa Vitest com 164 testes em 45 arquivos;
dois testes novos de `DataTableActions` também aprovados em execução focada,
junto dos testes de botão e Clientes (10 testes em 3 arquivos). Chromium passou
as 17 jornadas. Lint, typecheck/build e Knip aprovados; raízes das features sem
arquivos diferentes de `*-page.tsx` e diff de primitives vazio.

Esta revisão não declara toda a interface auditada nem valida leitor de tela,
Firefox ou WebKit. Componentes somente da prévia devem ter sua permanência
reavaliada quando houver consumidores reais. Nenhum primitive de `src/components/ui`
foi alterado.

Referências oficiais consultadas: [Tooltip](https://base-ui.com/react/components/tooltip),
[Button](https://base-ui.com/react/components/button),
[Popover](https://base-ui.com/react/components/popover),
[Preview Card](https://base-ui.com/react/components/preview-card) e
[composição](https://base-ui.com/react/handbook/composition).
