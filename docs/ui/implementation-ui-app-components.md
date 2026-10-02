# Componentes App — implementação e auditoria

**Escopo:** `src/components/app` e dependências diretamente afetadas.
**Revisão:** 02/10/2026. **Natureza:** dossiê único da entrega.
**Base de origem:** `b0463e1339e2d8554fc59e49dc49ec29169a4ee9`.
**Último commit de código desta revisão:** `bc3baa7cd2aab9f5f7a2f8aec6d97aac75850ffd`.
**Branch:** `fix/app-components-audit-evidence`. **PR:** [46](https://github.com/igornicoletti/rmc-estacionamento-layout/pull/46).

| Dimensão | Situação |
| --- | --- |
| Planejamento | Escopo de correção autorizado pelo responsável em 02/10/2026. |
| Implementação | Correções candidatas e testes publicados em branch independente. |
| Revisão | Revisão estática do código e do diff realizada pelo mesmo executor; não independente. |
| Validação executável | Bloqueada. A CI encerrou os jobs sem etapas e sem runner alocado. |
| Aceite | Pendente. Sem merge, liberação ou declaração de PASS. |

Este arquivo aplica o padrão acordado: uma entrega, um documento, com pesquisa, decisões, implementação, testes, achados e encerramento em seções. Não substitui o contrato documental geral e não cria uma árvore paralela de planos, auditorias ou testes. A migração global de `docs/` não integra este PR; os documentos anteriores não foram utilizados como autoridade desta análise nem removidos.

## Sumário

- [1. Escopo e pré-requisitos](#scope)
- [2. Levantamento e pesquisa](#research)
- [3. Decisões e desenho técnico](#decisions)
- [4. Plano e situação da execução](#plan)
- [5. Implementação realizada e contratos de uso](#implementation)
- [6. Testes e evidências](#validation)
- [7. Auditoria e revisão crítica](#audit)
- [8. Encerramento e histórico](#closure)

<a id="scope"></a>

## 1. Escopo e pré-requisitos

O objetivo é preservar os wrappers como composições reutilizáveis e corrigir problemas de legibilidade, localização, dimensionamento e tipagem, acrescentando verificações comportamentais. O código de autenticação, Worker, banco, dependências e configurações de CI permanece fora da alteração.

Foram examinados integralmente os oito wrappers, suas suites unitárias e as primitives locais necessárias. Consumidores examinados incluem a prévia de componentes, o filtro de tabela, a exportação, os estados vazios e o provider de tooltip. Não se declara inventário completo de consumidores nem auditoria integral da aplicação.

A entrega requer checkout identificado, toolchain definida pelo projeto, dependências do lockfile e navegador de testes instalado. A revisão documental anterior não comprova o código desta branch. O aceite exige execução nova, revisão dos resultados e decisão explícita do responsável.

<a id="research"></a>

## 2. Levantamento e pesquisa

### 2.1. Inventário de responsabilidades

| Componente | Responsabilidade |
| --- | --- |
| [AppAlertDialog](../../src/components/app/app-alert-dialog.tsx) | Confirmação controlada; ação principal e cancelamento. |
| [AppBadge](../../src/components/app/app-badge.tsx) | Indicador textual com tom e ícone opcional. |
| [AppCalendar](../../src/components/app/app-calendar.tsx) | Calendário com padrões de locale e fuso sobrescrevíveis. |
| [AppCombobox](../../src/components/app/app-combobox.tsx) | Seleção única controlada, pesquisa, grupos e limpeza. |
| [AppDialog](../../src/components/app/app-dialog.tsx) | Diálogo com cabeçalho, conteúdo rolável e rodapé opcional. |
| [AppEmpty](../../src/components/app/app-empty.tsx) | Estado vazio com título, mídia e ações fornecidas pelo consumidor. |
| [AppSheet](../../src/components/app/app-sheet.tsx) | Painel lateral com conteúdo rolável. |
| [AppTooltipButton](../../src/components/app/app-tooltip-button.tsx) | Botão de ícone com nome acessível e informação complementar. |

O [package.json](../../package.json) declara React `^19.3.0`, Base UI `^1.8.0`, DayPicker `^10.0.2` e Tailwind CSS `^4.3.3`. São faixas declaradas, não comprovação de instalação neste ambiente. Nenhuma dependência ou versão foi modificada.

### 2.2. Fontes oficiais e conclusões

Consulta em 02/10/2026; verificar aplicabilidade à versão resolvida antes do aceite.

| Fonte | Conclusão aplicada |
| --- | --- |
| [Base UI — Dialog](https://base-ui.com/react/components/dialog) | Abertura e fechamento controlados; restauração ao trigger ou elemento anteriormente focado. Um wrapper sem trigger interno não é, por isso, defeituoso. |
| [Base UI — Alert Dialog](https://base-ui.com/react/components/alert-dialog) | A confirmação exige composição adequada; o consumidor continua responsável pelos efeitos e estado da operação. |
| [shadcn — Tooltip](https://ui.shadcn.com/docs/components/base/tooltip) | Tooltip em botão desabilitado exige cuidado de composição; hover não pode ser a única via de uma informação necessária. |
| [DayPicker — locale](https://daypicker.dev/localization/changing-locale) e [fuso](https://daypicker.dev/localization/setting-time-zone) | Idioma e fuso são independentes; manter sobrescritas do consumidor e verificar datas no fuso escolhido. |
| [DayPicker — atualização v10](https://daypicker.dev/upgrading) | `react-day-picker` permanece como nome de compatibilidade. Não migrar pacotes apenas para adicionar locale. |
| [W3C — contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) | Texto pequeno requer razão mínima de 4,5:1, sem arredondar um resultado insuficiente para aprovação. |
| [Testing Library — desaparecimento](https://testing-library.com/docs/guide-disappearance/) | Verificar fechamento efetivo e efeitos observáveis, não apenas a chamada de um callback. |

Os cálculos exploratórios de cor orientam a alteração; não substituem a medição do CSS renderizado. O E2E desta entrega contém a verificação no navegador e produz resultados somente quando executado.

<a id="decisions"></a>

## 3. Decisões e desenho técnico

**Separação de responsabilidades.** O consumidor mantém dados, autorização, requisições, estado assíncrono, falhas e decisão de fechamento. Nenhuma regra de negócio foi introduzida nos wrappers.

**Contraste sem alteração global da marca.** Os cinco tons de badge passam a usar tokens próprios de texto. O calendário recebe `calendar-selection-foreground`. A cor `primary`, seu foreground global e os demais pares existentes do tema foram preservados. A correção não certifica contraste de outros componentes que utilizem esses pares.

**Dimensionamento.** AppDialog limita o painel completo ao viewport dinâmico, com linha central `minmax(0,1fr)`. AppSheet reserva cabeçalho e rodapé e permite redução/rolagem do corpo. Não há limite fixo de 50vh no conteúdo. A alteração é uma mitigação candidata; sua eficácia depende do E2E e da inspeção visual.

**APIs proporcionais ao uso.** Não foram adicionadas propriedades de formulário ao combobox sem consumidor concreto. A desabilitação nativa do botão de tooltip foi preservada. Não foram introduzidos memoização, virtualização, bibliotecas ou remoções de arquivos sem evidência de necessidade.

**Primitives locais.** As alterações em `components/ui` são pontuais: nomes acessíveis, cor selecionada do calendário e tipagem do elemento de descrição. Nenhuma primitive foi regenerada.

<a id="plan"></a>

## 4. Plano e situação da execução

| Etapa | Situação |
| --- | --- |
| Fixar a origem e criar branch independente | Realizada a partir da main identificada no cabeçalho. |
| Confrontar achados com código e fontes oficiais | Realizada por inspeção estática. |
| Implementar correções de baixo escopo e testes correspondentes | Publicadas nos commits da entrega. |
| Revisar diff e evitar efeitos colaterais fora dos componentes | Realizada; o segundo commit restringiu os tokens e preservou estilos não relacionados. |
| Executar suites, tipos, lint, build e navegador | Não comprovada; CI sem etapas executadas. |
| Revalidar achados e obter aceite | Pendente; PR mantido em rascunho. |

A indisponibilidade de execução não foi tratada como dispensa. Não foram ampliados timeouts, reduzidos requisitos, removidos gates ou alteradas permissões para produzir resultado positivo.

<a id="implementation"></a>

## 5. Implementação realizada e contratos de uso

### 5.1. Alterações desta entrega

As alterações abrangem os quatro wrappers Badge, Calendar, Dialog e Sheet; o tipo compartilhado do filtro de tabela; quatro primitives locais; tokens de tema; três suites unitárias e o E2E da prévia. O diff de código contém 14 arquivos. Este dossiê é adicionado em commit documental posterior.

Os tokens de status distinguem superfície e texto nos dois temas. Ícones do badge herdam a cor textual. O calendário usa foreground específico na seleção simples e nas extremidades de intervalos; foi removida a sobrescrita de texto no hover escuro que poderia desfazer esse contraste.

Os botões de fechamento nativos passam a expor “Fechar”. Os testes diferenciam a ação superior e a do rodapé, evitando seletores ambíguos.

`DataTableComboboxFilterItem` passa a reutilizar `AppComboboxItem`, preservando o nome exportado. `EmptyDescription` recebe propriedades de `div`, correspondentes ao elemento que já renderizava.

### 5.2. Contratos que os consumidores devem respeitar

| Componente | Uso e limites |
| --- | --- |
| AppAlertDialog | `open` e `onOpenChange` são controlados. A ação principal é um Button e não fecha automaticamente. O consumidor controla pendência, falha e fechamento; `cancelLabel=null` omite o cancelamento. |
| AppDialog / AppSheet | Recebem título, conteúdo e estado controlado. `closeLabel=null` remove somente o fechamento do rodapé; não remove o superior nem constitui bloqueio de segurança. Cabeçalhos excepcionalmente extensos, zoom e teclado móvel ainda exigem inspeção. |
| AppCombobox | `value` é string ou ausente; limpeza emite `undefined`. Itens devem ter valores únicos. Agrupa somente quando todos possuem `group`; coleções mistas são apresentadas sem grupos. Valor ausente da coleção resulta em seleção visual nula, sem corrigir silenciosamente o estado externo. |
| AppCalendar | `pt-BR` é o padrão; `locale` explícito prevalece. `timeZone` explícito prevalece; sem ele, utiliza o fuso local obtido pelo wrapper. A política de persistência e a distinção entre data civil e instante pertencem ao consumidor. |
| AppBadge | Oferece primary, info, success, warning e error; ícone opcional antes/depois. O texto deve identificar o estado, sem depender exclusivamente de cor. |
| AppEmpty | Aceita ícone ou avatar; título com nível de heading configurável, descrição e conteúdo complementar. Ações e anúncios do fluxo pertencem ao consumidor. |
| AppTooltipButton | `label` fornece nome acessível; `tooltip` é complementar. Mantém disabled nativo e não torna controles bloqueados focáveis. Informação necessária sobre bloqueio precisa estar disponível fora do hover. |

<a id="validation"></a>

## 6. Testes e evidências

### 6.1. Verificações implementadas

| Arquivo | Cenários acrescentados ou fortalecidos |
| --- | --- |
| `tests/unit/components/app/app-calendar.test.tsx` | Calendário real, locale padrão/sobrescrito, seleção em dois fusos explícitos e data desabilitada. O mock do calendário foi removido. |
| `tests/unit/components/app/app-dialog.test.tsx` | Consumidor controlado, fechamento efetivo por Escape/cancelamento/botão superior e retorno ao acionador externo. |
| `tests/unit/components/app/app-sheet.test.tsx` | Mesmas verificações de fechamento e foco no painel lateral. |
| `tests/e2e/rmc.spec.ts` | Rodapé identificado sem ambiguidade; ações alcançáveis em 390×360; contraste dos cinco badges e do dia selecionado, normal e hover, em ambos os temas. |

As demais suites de wrappers foram preservadas. Não há alegação de cobertura completa de consumidores, leitores de tela, confirmações assíncronas, intervalos de calendário ou todos os tamanhos de viewport.

O teste de contraste compõe as cores computadas dos ancestrais sólidos em Canvas sRGB. Rejeita cenários com imagem de fundo ou opacidade de grupo não suportados pelo procedimento. Compara a razão sem arredondamento e anexa JSON ao relatório. Não é teste cosmético de valores hexadecimais nem certificação WCAG integral.

### 6.2. Execuções registradas

Executor das consultas e revisão: assistente, por ferramentas GitHub. Os horários abaixo são os informados pela API para os jobs, não o início de testes.

| Registro | Objeto / período UTC | Resultado observado |
| --- | --- | --- |
| E01 — tentativa local | Ambiente do assistente, 02/10/2026; Node 22.16.0 e npm 10.9.2 | Clone indisponível por resolução de DNS; navegador Chromium ausente. Toolchain diferente da exigida pelo projeto. Suites e build não executados; nenhuma substituição de versões. |
| E02 — CI [37062242014](https://github.com/igornicoletti/rmc-estacionamento-layout/actions/runs/37062242014) | SHA `09db056aceba4da935806722371991d33a88d4a3`; 20:41:57–20:42:00 | Jobs 111021403677 e 111021403897: `conclusion=failure`, `steps=[]`, `runner_id=0`. Testes não iniciados. |
| E03 — CI [37062582779](https://github.com/igornicoletti/rmc-estacionamento-layout/actions/runs/37062582779) | SHA `bc3baa7cd2aab9f5f7a2f8aec6d97aac75850ffd`; 20:45:11–20:45:15 | Jobs 111022515626 e 111022516268: `conclusion=failure`, `steps=[]`, `runner_id=0`. Testes não iniciados. |

A causa administrativa específica não foi exposta pelas respostas consultadas. Não atribuir a falha a um teste, dependência ou billing sem diagnóstico correspondente. Nenhum relatório de testes ou medição de navegador foi produzido por esses jobs. E02 permanece histórico e não é promovido como prova de E03.

### 6.3. Procedimento pendente

Executar em checkout limpo e isolado, sem trocar a branch de trabalho de outra implementação. Verificar o Node de `.node-version` e npm definido em `package.json` antes da instalação.

```bash
npm ci --no-audit
npx --no-install playwright install chromium
npm run test -- tests/unit/components/app
npm run check:app
```

O gate geral deve continuar sendo executado; a seleção unitária isolada não o substitui. Para diagnóstico E2E focado, após build novo:

```bash
npm run build
npx --no-install playwright test tests/e2e/rmc.spec.ts --project=chromium --workers=1
```

Registrar SHA completo do checkout, estado limpo/modificado, versões efetivas, comandos, horários, códigos de saída, casos e artefatos. Preservar os anexos de contraste antes da expiração dos relatórios. O commit que adiciona este manifesto é posterior ao código de E03: ele também requer validação documental própria, sem inferir PASS do commit anterior.

<a id="audit"></a>

## 7. Auditoria e revisão crítica

| Achado | Classificação e tratamento | Situação |
| --- | --- | --- |
| APP-01 — contraste | Pares declarados inadequados motivaram tokens específicos de texto; teste de navegador acrescentado. A tabela analítica anterior não é evidência da nova renderização. | Correção candidata; medição executável pendente. |
| APP-02 — localização | Locale padrão e nomes acessíveis de fechamento corrigidos; sobrescritas de locale/fuso preservadas. | Código alterado; testes pendentes. |
| APP-03 — tooltip desabilitado | Limitação documentada. Mantida a desabilitação nativa; não foi demonstrado consumidor que justifique torná-la focável. | Sem ampliação de API. Rever quando a explicação de bloqueio for requisito do fluxo. |
| APP-04 — dimensionamento | Risco identificado estaticamente. Painel total limitado ao viewport e corpo flexível; E2E de baixa altura acrescentado. | Mitigação candidata, ainda sem reprodução/validação em navegador. |
| APP-05 — combobox em formulários | Ampliação depende de consumidor com associação de label, ajuda e erro. | Adiada com justificativa; não é correção concluída nem falha confirmada no filtro atual. |
| APP-06 — tipagem e duplicação | Alias reutiliza o tipo público; propriedades da descrição correspondem ao div renderizado. | Corrigido no código; typecheck pendente. |
| APP-07 — provas de interação | Testes deixam de depender somente de mocks/callbacks para calendário e fechamento; novos cenários E2E. | Cobertura ampliada no código, sem resultados de execução. |

A revisão estática manteve conclusões negativas importantes: não há fundamento para afirmar fechamento automático da ação principal do alerta, perda de seleção apenas por recompor objetos ou falha de foco apenas por não encapsular um trigger. Não há medição que justifique otimização de renderização generalizada.

O diff foi revisto para restringir as mudanças: o foreground primário global e estilos de outros escopos foram preservados no segundo commit. Os testes existentes de fechamento foram ajustados após a tradução tornar dois botões homônimos.

Nenhuma vulnerabilidade explorável foi comprovada nos oito wrappers. Isso não comprova a segurança da aplicação ou das dependências. Bloqueios visuais não substituem autorização ou idempotência nos fluxos responsáveis.

<a id="closure"></a>

## 8. Encerramento e histórico

| Data | Registro |
| --- | --- |
| 02/10/2026 | Auditoria inicial estática submetida ao responsável. |
| 02/10/2026 | Autorizada implementação em branch nova; commit `09db056aceba4da935806722371991d33a88d4a3` com correções e testes. |
| 02/10/2026 | Revisão crítica de impacto; commit `bc3baa7cd2aab9f5f7a2f8aec6d97aac75850ffd` restringe tokens ao escopo. |
| 02/10/2026 | Registradas duas tentativas de CI sem execução. Dossiê consolidado em commit documental posterior. |

**Entrega publicada, mas não validada nem encerrada tecnicamente.** O PR permanece em rascunho. O responsável deve revisar resultados novos de testes, tipos, lint, build, documentação e navegador antes de decidir o aceite.

Esta entrega não autoriza merge, alteração de outras branches, migração global da documentação ou remoção de arquivos legados. Sem evidências novas, nenhum achado dependente de execução deve ser promovido a resolvido.
