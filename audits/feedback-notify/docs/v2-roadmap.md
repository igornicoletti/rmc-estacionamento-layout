# Roadmap v2 — feedback transitório

**Status:** planejamento. Nenhuma capacidade abaixo está autorizada automaticamente.

A v2 não existe para “usar tudo que a biblioteca oferece”. Cada item só entra quando um caso real justificar a complexidade adicional.

## 1. Identificador semântico

### O que é

Um identificador estável do evento de feedback, separado do texto visível.

Exemplo conceitual:

```ts
{
  key: "clients.email-copy-failed",
  title: "Falha ao copiar",
  type: "error",
}
```

### Para que serve

- base para dedupe;
- telemetria/observabilidade;
- debugging sem usar o texto como identidade;
- correlação entre versões de copy.

### Quando adotar

Somente quando dedupe ou observabilidade exigirem identidade estável. Não adicionar apenas para “organizar melhor” a v1.

---

## 2. Dedupe

### O que é

Evitar vários Toasts equivalentes para a mesma operação/evento. Base UI permite fornecer um `id`; adicionar novamente o mesmo ID atualiza/upserta o Toast existente.

### Para que serve

Exemplo: um clique repetido, retry ou múltiplos callbacks não deveria empilhar cinco mensagens “Sincronização em andamento”.

### Risco

Deduplicar pelo texto é frágil. Dois eventos diferentes podem ter a mesma copy; a mesma operação pode mudar de texto.

### Quando adotar

Quando houver duplicação real observada em um fluxo. A identidade deve ser baseada no evento/operação, possivelmente apoiada por um identificador semântico.

---

## 3. `update` / `close` e lifecycle manual

### O que é

Base UI permite atualizar ou fechar um Toast existente pelo ID.

### Para que serve

Controlar um Toast durante uma operação longa:

```text
processando
   ↓
concluído
```

sem criar mensagens separadas.

### Quando adotar

Quando existir um fluxo cujo estado de feedback precise sobreviver ao ponto de interação e mudar durante a execução.

### Direção arquitetural

Não expor o manager cru. Se necessário, criar uma API específica de lifecycle que encapsule ID/update/close.

---

## 4. Promise / loading lifecycle

### O que é

`toast.promise` acompanha uma Promise e permite representar estados como loading, success e error no mesmo lifecycle.

### Para que serve

Operações demoradas em que o progresso precisa continuar visível mesmo depois que o botão/campo de origem já não é o foco.

### Risco

Duplicar feedback com spinner do botão, skeleton ou estado de formulário.

### Quando adotar

Somente quando o Toast de loading agregar informação além do loading contextual da UI.

### Direção arquitetural

Provavelmente uma API separada de `notify()`, como `notifyTask()`/`notifyPromise()`, para não transformar `FeedbackType` comum em máquina de estados.

---

## 5. Actions

### O que é

Botão de ação dentro do Toast, suportado pelo Base UI via `actionProps`.

Exemplos:
- “Desfazer” após remover item;
- “Tentar novamente” após uma falha recuperável;
- “Abrir” após concluir uma exportação.

### Para que serve

Permitir uma ação diretamente relacionada ao evento transitório sem exigir navegação até outro componente.

### Risco

Misturar callbacks/comportamento no catálogo de conteúdo.

### Quando adotar

Quando existir ação curta, segura e diretamente relacionada ao feedback.

### Direção arquitetural

Texto do feedback continua no catálogo; callback pertence ao chamador/application layer. Não colocar funções dentro de `*_FEEDBACK`.

---

## 6. Timeout customizado

### O que é

Alterar o tempo de permanência do Toast. Base UI usa 5000 ms por padrão; `0` impede auto-dismiss.

### Para que serve

Adequar mensagens com leitura maior ou ações que precisam permanecer acessíveis por mais tempo.

### Risco

Criar políticas arbitrárias por severidade e tornar feedback persistente sem necessidade.

### Quando adotar

Quando testes/uso real mostrarem que o timeout padrão é insuficiente para um caso concreto.

### Regra

Não mapear automaticamente `error` para timeout maior.

---

## 7. Observabilidade

### O que é

Registrar eventos de feedback para diagnóstico/analytics sem depender do texto visível.

### Para que serve

Responder perguntas como:
- quais operações falham com maior frequência;
- qual feedback aparece após determinado fluxo;
- existe repetição excessiva de um evento.

### Risco

Vazar conteúdo textual, PII ou dados sensíveis para logs/telemetria.

### Quando adotar

Somente quando houver requisito de monitoramento e política de dados definida.

### Direção arquitetural

Usar identificador semântico e metadados controlados. Não enviar `title`, `description`, `Error` cru ou valores sensíveis como identidade do evento.

---

## 8. TanStack Query `mutation.meta.feedback`

### O que é

Usar o campo `meta` das mutations para declarar feedback estático e permitir que callbacks globais do `MutationCache` chamem `notify()`.

### Para que serve

Reduzir boilerplate repetido como:

```ts
onSuccess: () => notify(SOME_STATIC_SUCCESS)
onError: () => notify(SOME_STATIC_ERROR)
```

em muitas mutations semelhantes.

### Risco

Callbacks globais trabalham com `data`/`variables` amplos e podem ocultar contexto do domínio. Automação indiscriminada gera Toast em operações que não precisam dele.

### Quando adotar

Somente quando houver repetição estática comprovada em várias mutations reais.

### Regras

- opt-in;
- `mutationMeta` tipado globalmente;
- ausência de metadata = ausência de Toast automático;
- conteúdo dinâmico/classificação de erro permanece local;
- queries continuam sem política global de Toast.

---

## 9. Priority na v2?

Não. `priority: "low" | "high"` já faz parte da v1.

Ela representa urgência de anúncio acessível, não severidade visual. A v2 pode no máximo refinar critérios de uso, mas não precisa reabrir o contrato atual sem evidência.

---

## 10. Limite/stacking

### O que é

O Provider do Base UI possui limite de Toasts exibidos simultaneamente (default documentado: 3).

### Para que serve

Evitar poluição visual quando vários eventos ocorrem em sequência.

### Quando adotar

Somente se telemetria/testes manuais demonstrarem excesso de mensagens concorrentes. Antes disso, o default da biblioteca é suficiente.

---

## Ordem recomendada de avaliação

A ordem depende dos casos reais, mas existe uma sequência de dependência razoável:

1. **identificador semântico**, quando dedupe/observabilidade precisarem;
2. **dedupe**, quando duplicação real aparecer;
3. **lifecycle/promise**, quando houver operação longa que justifique Toast persistente;
4. **actions**, quando surgir Undo/Retry/Open real;
5. **timeout customizado**, quando 5 s for insuficiente em uso real;
6. **observabilidade**, quando houver requisito de diagnóstico;
7. **mutation meta**, quando houver boilerplate estático repetido.

Nenhum item deve ser implementado apenas por estar listado aqui.
