# Roadmap

Capacidades abaixo não fazem parte da implementação atual. Só devem ser adicionadas quando um caso real justificar a complexidade.

## Identificador semântico

**O que é:** chave estável para representar o evento sem depender do texto exibido.

**Serve para:** dedupe, telemetria e diagnóstico.

**Adotar quando:** houver necessidade real de identificar eventos entre execuções ou camadas.

## Dedupe

**O que é:** reutilizar/atualizar uma notificação existente em vez de empilhar mensagens equivalentes.

**Serve para:** retries, cliques repetidos ou eventos simultâneos que gerem duplicação visível.

**Adotar quando:** duplicatas forem observadas no produto. Base UI permite reutilizar IDs para atualização/upsert.

## Lifecycle / Promise

**O que é:** manter uma mesma notificação durante `loading → success/error`.

**Serve para:** operações longas que precisam continuar perceptíveis depois do ponto inicial de interação.

**Adotar quando:** spinner/estado contextual não for suficiente. Base UI/shadcn já oferecem suporte a promise/lifecycle.

## Actions

**O que é:** ação interativa dentro da notificação, como Desfazer ou Tentar novamente.

**Serve para:** executar uma ação diretamente relacionada ao evento comunicado.

**Adotar quando:** existir fluxo real que exija essa ação. Callbacks não devem ser armazenados nos catálogos de conteúdo.

## Timeout customizado

**O que é:** substituir o tempo padrão de permanência da notificação.

**Serve para:** mensagens que comprovadamente precisam de mais ou menos tempo de leitura/interação.

**Adotar quando:** testes de uso indicarem necessidade. O default do Base UI deve permanecer enquanto isso não ocorrer.

## Limite / stacking

**O que é:** controlar quantas notificações ficam simultaneamente visíveis.

**Serve para:** impedir poluição em cenários com muitos eventos próximos.

**Adotar quando:** houver excesso real de notificações concorrentes.

## Observabilidade

**O que é:** registrar eventos de notificação sem usar título/descrição como identificador.

**Serve para:** métricas, diagnóstico e análise de excesso/falha de feedback.

**Adotar quando:** houver uma estratégia de observabilidade e identificadores semânticos definidos. Não registrar conteúdo sensível.

## TanStack Query mutation metadata

**O que é:** declarar feedback estático em `mutation.meta` e processá-lo por integração comum.

**Serve para:** reduzir boilerplate quando várias mutations repetem exatamente o mesmo padrão estático.

**Adotar quando:** a repetição estiver comprovada e o feedback não depender de `data`, `variables` ou classificação específica do erro. Não criar Toast automático para toda mutation/query.

## Referências oficiais

- Base UI Toast: https://base-ui.com/react/components/toast
- shadcn Toast: https://ui.shadcn.com/docs/components/base/toast
- TanStack Query MutationOptions: https://tanstack.com/query/latest/docs/framework/react/reference/interfaces/MutationOptions
- TanStack Query MutationCache: https://tanstack.com/query/latest/docs/framework/react/reference/interfaces/MutationCacheConfig
