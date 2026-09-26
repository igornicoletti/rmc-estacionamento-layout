# Revisão crítica pós-merge — v1

**Data:** 26/09/2026  
**Base mergeada:** `main@dde4b6ba070a81d4c0bfeab823038b3fddbb8da2`

## 1. Resultado geral

A v1 está coerente em arquitetura, tipagem, ownership, segurança e separação de responsabilidades. A revisão pós-merge não encontrou necessidade de Provider, Context, store, registry runtime ou automação global de mutations.

Foram encontrados pontos de manutenção e documentação, não uma falha estrutural do desenho.

## 2. Toast visual

### Constatado

O projeto usa `style: "base-luma"`.

O registry oficial atual do shadcn/Base UI usa a classe-hook `cn-toast` no container, enquanto o preset Luma aplica `rounded-2xl` por essa classe. O projeto havia aplicado `rounded-2xl` diretamente no componente e omitido `cn-toast`.

Isso produzia aparência equivalente ao preset atual, mas criava divergência estrutural: uma futura mudança do preset não seria herdada automaticamente.

### Correção

- restaurar `cn-toast`;
- remover `rounded-2xl` hardcoded;
- preservar todas as demais classes nativas do container;
- aplicar cor somente aos ícones de status usando tokens já existentes do tema.

### Política final

- `success` → `text-success`;
- `info` → `text-info`;
- `warning` → `text-warning`;
- `error` → `text-error`;
- `loading` permanece neutro.

Não aplicar cor por tipo em fundo, borda, título, descrição ou botão de fechar.

## 3. Inconsistências documentais corrigidas

### Priority

Uma versão antiga de `research/current-state.md` afirmava incorretamente que a migração do logout removeria `priority: "high"`. A implementação final fez o oposto correto: preservou a prioridade alta existente como decisão explícita de catálogo.

### Estado do merge

README, plano de implementação e revisão ainda continham linguagem de gate pré-merge apesar de a v1 já estar na `main`. O dossiê foi atualizado para estado pós-merge.

## 4. Pontos fortes confirmados

- `notify()` permanece adapter mínimo e síncrono;
- `type` é restrito na camada de aplicação apesar de Base UI aceitar string aberta;
- `priority` é independente de `type`;
- factories dinâmicas preservam inferência e recebem dados mínimos;
- Clipboard não conhece feedback visual;
- DataTable possui feedback genérico no próprio escopo reutilizável;
- erros técnicos não chegam diretamente ao usuário;
- ESLint fecha o acesso direto ao manager;
- queries/mutations não recebem Toast global indiscriminado.

## 5. Pendências e riscos não bloqueantes da v1

### A. `Toaster` permitido por símbolo em qualquer código de produção

O enforcement atual permite `Toaster` e bloqueia os demais exports do módulo. A mensagem de lint diz que `Toaster` é reservado à composição, mas a regra não restringe fisicamente esse import apenas ao arquivo de providers.

**Risco:** baixo. Não há abuso atual conhecido.

**Melhoria possível:** adicionar override específico se aparecer import de `Toaster` fora da composição. Não endurecer preventivamente sem ocorrência real.

### B. Regra “factory recebe um único objeto nomeado” é arquitetural, não totalmente codificada no tipo

`FeedbackFactory = (...args: never[]) => FeedbackDefinition` funciona como constraint de retorno e preserva a assinatura concreta, mas não impede estruturalmente factories com outra quantidade de parâmetros.

**Risco:** baixo; code review e padrão do catálogo cobrem o caso atual.

**Melhoria possível:** helper/type adicional somente se ocorrer violação real. Evitar complexidade genérica sem benefício observado.

### C. `aria-label="Close toast"`

É o texto do primitive oficial atual, mas a aplicação é pt-BR.

**Risco:** inconsistência de localização acessível, não falha do contrato de feedback.

**Melhoria possível:** tratar junto de uma revisão transversal de acessibilidade/localização dos primitives, não dentro da arquitetura `notify()`.

### D. Camada de Toast e overlays

O registry atual usa viewport `z-50`; existe discussão/issue recente no repositório shadcn sobre Toast Base UI competir com overlays Dialog/Sheet no mesmo nível.

**Risco:** condicional. Não foi reproduzido neste projeto.

**Ação:** monitorar e reproduzir antes de divergir do padrão nativo. Não elevar z-index apenas por prevenção.

## 6. Testes

A estratégia continua correta: testar contrato e comportamento do projeto, não Tailwind/classes/cores do primitive.

A alteração de cor dos ícones deve ser coberta por lint/typecheck/build e inspeção visual, não por asserts de classes cromáticas.

## 7. V2

A v2 não é uma correção da v1. É um conjunto de capacidades opcionais para necessidades futuras reais.

Detalhes, finalidade, risco e critério de adoção estão em `v2-roadmap.md`.

## 8. Conclusão

Após o follow-up visual/documental, a v1 não possui pendência bloqueante conhecida. Novas mudanças devem partir de casos reais, não da superfície disponível no Base UI.
