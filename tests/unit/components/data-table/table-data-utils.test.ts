import { describe, expect, it } from "vitest"

import {
  normalizeSearchText,
  paginateRows,
  sortRows,
} from "@/components/data-table/core/table-data-utils"

describe("table data utils", () => {
  it("normaliza acentos para busca", () => {
    expect(normalizeSearchText("São José")).toBe("sao jose")
  })

  it("ordena numericamente e respeita direção", () => {
    const rows = [{ value: "10" }, { value: "2" }]
    expect(sortRows(rows, [{ id: "value", desc: false }], (row) => row.value)).toEqual([
      { value: "2" },
      { value: "10" },
    ])
    expect(sortRows(rows, [{ id: "value", desc: true }], (row) => row.value)).toEqual([
      { value: "10" },
      { value: "2" },
    ])
  })

  it("preserva a ordem sem critério e trata valores ausentes", () => {
    const rows = [{ value: "2" }, { value: null }]
    const unchanged = sortRows(rows, [], (row) => row.value)

    expect(unchanged).toEqual(rows)
    expect(unchanged).not.toBe(rows)
    expect(
      sortRows(rows, [{ id: "value", desc: false }], (row) => row.value),
    ).toEqual([{ value: null }, { value: "2" }])
    expect(
      sortRows([...rows].reverse(), [{ id: "value", desc: true }], (row) => row.value),
    ).toEqual([{ value: "2" }, { value: null }])
  })

  it("recorta a página sem alterar a coleção original", () => {
    const rows = [1, 2, 3, 4]
    expect(paginateRows(rows, { pageIndex: 1, pageSize: 2 })).toEqual([3, 4])
    expect(rows).toEqual([1, 2, 3, 4])
  })
})
