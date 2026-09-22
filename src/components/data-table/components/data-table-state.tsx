import { useEffect, useState } from "react";
import { CircleAlertIcon, SearchXIcon } from "lucide-react";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { TableCell, TableRow } from "@/components/ui/table";

interface DataTableSkeletonRowsProps {
  columns: number;
  rows: number;
}

export function DataTableSkeletonRows({
  columns,
  rows,
}: DataTableSkeletonRowsProps) {
  return Array.from({ length: rows }, (_, rowIndex) => (
    <TableRow
      key={`skeleton-${rowIndex}`}
      aria-hidden="true"
      className="h-14 animate-in fade-in-0 duration-150 [animation-delay:150ms] fill-mode-[backwards]"
    >
      {Array.from({ length: columns }, (__, columnIndex) => (
        <TableCell key={`skeleton-${rowIndex}-${columnIndex}`}>
          <Skeleton className="h-5 w-full max-w-32" />
        </TableCell>
      ))}
    </TableRow>
  ));
}

interface DataTableEmptyProps {
  hasFilters: boolean;
  onClearFilters: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTableEmpty({
  hasFilters,
  onClearFilters,
  emptyTitle = "Nenhum registro disponível",
  emptyDescription = "Os registros aparecerão aqui quando estiverem disponíveis.",
}: DataTableEmptyProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>
          {hasFilters ? "Nenhum resultado encontrado" : emptyTitle}
        </EmptyTitle>
        <EmptyDescription>
          {hasFilters
            ? "Revise os termos de busca ou remova os filtros aplicados."
            : emptyDescription}
        </EmptyDescription>
      </EmptyHeader>
      {hasFilters ? (
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Limpar filtros
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}

interface DataTableErrorProps {
  onRetry: () => void;
  title?: string;
  description?: string;
}

export function DataTableError({
  onRetry,
  title = "Não foi possível carregar os registros",
  description = "Tente novamente. Se o problema persistir, contate o suporte.",
}: DataTableErrorProps) {
  return (
    <Alert variant="destructive">
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
      <AlertAction>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
        >
          Tentar novamente
        </Button>
      </AlertAction>
    </Alert>
  );
}

export function DataTableUpdating({ active }: { active: boolean }) {
  if (!active) return null;

  return <DataTableUpdatingContent />;
}

function DataTableUpdatingContent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsVisible(true), 300);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="flex items-center gap-2 text-sm text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <Spinner aria-hidden="true" />
      Atualizando
    </div>
  );
}
