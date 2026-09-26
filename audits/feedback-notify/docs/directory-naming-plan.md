# Diretórios, nomes e fronteiras — v1

## Infraestrutura

```text
src/app/feedback/
├─ feedback-contract.ts
└─ notify.ts
```

## Catálogos

O catálogo pertence ao menor escopo proprietário.

Domínios:

```text
src/app/session/content/session-feedback.ts
src/pages/clients/content/clients-feedback.ts
```

Escopo reutilizável:

```text
src/components/data-table/
├─ actions/copy-data-table-record.ts
└─ data-table-feedback.ts
```

## Primitive visual

```text
src/components/ui/toast.tsx
```

Permanece primitive shadcn/Base UI. Não conhece catálogos, regras de domínio, QueryClient ou operações técnicas.

Customização permitida na v1 fica limitada à cor semântica dos ícones por tokens de tema. Estrutura e estilo de container seguem o preset `base-luma` por meio do hook `cn-toast`.

## Operações técnicas

```text
src/lib/copy-to-clipboard.ts
```

permanece neutro e não conhece `notify()` nem catálogo.

## Dependências

- catálogo importa apenas o contrato e helpers puros quando necessários;
- ação reutilizável pode importar operação técnica, catálogo proprietário e `notify()`;
- `notify()` é o único adapter autorizado ao manager;
- `components/ui/toast` não importa infraestrutura de feedback de aplicação.

## Testes

```text
tests/unit/app/feedback/
tests/unit/components/data-table/actions/
tests/unit/lib/
```

Fluxos de domínio recebem testes em seu escopo quando o feedback fizer parte do comportamento relevante. Classes de cor e detalhes internos do primitive não são congelados por teste.

## V2

Capacidades futuras devem reutilizar essa mesma direção de dependências. Não criar `FeedbackProvider`, store, registry runtime ou service class sem responsabilidade nova comprovada.
