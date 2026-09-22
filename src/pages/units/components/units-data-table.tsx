import { useMemo, useState } from "react";

import { DataTable } from "@/components/data-table/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table/components/data-table-column-header";
import { DataTableComboboxFilter } from "@/components/data-table/components/data-table-combobox-filter";
import { DataTablePagination } from "@/components/data-table/components/data-table-pagination";
import { DataTableRoot } from "@/components/data-table/components/data-table-root";
import {
  DataTableRowActions,
  DataTableRowActionsHeader,
} from "@/components/data-table/components/data-table-row-actions";
import { DataTableSearch } from "@/components/data-table/components/data-table-search";
import { DataTableEmpty } from "@/components/data-table/components/data-table-state";
import { DataTableToolbar } from "@/components/data-table/components/data-table-toolbar";
import { DataTableViewOptions } from "@/components/data-table/components/data-table-view-options";
import { createServerTableHook } from "@/components/data-table/hooks/create-server-table-hook";
import { useDataTableState } from "@/components/data-table/hooks/use-data-table-state";
import { toast } from "@/components/ui/toast";
import { erpUnitsLegacyFixture } from "@/pages/units/mocks/erp-units.mock";
import { mapLegacyUnits } from "@/pages/units/model/unit-mapper";
import type { Unit } from "@/pages/units/model/unit";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const units = mapLegacyUnits(erpUnitsLegacyFixture);
const tableApi = createServerTableHook<Record<string, never>>();
const columnHelper = tableApi.createAppColumnHelper<Unit>();

function displayNullable(value: string | null) {
  return value ?? "Não informado";
}

function formatDateTime(value: string | null) {
  return value ? dateTimeFormatter.format(new Date(value)) : "Não informado";
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function getCityFilterValue(unit: Unit) {
  return `${unit.stateCode}:${unit.city}`;
}

async function copyUnitId(id: string) {
  try {
    await navigator.clipboard.writeText(id);
    toast.add({ description: id, title: "Código copiado", type: "success" });
  } catch {
    toast.add({
      description: "Não foi possível copiar o código da unidade.",
      title: "Falha ao copiar",
      type: "error",
    });
  }
}

const columns = columnHelper.columns([
  columnHelper.accessor("id", {
    enableHiding: true,
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Código" />,
    meta: { visibilityLabel: "Código" },
  }),
  columnHelper.accessor("tradeName", {
    enableHiding: true,
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nome fantasia" />,
    meta: { visibilityLabel: "Nome fantasia" },
  }),
  columnHelper.accessor("legalName", {
    enableHiding: true,
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Razão social" />,
    meta: { visibilityLabel: "Razão social" },
  }),
  columnHelper.accessor("cnpj", {
    enableHiding: true,
    enableSorting: false,
    header: "CNPJ",
    meta: { visibilityLabel: "CNPJ" },
  }),
  columnHelper.accessor("brand", {
    enableHiding: true,
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Bandeira" />,
    meta: { visibilityLabel: "Bandeira" },
  }),
  columnHelper.accessor("brandCode", {
    enableHiding: true,
    enableSorting: false,
    header: "Código da bandeira",
    meta: { visibilityLabel: "Código da bandeira" },
  }),
  columnHelper.accessor("city", {
    cell: ({ getValue, row }) => `${getValue()} — ${row.original.stateCode}`,
    enableHiding: true,
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cidade/UF" />,
    meta: { visibilityLabel: "Cidade/UF" },
  }),
  columnHelper.accessor("state", {
    enableHiding: true,
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    meta: { visibilityLabel: "Estado" },
  }),
  columnHelper.accessor("cityCode", {
    enableHiding: true,
    enableSorting: false,
    header: "Código da cidade",
    meta: { visibilityLabel: "Código da cidade" },
  }),
  columnHelper.accessor("coordinates", {
    cell: ({ getValue }) => displayNullable(getValue()),
    enableHiding: true,
    enableSorting: false,
    header: "Coordenadas",
    meta: { visibilityLabel: "Coordenadas" },
  }),
  columnHelper.accessor("networkAddress", {
    cell: ({ getValue }) => displayNullable(getValue()),
    enableHiding: true,
    enableSorting: false,
    header: "Endereço de rede",
    meta: { visibilityLabel: "Endereço de rede" },
  }),
  columnHelper.accessor("databaseName", {
    cell: ({ getValue }) => displayNullable(getValue()),
    enableHiding: true,
    enableSorting: false,
    header: "Banco de dados",
    meta: { visibilityLabel: "Banco de dados" },
  }),
  columnHelper.accessor("sourceUpdatedAt", {
    cell: ({ getValue }) => formatDateTime(getValue()),
    enableHiding: true,
    enableSorting: false,
    header: "Atualização na origem",
    meta: { visibilityLabel: "Atualização na origem" },
  }),
  columnHelper.accessor("sourceHash", {
    enableHiding: true,
    enableSorting: false,
    header: "Hash da origem",
    meta: { visibilityLabel: "Hash da origem" },
  }),
  columnHelper.accessor("synchronizedAt", {
    cell: ({ getValue }) => formatDateTime(getValue()),
    enableHiding: true,
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Sincronização" />,
    meta: { visibilityLabel: "Sincronização" },
  }),
  columnHelper.accessor("createdAt", {
    cell: ({ getValue }) => formatDateTime(getValue()),
    enableHiding: true,
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Criação" />,
    meta: { visibilityLabel: "Criação" },
  }),
  columnHelper.accessor("updatedAt", {
    cell: ({ getValue }) => formatDateTime(getValue()),
    enableHiding: true,
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Atualização" />,
    meta: { visibilityLabel: "Atualização" },
  }),
  columnHelper.display({
    cell: ({ row }) => (
      <DataTableRowActions
        accessibleLabel={`Ações da unidade ${row.original.tradeName}`}
        copyLabel="Copiar código"
        onCopy={() => void copyUnitId(row.original.id)}
      />
    ),
    enableHiding: false,
    header: DataTableRowActionsHeader,
    id: "actions",
  }),
]);

export function UnitsDataTable() {
  const [cityFilter, setCityFilter] = useState<string>();
  const state = useDataTableState({
    initialColumnVisibility: {
      coordinates: false,
      createdAt: false,
      cityCode: false,
      databaseName: false,
      brandCode: false,
      networkAddress: false,
      sourceUpdatedAt: false,
      sourceHash: false,
      state: false,
      synchronizedAt: false,
      updatedAt: false,
    },
  });
  const cityItems = useMemo(() => {
    const items = new Map<
      string,
      { group: string; label: string; value: string }
    >();

    for (const unit of units) {
      const value = getCityFilterValue(unit);

      if (!items.has(value)) {
        items.set(value, {
          group: unit.stateCode,
          label: unit.city,
          value,
        });
      }
    }

    return Array.from(items.values()).sort(
      (left, right) =>
        left.group.localeCompare(right.group, "pt-BR") ||
        left.label.localeCompare(right.label, "pt-BR"),
    );
  }, []);
  const cityCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const unit of units) {
      const value = getCityFilterValue(unit);
      counts[value] = (counts[value] ?? 0) + 1;
    }

    return counts;
  }, []);
  const handleCityFilterChange = (value: string | undefined) => {
    setCityFilter(value);
    state.onPaginationChange((current) => ({ ...current, pageIndex: 0 }));
  };
  const filteredUnits = useMemo(() => {
    const search = normalizeSearch(state.globalFilter);
    return units.filter((unit) => {
      if (cityFilter && getCityFilterValue(unit) !== cityFilter) return false;
      if (!search) return true;

      return normalizeSearch(
        [
          unit.id,
          unit.tradeName,
          unit.legalName,
          unit.cnpj,
          unit.brand,
          unit.city,
          unit.state,
          unit.stateCode,
        ].join(" "),
      ).includes(search);
    });
  }, [cityFilter, state.globalFilter]);
  const sortedUnits = useMemo(() => {
    const sort = state.sorting[0];
    if (!sort) return filteredUnits;

    return [...filteredUnits].sort((left, right) => {
      const leftValue = left[sort.id as keyof Unit];
      const rightValue = right[sort.id as keyof Unit];
      const comparison = String(leftValue ?? "").localeCompare(
        String(rightValue ?? ""),
        "pt-BR",
        { numeric: true, sensitivity: "base" },
      );
      return sort.desc ? -comparison : comparison;
    });
  }, [filteredUnits, state.sorting]);
  const paginatedUnits = useMemo(() => {
    const start = state.pagination.pageIndex * state.pagination.pageSize;
    return sortedUnits.slice(start, start + state.pagination.pageSize);
  }, [sortedUnits, state.pagination.pageIndex, state.pagination.pageSize]);
  const table = tableApi.useAppTable({
    columns,
    data: paginatedUnits,
    getRowId: (unit) => unit.id,
    onColumnVisibilityChange: state.setColumnVisibility,
    onPaginationChange: state.onPaginationChange,
    onSortingChange: state.onSortingChange,
    rowCount: filteredUnits.length,
    state: {
      columnVisibility: state.columnVisibility,
      pagination: state.pagination,
      sorting: state.sorting,
    },
  });

  return (
    <DataTableRoot isBusy={false}>
      <DataTableToolbar
        actions={<DataTableViewOptions table={table} />}
        hasActiveFilters={false}
        onClearFilters={() => handleCityFilterChange(undefined)}
      >
        <DataTableSearch
          ariaLabel="Buscar unidades"
          onChange={state.handleSearchChange}
          onClear={state.clearSearch}
          onSubmit={state.submitSearch}
          placeholder="Buscar unidades..."
          value={state.searchDraft}
        />
        <DataTableComboboxFilter
          ariaLabel="Filtrar por cidade"
          counts={cityCounts}
          items={cityItems}
          onValueChange={handleCityFilterChange}
          placeholder="Cidade"
          value={cityFilter}
        />
      </DataTableToolbar>
      <DataTable
        caption="Lista de unidades"
        emptyState={
          <DataTableEmpty
            hasFilters={state.hasFilters || Boolean(cityFilter)}
            onClearFilters={() => {
              state.clearFilters();
              setCityFilter(undefined);
            }}
          />
        }
        isInitialLoading={false}
        table={table}
      />
      <DataTablePagination
        itemLabel={{ singular: "unidade", plural: "unidades" }}
        rowCount={filteredUnits.length}
        table={table}
      />
    </DataTableRoot>
  );
}
