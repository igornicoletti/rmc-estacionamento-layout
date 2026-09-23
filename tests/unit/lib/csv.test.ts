import { describe, expect, it } from "vitest"

import { serializeCsv } from "@/lib/csv"

describe("serializeCsv", () => {
  it("serializa cabeçalho, CRLF e campos que exigem aspas", () => {
    const csv = serializeCsv(
      [
        {
          id: "1",
          name: 'Monte Carlo, "Centro"',
          note: "linha 1\nlinha 2",
          optional: null,
        },
      ],
      [
        { header: "Código", getValue: (row) => row.id },
        { header: "Nome", getValue: (row) => row.name },
        { header: "Observação", getValue: (row) => row.note },
        { header: "Opcional", getValue: (row) => row.optional },
      ],
    )

    expect(csv).toBe(
      'Código,Nome,Observação,Opcional\r\n' +
        '1,"Monte Carlo, ""Centro""","linha 1\nlinha 2",\r\n',
    )
  })
})
