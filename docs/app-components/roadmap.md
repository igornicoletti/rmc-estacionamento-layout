# Roadmap

Capacidades abaixo não fazem parte do contrato atual. Só devem entrar quando um caso real justificar a complexidade.

## Combobox múltiplo

O primitive suporta seleção múltipla e chips. Adotar somente quando houver fluxo real que precise desse padrão; não ampliar `AppCombobox` preventivamente.

## Locale padrão do Calendar

Timezone e locale são decisões diferentes. Definir `pt-BR` como default somente quando os consumidores de Calendar estiverem consolidados e a regra de produto estiver explícita.

## Novos tamanhos de overlays

Adicionar variantes de tamanho somente quando mais de um fluxo compartilhar a mesma necessidade. Não espelhar todas as opções possíveis do primitive.

## Enforcement de imports

Não criar regra ESLint proibindo `ui/*` enquanto existirem usos semanticamente válidos. Considerar enforcement apenas se surgir drift recorrente e a fronteira puder ser expressa sem falsos positivos.

## Novos wrappers

Antes de criar `AppX`, confirmar repetição real, uma decisão estável da aplicação e uma API menor que a nativa. Se o wrapper apenas repassar props, usar o primitive.

## Referências oficiais

- https://ui.shadcn.com/docs/components/base/combobox
- https://ui.shadcn.com/docs/components/base/calendar
- https://base-ui.com/react/overview/quick-start
