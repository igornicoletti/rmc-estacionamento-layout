# Contratos ERP usados nas tabelas

Fonte: `API Hub Solutions.json`, compartilhado pelo usuário em 28/09/2026.
SHA-256: `B0DDCA335F5AEC8CEE71A5DE4D64609DDF02222591C7CDE03417D88C9EE3AF97`.
O [OpenAPI online](https://hubapi.redemontecarlo.com.br/openapi.json) exige
autenticação; não foi possível verificar se ele coincide com o arquivo recebido.
O [recorte versionado](hub-erp.openapi.json) preserva as respostas e schemas dos
três endpoints selecionados. Esses endpoints não documentam suas consultas SQL:
a evidência disponível é o contrato de resposta, não o esquema físico do banco.

| Tela                | Endpoint GET                 | Schema                       |
| ------------------- | ---------------------------- | ---------------------------- |
| Clientes            | `/erp/cliente-cadastro/`     | `ClienteCadastroResponse`    |
| Veículos do cliente | `/erp/cliente-veiculos/`     | `ClienteVeiculoResponse`     |
| Unidades            | `/erp/captura-cad-empresas/` | `CapturaCadEmpresasResponse` |

Unidades usa o cadastro de empresas ativas `fluig/tab_fluig_empresa` documentado
nesse endpoint, que corresponde aos campos da tela atual. `Unidade` de
`/erp/item-fornecedor/unidades` representa unidade de medida; não é esse cadastro.
`/pricing/unidades` expõe objetos sem propriedades declaradas e não fundamenta
novas colunas nesta implementação.

## Proveniência dos campos

### Clientes

| Campo da resposta                         | Campo local / apresentação                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------------- |
| `cod_pessoa`                              | `id` / Código                                                                    |
| `nom_pessoa`, `nom_fantasia`              | `name`, `tradeName` / Nome, Nome fantasia                                        |
| `num_cnpj_cpf`                            | `taxId` / CPF/CNPJ                                                               |
| `des_email_1`, `num_telefone_1`           | `email`, `phone` / E-mail, Telefone                                              |
| `nom_cidade`, `sgl_estado`                | `city`, `stateCode` / Cidade, UF                                                 |
| `dta_cadastro`                            | `registeredAt` / Cadastro                                                        |
| `ind_pessoa_ativa`, `bloqueio_financeiro` | `personActiveStatus`, `financialBlockStatus` / Pessoa ativa, Bloqueio financeiro |
| `qtd_veiculos`                            | `vehicleCount` / Veículos                                                        |
| `dta_ultima_compra`                       | `lastPurchaseAt` / Última compra                                                 |

O nome do estado em Clientes é apresentação derivada da UF para agrupamento e
leitura, não uma coluna SQL presumida. A faceta de cidade também é controle local.

### Veículos

| Campo da resposta                           | Campo local / apresentação                                       |
| ------------------------------------------- | ---------------------------------------------------------------- |
| `cod_veiculo`                               | `id` / Código do veículo                                         |
| `cod_pessoa`                                | `clientId` / Código do cliente                                   |
| `nom_pessoa`, `nom_fantasia`                | `clientName`, `clientTradeName` / Nome e fantasia do cliente     |
| `num_cnpj_cpf`                              | `clientTaxId` / CPF/CNPJ do cliente                              |
| `num_placa`, `des_veiculo`, `nom_motorista` | `plate`, `description`, `driverName` / Placa, Veículo, Motorista |

Código do veículo e código do cliente são identificadores diferentes. A tabela
identifica suas linhas por `cod_veiculo`, dentro do cliente selecionado. Não existe
um segundo ID de veículo criado pela interface. O código do cliente permanece
oculto inicialmente e disponível no gerenciamento de colunas; não é removido
do contrato. Os nomes das colunas e dos campos de cópia/CSV deixam essa diferença explícita.

### Unidades

| Campo da resposta                  | Campo local / apresentação                             |
| ---------------------------------- | ------------------------------------------------------ |
| `cod_empresa`                      | `id` / Código                                          |
| `nom_razao_social`, `nom_fantasia` | `legalName`, `tradeName` / Razão social, Nome fantasia |
| `num_cnpj`                         | `cnpj` / CNPJ                                          |
| `cod_bandeira`, `des_bandeira`     | `brandCode`, `brand` / Código da bandeira, Bandeira    |
| `cod_cidade`, `nom_cidade`         | `cityCode`, `city` / Código da cidade, Cidade          |
| `nom_estado`, `sgl_estado`         | `state`, `stateCode` / Estado, UF                      |
| `des_coordenada_empresa`           | `coordinates` / Coordenadas                            |

`nom_estado` é preservado no modelo de Unidades; capitalização e acentos são
aplicados na apresentação. `ip_rede` e `nom_banco_dados` existem no schema recebido,
mas não fazem parte da interface comercial, dos mocks ou do CSV atual.

## Regras e limites

- Removidos `is_active_120d`, `client_is_active_120d`, `synced_at`, `created_at` e
  `updated_at`: não constam nos três schemas. Saíram dos mocks, modelos, tabelas,
  gerenciamento de colunas, cópia e CSV. Não foram substituídos por cálculos presumidos.
- Os tipos `*-erp-types.ts` reproduzem propriedades opcionais/nulas do recorte.
  Fixtures usam `satisfies` e enviam códigos numéricos conforme os schemas.
- Campos textuais ausentes/nulos viram texto vazio no modelo de apresentação;
  quantidades e códigos opcionais preservam `null`, sem inventar zero.
- Os schemas de Clientes e Veículos permitem código nulo. O modelo navegável
  requer código válido: o mapper rejeita identidade ausente e a query apresenta
  erro com retry. Não gera código fictício nem descarta a linha silenciosamente.
- Validadores de CPF/CNPJ, UF e datas continuam ativos quando o valor existe.
  Coordenadas continuam com normalização técnica já existente.
- Nomes, telefones, documentos e registros dos mocks continuam sintéticos.
  O arquivo documenta contratos e não fornece uma amostra real desses cadastros.
  Não houve conexão de produção, criação de SQL, migração de banco ou integração Auth.
- Tabelas usam fonte proporcional e números normais: sem `font-mono` ou `tabular-nums`.

Os testes verificam campos dos mocks contra o recorte, ausência de metadados
inventados, nulabilidade, distinção dos identificadores, filtros, cópia e CSV.
Chromium verifica a diferença dos códigos e a tipografia calculada na célula.

Validação local: 171 testes Vitest em 47 arquivos e 18 jornadas Chromium aprovados;
lint, typecheck/build, Knip e `git diff --check` aprovados. Os primitives de `ui`
não foram alterados.
