export const dataTableCopy = {
  search: { clear: "Limpar busca", defaultAriaLabel: "Buscar registros", defaultPlaceholder: "Buscar registros..." },
  pagination: {
    rowsPerPage: "Linhas por página",
    page: "Página",
    of: "de",
    first: "Primeira página",
    previous: "Página anterior",
    next: "Próxima página",
    last: "Última página",
    defaultItem: { singular: "registro", plural: "registros" },
  },
  empty: {
    defaultTitle: "Nenhum registro disponível",
    defaultDescription: "Os registros aparecerão aqui quando estiverem disponíveis.",
    filteredTitle: "Nenhum resultado encontrado",
    filteredDescription: "Revise os termos de busca ou remova os filtros aplicados.",
    clearFilters: "Limpar filtros",
  },
  error: {
    defaultTitle: "Não foi possível carregar os registros",
    defaultDescription: "Tente novamente. Se o problema persistir, contate o suporte.",
    retry: "Tentar novamente",
  },
  updating: "Atualizando",
  rowActions: { label: "Ações", view: "Ver detalhes" },
  columns: { trigger: "Colunas", tooltip: "Exibir colunas", label: "Colunas visíveis", lastVisible: "última coluna visível" },
} as const
