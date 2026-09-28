# Roadmap

A reconstrução client-side migrou Unidades, Clientes e Veículos para os row models oficiais do TanStack Table v9. O contrato atual também distingue primeira carga, atualização em background, erro inicial e erro de refetch, preservando dados válidos durante falhas de atualização.

Evoluções dependem de necessidade do produto:

- Processamento no servidor exige query key com filtros, sorting e página, além de flags `manual*` restritas à tabela correspondente.
- Persistência de filtros ou visibilidade exige estado controlado e contrato de armazenamento.
- Seleção de linhas, ações em lote, virtualização, redimensionamento e pinning exigem desenho e testes próprios.
- Skeletons específicos por coluna só devem ser introduzidos se uma necessidade visual concreta justificar metadata adicional.

Antes de introduzir qualquer feature, confirme seu uso em uma tabela concreta e a consequência na navegação por teclado, estados assíncronos e CSV.
