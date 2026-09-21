import { lazy, Suspense } from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableComboboxFilter } from "@/components/data-table/data-table-combobox-filter";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableRoot } from "@/components/data-table/data-table-root";
import { DataTableSearch } from "@/components/data-table/data-table-search";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import {
  DataTableEmpty,
  DataTableError,
  DataTableUpdating,
} from "@/components/data-table/data-table-state";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";

import type { UsersRepository } from "../api/users-repository";
import { USER_ROLE_OPTIONS, USER_STATUS_OPTIONS } from "../users.constants";
import { useUsersTableController } from "../use-users-table-controller";

const UserDetailsSheet = lazy(async () => {
  const module = await import("./user-details-sheet");

  return { default: module.UserDetailsSheet };
});

interface UsersTableProps {
  repository: UsersRepository;
}

const USER_ITEM_LABEL = { singular: "usuário", plural: "usuários" };

export function UsersTable({ repository }: UsersTableProps) {
  const controller = useUsersTableController(repository);
  const { table, query } = controller;
  const facets = query.data?.facets;

  if (query.isError && !query.data) {
    return (
      <DataTableError
        title="Não foi possível carregar os usuários"
        onRetry={() => void query.refetch()}
      />
    );
  }

  return (
    <DataTableRoot isBusy={query.isFetching}>
      {query.isError ? (
        <DataTableError
          title="Não foi possível atualizar os usuários"
          onRetry={() => void query.refetch()}
        />
      ) : null}

      <DataTableToolbar
        hasActiveFilters={controller.hasFilters}
        onClearFilters={controller.clearFilters}
        actions={
          <>
            <DataTableUpdating active={query.isFetching && !query.isLoading} />
            <DataTableViewOptions table={table} />
          </>
        }
      >
        <DataTableSearch
          value={controller.searchDraft}
          ariaLabel="Buscar usuários"
          placeholder="Buscar usuários..."
          onChange={controller.handleSearchChange}
          onClear={controller.clearSearch}
          onSubmit={controller.submitSearch}
        />
        <DataTableComboboxFilter
          ariaLabel="Filtrar usuários por status"
          placeholder="Todos os status"
          items={USER_STATUS_OPTIONS}
          counts={facets?.status.counts}
          value={controller.status}
          onValueChange={(value) =>
            table.getColumn("status")?.setFilterValue(value)
          }
        />
        <DataTableComboboxFilter
          ariaLabel="Filtrar usuários por perfil"
          placeholder="Todos os perfis"
          items={USER_ROLE_OPTIONS}
          counts={facets?.role.counts}
          value={controller.role}
          onValueChange={(value) =>
            table.getColumn("role")?.setFilterValue(value)
          }
        />
      </DataTableToolbar>

      <DataTable
        table={table}
        caption="Usuários do sistema"
        isInitialLoading={query.isLoading}
        emptyState={
          <DataTableEmpty
            hasFilters={controller.hasFilters}
            onClearFilters={controller.clearFilters}
            emptyTitle="Nenhum usuário disponível"
            emptyDescription="Os usuários aparecerão aqui quando forem cadastrados."
          />
        }
      />

      <DataTablePagination
        table={table}
        rowCount={query.data?.rowCount ?? 0}
        isPlaceholderData={query.isPlaceholderData}
        itemLabel={USER_ITEM_LABEL}
      />

      {controller.selectedUser ? (
        <Suspense fallback={null}>
          <UserDetailsSheet
            user={controller.selectedUser}
            onOpenChange={(open) => {
              if (!open) controller.setSelectedUser(null);
            }}
          />
        </Suspense>
      ) : null}
    </DataTableRoot>
  );
}
