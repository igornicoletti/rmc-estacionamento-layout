# Testes

`tests/integration/data-table.test.tsx` cobre os contratos compartilhados por interações acessíveis: renderização, filtros, faceting, ordenação, paginação, visibilidade, estados e exportação. Testes das páginas cobrem apresentação, dados, retry, navegação e CSV próprios.

Playwright valida poucos fluxos completos em Clientes e Unidades, incluindo responsividade. O gate final é `npm run check:full` sem bypass. Registre separadamente falhas locais e indisponibilidade externa de CI.
