import { describe, expect, it } from "vitest"

import {
  formatCityName,
  formatErpName,
  formatLicensePlate,
  formatOptionalText,
  formatPhone,
  formatVehicleDescription,
  formatYesNo,
  splitEmails,
} from "@/pages/clients/model/client-presentation"

describe("client presentation", () => {
  it("normaliza nomes e cidades sem expandir abreviações do ERP", () => {
    expect(formatErpName("ASSOCIACAO ECO VILLAGE I")).toBe(
      "Associação Eco Village I",
    )
    expect(formatErpName("HU TRANSPORTE RODOVIARIO LTDA")).toBe(
      "HU Transporte Rodoviário Ltda",
    )
    expect(formatErpName("FRIRON FRIOS RO COM REP LTDA")).toBe(
      "Friron Frios RO com REP Ltda",
    )
    expect(formatCityName("SAO JOSE DO RIO PRETO")).toBe(
      "São José do Rio Preto",
    )
    expect(formatCityName("BIGUACU")).toBe("Biguaçu")
  })

  it("corrige somente a apresentação de descrições conhecidas", () => {
    expect(formatVehicleDescription("MERCEDEZ")).toBe("Mercedes")
    expect(formatVehicleDescription("VEICULO")).toBe("Veículo")
    expect(formatVehicleDescription("DAF")).toBe("DAF")
    expect(formatVehicleDescription("UFF4I37")).toBe("UFF4I37")
  })

  it("aplica máscaras somente quando o formato de origem é reconhecido", () => {
    expect(formatPhone("1732264790")).toBe("(17) 3226-4790")
    expect(formatPhone("17997949893")).toBe("(17) 99794-9893")
    expect(formatLicensePlate("FSL8590")).toBe("FSL-8590")
    expect(formatLicensePlate("AGH5B94")).toBe("AGH5B94")
    expect(formatLicensePlate("EOA-058")).toBe("EOA-058")
  })

  it("padroniza ausências, flags e e-mails múltiplos", () => {
    expect(formatOptionalText("")).toBe("—")
    expect(formatYesNo("S")).toBe("Sim")
    expect(formatYesNo("N")).toBe("Não")
    expect(
      splitEmails(
        "principal@example.com;financeiro@example.com;frota@example.com",
      ),
    ).toEqual([
      "principal@example.com",
      "financeiro@example.com",
      "frota@example.com",
    ])
  })
})
