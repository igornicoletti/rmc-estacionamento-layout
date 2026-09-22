import { CopyIcon, EyeIcon, MoreHorizontalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataTableRowActionsProps {
  accessibleLabel: string;
  copyLabel: string;
  onCopy: () => void;
  onView?: () => void;
}

export function DataTableRowActions({
  accessibleLabel,
  copyLabel,
  onCopy,
  onView,
}: DataTableRowActionsProps) {
  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" />}
          aria-label={accessibleLabel}
        >
          <MoreHorizontalIcon data-icon="inline-start" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            {onView ? (
              <DropdownMenuItem onClick={onView}>
                <EyeIcon aria-hidden="true" />
                Ver detalhes
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={onCopy}>
              <CopyIcon aria-hidden="true" />
              {copyLabel}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function DataTableRowActionsHeader() {
  return <span className="sr-only">Ações</span>;
}
