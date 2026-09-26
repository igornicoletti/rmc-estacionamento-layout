# Revisão crítica documento por documento

**Data:** 26/09/2026  
**Resultado:** contrato v1 implementável sem decisões abertas; revisão pós-piloto incorporada.

## 1. Contrato arquitetural

A revisão inicial fechou:
- `description` opcional;
- shape de `FeedbackCatalog`;
- retorno `void` de `notify()`;
- ID do manager oculto;
- ausência de catch/fallback automático;
- mapeamento explícito em vez de spread;
- conteúdo dinâmico via factory pura;
- apresentação/sanitização permanecendo no domínio.

A revisão do primeiro fluxo real revelou uma necessidade adicional: a falha de logout já utilizava prioridade alta. O contrato foi ampliado minimamente com `FeedbackPriority = "low" | "high"` e `priority?` em `FeedbackDefinition` para preservar comportamento acessível existente sem tornar `high` default de erros.

## 2. Registro de decisões

O registro foi reconciliado com o código real:
- infraestrutura implementada;
- piloto Session implementado;
- enforcement ESLint implementado;
- priority opcional incorporada à v1;
- timeout, dedupe, lifecycle, actions e observabilidade continuam fora da v1.

## 3. Diretórios e dependências

Confirmado:
- `src/app/feedback` como infraestrutura transversal;
- catálogos em diretórios `content` do respectivo escopo/domínio;
- adapter como único acesso permitido ao manager;
- presentation helpers permanecem no domínio;
- testes de infraestrutura espelham `src/app/feedback`.

## 4. TanStack Query

Mantido sem automação global:
- callbacks locais tipados permanecem preferíveis para feedback que depende de data/variables/erro;
- `mutation.meta.feedback` continua reservado a repetição estática comprovada;
- queries não recebem Toast global automático.

## 5. Plano de implementação

O plano anterior estava defasado após o piloto. Foi corrigido para refletir:
- contrato/adapter/testes concluídos;
- piloto real de Session/logout;
- enforcement ESLint já aplicado;
- necessidade de nova validação completa após as mudanças mais recentes;
- próximo domínio condicionado a evento real, não ao plano histórico de Units.

## 6. Plano de testes

Refinado para cobrir:
- `priority` válida/inválida;
- forwarding de priority pelo adapter;
- ausência de priority preservando default da biblioteca;
- política urgente do fluxo de logout;
- manutenção das restrições de import via lint.

Continuam fora do escopo de testes próprios:
- animações;
- classes/cores;
- internals do Base UI;
- internals do React Query;
- copy estática sem lógica.

## 7. Referências oficiais

Revisão final confirmou:
- Base UI diferencia priority `low` e `high` e usa `low` como default;
- ESLint `no-restricted-imports` suporta `paths`, `patterns` e `allowImportNames` suficientes para o enforcement atual;
- React não exige Hook para um manager global;
- TanStack Query permite metadata, mas não justifica automação prematura;
- OWASP continua sustentando mensagens públicas controladas em vez de erros crus.

## 8. Conclusão

Não restam decisões arquiteturais necessárias para fechar o PR atual.

Antes do merge ainda é obrigatório executar validação completa no HEAD final, porque a confirmação anterior de `PASS` não cobre automaticamente commits posteriores.

Extensões futuras continuam condicionadas a casos reais e nova revisão: dedupe, promise lifecycle, actions, timeout customizado, observabilidade e metadata global de mutations.
