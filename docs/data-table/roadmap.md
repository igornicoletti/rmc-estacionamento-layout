# Roadmap

A reconstrução client-side migrou Unidades, Clientes e Veículos para os row models oficiais do TanStack Table v9. A suíte comportamental e os testes de página protegem o contrato atual.

Evoluções dependem de necessidade do produto:

- Processamento no servidor exige query key com filtros, sorting e página, além de flags `manual*` restritas à tabela correspondente.
- Persistência de filtros ou visibilidade exige estado controlado e contrato de armazenamento.
- Seleção de linhas, ações em lote, virtualização, redimensionamento e pinning exigem desenho e testes próprios.

Antes de introduzir qualquer feature, confirme seu uso em uma tabela concreta e a consequência na navegação por teclado e no CSV.
