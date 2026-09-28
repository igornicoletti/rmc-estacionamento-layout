# Testes

`tests/integration/data-table.test.tsx` cobre os contratos compartilhados por comportamento: renderização, filtros, faceting, ordenação, paginação, visibilidade, exportação e lifecycle visual.

A cobertura de lifecycle deve validar:

- Skeleton proporcional ao `pageSize` enquanto ainda não existe resultado;
- controles dependentes dos dados desabilitados durante o estado inicial `isPending`, inclusive quando o primeiro fetch está pausado/offline;
- ausência de empty state e paginação enquanto não existe resultado;
- ausência de paginação quando o resultado é vazio;
- dados e controles preservados durante atualização em background;
- erro inicial persistente com retry;
- erro de refetch preservando os dados previamente carregados e emitindo um único feedback;
- remontagem sobre um erro de refetch já cacheado sem repetir o mesmo feedback histórico.

Testes das features cobrem a fronteira da query, dados, retry, navegação e CSV próprios. Evite asserts de classes, cores e textos sem consequência comportamental.

Playwright valida poucos fluxos completos em Clientes e Unidades, incluindo responsividade. O gate final é `npm run check:full` sem bypass. Registre separadamente falhas locais e indisponibilidade externa de CI.
