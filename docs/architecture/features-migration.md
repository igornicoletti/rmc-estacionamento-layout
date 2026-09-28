# Migração dos domínios para Features

Base: main `c9bec14`, após merge do PR #22. Branch: `refactor/features-architecture`.

## Fronteiras implementadas

Clientes e Unidades eram domínios completos dentro de pages. Suas pastas técnicas misturavam tipos, mappers, apresentação, consultas e fixtures. Agora cada responsabilidade tem nome explícito no diretório do domínio. Não existem cópias dos mesmos domínios em pages e features.

- `features/clients`: página, detalhe, tabela, colunas, email-cell, tipos, mapper, formatadores, descrição de registros, conteúdo, notify e query.
- `features/clients/vehicles`: tabela, colunas, tipos, mapper, formatadores, descrição de registros, conteúdo e query. Veículos é um subdomínio real ligado ao cliente.
- `features/units`: página, tabela, colunas, tipos, mapper, formatadores, descrição de registros, conteúdo e query.
- Dashboard, Pátio virtual, Relatórios, Preços e Regras recebem entradas `*-page.tsx`, mantendo o retorno vazio existente. Nenhum comportamento novo foi criado por template.
- Perfil, Usuários, Permissões, Segurança da conta, Auditoria e Notificações permanecem adiados, aguardando a auditoria e o contrato real de Auth. Seus módulos vazios continuam em pages.

## Consulta, demonstração e conteúdo

As keys de Query e os valores ERP foram preservados. A apresentação continua formatando dados sem alterar o valor de origem. Readers usam o nome loadDemo*, e fixtures de demonstração ficam em mocks. Esses dados são usados pelo runtime atual e por testes; não são fixtures exclusivas de teste. O gerador de CNPJ simulado é compartilhado somente dentro de mocks.

Não foi introduzida API real, configuração de ambiente ou política de cache de produção. O acoplamento do reader de demo às fixtures deve ser substituído por um adaptador real após auditoria do backend. Queries não passam a exigir Context/provider de domínio.

Conteúdo persistente usa clients-content, vehicles-content, units-content e data-table-content. Toast continua em *-notify. O builder de detalhe fica apenas em appRoutes.clientDetails.path; o wrapper que somente encaminhava a chamada foi removido. Paths não são reconstruídos nos componentes.

## Carregamento

Os três wrappers React.lazy internos sempre montavam a tabela assim que a página era renderizada. As rotas já possuem lazy loading. Os wrappers foram removidos para carregar cada entrada de domínio com suas dependências na fronteira da rota, evitando uma segunda cadeia de importação. O fallback compartilhado sem consumidores foi removido. Skeleton/estado ocupado de Query, recuperação com retry e paginação permanecem.

O showcase /rmc permanece no mesmo path e é agora mock-components-page, fora de pages e features de negócio. src/components/ui permanece intocado.

## Validação

Lint, tipos/build, Knip e diff check aprovados, exit 0. Testes focados: 17 arquivos/70 testes aprovados, cobrindo domínios migrados, erros/retry de Query, navegação e títulos. Chromium: 13/13 aprovado, incluindo filtros, paginação, detalhe/veículos, responsividade, tema e showcase. A suíte completa anterior à migração de features aprovou 44 arquivos/161 testes; ela não foi repetida inteira nesta branch. Cobertura, Firefox e WebKit não foram executados.
