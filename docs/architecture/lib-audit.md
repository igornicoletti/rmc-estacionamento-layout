# Auditoria de `src/lib`

Revisão executada em 30/09/2026 a partir de `main@d6d0521ebf23cf037d20ad12a0ad5f3155aa6514`, antes da F02.

## Resultado

- O Knip não identificou arquivo, export ou dependência não utilizada.
- Não foi encontrado código legado com substituto equivalente no projeto.
- As rotinas de CPF/CNPJ do ERP e o schema de CPF de Auth têm fronteiras diferentes: apresentação/validação de resposta ERP versus contrato de comando Auth. A consolidação criaria acoplamento indevido e não foi realizada.
- `copyToClipboard`, CSV e serialização de registros são centralizações reais consumidas por mais de uma feature; não são duplicações removíveis.
- O contrato antigo de tooltip para ação desabilitada (`disabledReason` e textos derivados) tornou-se inalcançável com o `disabled` nativo e foi removido, em vez de permanecer como legado silencioso.
- A raiz misturava browser API, CSV, HTTP, apresentação de registros e usuário. Cada responsabilidade foi movida para um subdiretório prefixado.
- Os arquivos ERP foram padronizados com o prefixo `erp-*`; `query/query-client.ts` já respeitava o padrão.
- Nenhum barrel foi criado. Os imports diretos deixam dependências explícitas e evitam reexportações acidentais; a raiz de `src/lib` permanece sem arquivos.

## Organização resultante

| Diretório | Responsabilidade |
| --- | --- |
| `browser/browser-clipboard.ts` | Integração mínima com Clipboard API |
| `csv/csv-export.ts` | Serialização e download CSV |
| `erp/erp-*.ts` | Leitura, validação e formatação da resposta ERP |
| `http/http-status.ts` | Leitura defensiva de status HTTP |
| `query/query-client.ts` | Política compartilhada do TanStack Query |
| `records/records-fields.ts` | Contrato de campos, cópia e projeção CSV |
| `user/user-initials.ts` | Apresentação de iniciais do usuário |

## `AppTooltipButton`

O antigo `AppIconButton` foi mantido como composição porque centraliza uma decisão compartilhada: botão apenas com ícone, nome acessível e tooltip, usado por tabelas e cópia de e-mails. O nome foi alterado para descrever o contrato, não a aparência.

A revisão usou o projeto detectado pelo shadcn CLI (`base-luma`, Base UI, Tailwind v4 e Lucide), o diff oficial do `Button` instalado e as documentações oficiais de [Button](https://ui.shadcn.com/docs/components/base/button), [Tooltip](https://ui.shadcn.com/docs/components/base/tooltip) e [Base UI Tooltip](https://base-ui.com/react/components/tooltip).

Decisões aplicadas:

- composição Base UI por `render`, sem botão ou `span` intermediário;
- `aria-label` obrigatório e ícone decorativo;
- `disabled` nativo do `Button`, sem classe adicional nem `focusableWhenDisabled` fora de um estado transitório de loading;
- abertura controlada somente para associar `aria-describedby` enquanto a tooltip existe; foco, hover e posicionamento continuam pertencendo ao primitive;
- primitive `ui/button.tsx` preservado: o dry-run/diff do CLI confirmou que ele está idêntico ao registry atual.

## Limites

Esta auditoria não inicia F02 e não altera contratos Auth, banco, Worker ou integrações externas. Extrações futuras só devem ocorrer quando houver duplicação semântica comprovada entre consumidores, não apenas semelhança de implementação.
