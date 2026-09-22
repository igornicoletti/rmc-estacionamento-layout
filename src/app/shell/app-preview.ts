import { appPages } from "@/app/config/app-config"

// Demonstration only: never used to resolve authentication or capabilities.
export const shellPreviewData = {
  currentUser: {
    email: "usuario@redemontecarlo.com",
    name: "Nome do Usuário",
    profile: "Superadmin",
  },
  notifications: [
    {
      id: "capture-created",
      title: "Nova captura",
      message: "Uma nova captura foi adicionada ao Pátio Virtual.",
      dateTime: "2026-08-30T07:42:00-03:00",
      timeLabel: "30/08, 07:42",
      to: appPages["virtual-yard"].path,
    },
    {
      id: "unit-updated",
      title: "Unidade atualizada",
      message: "Os dados da unidade foram atualizados.",
      dateTime: "2026-08-29T16:20:00-03:00",
      timeLabel: "29/08, 16:20",
      to: appPages.units.path,
    },
    {
      id: "vehicle-updated",
      title: "Veículo atualizado",
      message: "As informações do veículo foram atualizadas.",
      dateTime: "2026-07-29T09:10:00-03:00",
      timeLabel: "29/07, 09:10",
      to: appPages["virtual-yard"].path,
    },
  ],
} as const
