export const dataTableCopy = {
  search: {
    clear: "Limpar busca",
    defaultAriaLabel: "Buscar registros",
    defaultPlaceholder: "Buscar registros...",
  },
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
    defaultDescription:
      "Os registros aparecerão aqui quando estiverem disponíveis.",
    filteredTitle: "Nenhum resultado encontrado",
    filteredDescription:
      "Revise os termos de busca ou remova os filtros aplicados.",
    clearFilters: "Limpar filtros",
  },
  error: {
    defaultTitle: "Não foi possível carregar os registros",
    defaultDescription:
      "Tente novamente. Se o problema persistir, contate o suporte.",
    retry: "Tentar novamente",
  },
  updating: "Atualizando",
  rowActions: {
    label: "Ações",
    details: "Detalhes",
    copyData: "Copiar dados",
    copySuccessTitle: "Dados copiados",
    copySuccessDescription: "Os dados do registro foram copiados.",
    copyErrorDescription: "Não foi possível copiar os dados do registro.",
  },
  export: {
    trigger: "Exportar CSV",
    tooltip: "Exportar dados filtrados em CSV",
  },
  columns: {
    trigger: "Gerenciar colunas",
    tooltip: "Gerenciar colunas",
    label: "Colunas da tabela",
    lastVisible: "última coluna visível",
  },
} as const
