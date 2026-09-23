import { ArrowLeftIcon, HistoryIcon, RefreshCwIcon } from "lucide-react";
import { Link } from "react-router";

import { Button, buttonVariants } from "@/components/ui/button";
import { appCopy } from "@/app/config/app-copy";

interface PageHistorySyncActionsProps {
  backTo?: string;
}

export function PageHistorySyncActions({
  backTo,
}: PageHistorySyncActionsProps) {
  return (
    <>
      {backTo ? (
        <Link className={buttonVariants({ variant: "outline" })} to={backTo}>
          <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
          {appCopy.pageActions.back}
        </Link>
      ) : null}
      <Button type="button" variant="outline">
        <HistoryIcon aria-hidden="true" data-icon="inline-start" />
        {appCopy.pageActions.history}
      </Button>
      <Button type="button">
        <RefreshCwIcon aria-hidden="true" data-icon="inline-start" />
        {appCopy.pageActions.synchronize}
      </Button>
    </>
  );
}
