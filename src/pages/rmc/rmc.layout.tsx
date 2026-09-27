import { useState } from "react";
import {
  AlertTriangleIcon,
  CircleCheckIcon,
  InboxIcon,
  InfoIcon,
  ShieldCheckIcon,
  UserIcon,
  XCircleIcon,
} from "lucide-react";

import { AppPageLayout } from "@/app/layouts/app-page-layout";
import { AppAlertDialog } from "@/components/app/app-alert-dialog";
import { AppBadge } from "@/components/app/app-badge";
import { AppCalendar } from "@/components/app/app-calendar";
import { AppCombobox } from "@/components/app/app-combobox";
import { AppDialog } from "@/components/app/app-dialog";
import { AppEmpty } from "@/components/app/app-empty";
import { AppSheet } from "@/components/app/app-sheet";
import { Button } from "@/components/ui/button";

type PreviewId =
  | "alert-dialog"
  | "badge"
  | "calendar"
  | "combobox"
  | "dialog"
  | "empty"
  | "sheet";

const previewActions = [
  { id: "alert-dialog", label: "Exibir AppAlertDialog" },
  { id: "dialog", label: "Exibir AppDialog" },
  { id: "sheet", label: "Exibir AppSheet" },
  { id: "badge", label: "Exibir AppBadge" },
  { id: "calendar", label: "Exibir AppCalendar" },
  { id: "combobox", label: "Exibir AppCombobox" },
  { id: "empty", label: "Exibir AppEmpty" },
] as const satisfies ReadonlyArray<{ id: PreviewId; label: string }>;

const statusItems = [
  { label: "Ativo", value: "active" },
  { label: "Pausado", value: "paused" },
  { label: "Rascunho", value: "draft" },
] as const;

function ScrollPreview() {
  return (
    <ol className="flex flex-col gap-3">
      {Array.from({ length: 20 }, (_, index) => (
        <li className="rounded-lg border p-3" key={index}>
          Item {index + 1}: conteúdo de exemplo para verificar a rolagem do
          painel.
        </li>
      ))}
    </ol>
  );
}

export function RmcPreviewPage() {
  const [activePreview, setActivePreview] = useState<PreviewId | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<
    (typeof statusItems)[number]["value"] | undefined
  >();

  const closePreview = () => setActivePreview(null);

  return (
    <AppPageLayout
      page={{
        availability: "available",
        title: "Componentes compartilhados",
        subtitle: "Prévia visual dos componentes reutilizados sobre shadcn/ui.",
      }}
    >
      <section aria-label="Ações de prévia" className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {previewActions.map(({ id, label }) => (
            <Button
              aria-pressed={activePreview === id}
              key={id}
              onClick={() =>
                setActivePreview((current) => (current === id ? null : id))
              }
              type="button"
              variant={activePreview === id ? "secondary" : "outline"}
            >
              {label}
            </Button>
          ))}
        </div>

        {activePreview === "badge" ? (
          <section
            aria-label="Prévia de AppBadge"
            className="flex flex-wrap gap-2 rounded-xl border p-4"
          >
            <AppBadge icon={ShieldCheckIcon} tone="primary">
              Principal
            </AppBadge>
            <AppBadge icon={InfoIcon} tone="info">
              Informação
            </AppBadge>
            <AppBadge icon={CircleCheckIcon} tone="success">
              Sucesso
            </AppBadge>
            <AppBadge icon={AlertTriangleIcon} tone="warning">
              Atenção
            </AppBadge>
            <AppBadge icon={XCircleIcon} tone="error">
              Erro
            </AppBadge>
          </section>
        ) : null}

        {activePreview === "calendar" ? (
          <section
            aria-label="Prévia de AppCalendar"
            className="w-fit rounded-xl border p-4"
          >
            <AppCalendar
              mode="single"
              onSelect={setSelectedDate}
              selected={selectedDate}
            />
          </section>
        ) : null}

        {activePreview === "combobox" ? (
          <section
            aria-label="Prévia de AppCombobox"
            className="w-full max-w-xs"
          >
            <AppCombobox
              ariaLabel="Status de exemplo"
              fullWidth
              items={statusItems}
              onValueChange={setSelectedStatus}
              placeholder="Selecione um status"
              value={selectedStatus}
            />
          </section>
        ) : null}

        {activePreview === "empty" ? (
          <section
            aria-label="Prévia de AppEmpty"
            className="rounded-xl border p-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <AppEmpty
                description="Exemplo com EmptyMedia na variante icon."
                media={{ icon: InboxIcon }}
                title="Nenhum item para exibir"
              />
              <AppEmpty
                description="Exemplo com Avatar composto pelo AppEmpty."
                media={{
                  avatar: {
                    alt: "Perfil de exemplo",
                    className: "size-12",
                    fallback: <UserIcon aria-hidden="true" />,
                  },
                }}
                title="Perfil sem imagem"
              />
            </div>
          </section>
        ) : null}
      </section>

      <AppAlertDialog
        action="Confirmar"
        actionProps={{ onClick: closePreview }}
        description="Exemplo de confirmação para inspecionar título, descrição e ações."
        onOpenChange={(open) => {
          if (!open) closePreview();
        }}
        open={activePreview === "alert-dialog"}
        title="AppAlertDialog"
      />

      <AppDialog
        closeLabel="Fechar"
        description="Corpo rolável com cabeçalho e rodapé fixos."
        onOpenChange={(open) => {
          if (!open) closePreview();
        }}
        open={activePreview === "dialog"}
        title="AppDialog"
      >
        <ScrollPreview />
      </AppDialog>

      <AppSheet
        closeLabel="Fechar"
        description="Painel lateral largo com conteúdo rolável."
        onOpenChange={(open) => {
          if (!open) closePreview();
        }}
        open={activePreview === "sheet"}
        title="AppSheet"
      >
        <ScrollPreview />
      </AppSheet>
    </AppPageLayout>
  );
}
