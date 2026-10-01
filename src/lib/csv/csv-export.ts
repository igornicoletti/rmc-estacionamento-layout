export type CsvValue = boolean | number | string | null | undefined

export interface CsvColumn<TRow> {
  getValue: (row: TRow) => CsvValue
  header: string
}

function toCsvText(value: CsvValue) {
  if (value === null || value === undefined) {
    return ""
  }

  return value.toString()
}

function escapeCsvField(value: CsvValue) {
  const text = toCsvText(value)

  if (!/[",\r\n]/u.test(text)) {
    return text
  }

  return '"' + text.replaceAll('"', '""') + '"'
}

export function serializeCsv<TRow>(
  rows: readonly TRow[],
  columns: readonly CsvColumn<TRow>[],
) {
  const records = [
    columns.map((column) => escapeCsvField(column.header)).join(","),
    ...rows.map((row) =>
      columns.map((column) => escapeCsvField(column.getValue(row))).join(","),
    ),
  ]

  return records.join("\r\n") + "\r\n"
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = filename
  link.hidden = true

  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
