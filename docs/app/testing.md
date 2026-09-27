# Testes

Os testes em `tests/unit/components/app` cobrem o comportamento acrescentado pelos contratos: semântica e avatar de `AppEmpty`, ações nativas dos overlays, seleção e limpeza de `AppCombobox` e precedência de fuso de `AppCalendar`. O filtro da DataTable testa sua própria integração com o combobox.

`tests/e2e/rmc.spec.ts` cobre a prévia em `/rmc` nos navegadores configurados, incluindo abertura dos overlays, renderização dos componentes inline e geometria de rolagem de Dialog e Sheet com rodapé visível.

Não é necessário duplicar testes do Base UI para animação, classes ou simples repasse de props. As regras de domínio pertencem aos testes do consumidor.

## Validação focada

```bash
npx vitest run tests/unit/components/app tests/unit/components/data-table/data-table-combobox-filter.test.tsx
npx playwright test tests/e2e/rmc.spec.ts
npm run typecheck
npm run lint
```

O E2E mede a geometria da prévia, não a de conteúdo futuro de produção. Testes do consumidor continuam necessários quando seu fluxo acrescentar regras próprias.
