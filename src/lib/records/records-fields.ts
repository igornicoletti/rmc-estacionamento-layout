import type { CsvColumn } from "@/lib/csv/csv-export"

export type RecordValue = boolean | number | string | null | undefined

export interface RecordFieldDefinition<TRecord> {
  getValue: (record: TRecord) => RecordValue
  key: Extract<keyof TRecord, string>
  label: string
}

export interface RecordSectionDefinition<TRecord> {
  fields: readonly RecordFieldDefinition<TRecord>[]
  key: string
  title: string
}

const EMPTY_DISPLAY = "—"

function normalizeRecordValue(value: RecordValue) {
  if (value === null || value === undefined) {
    return null
  }

  const text = String(value).trim()
  return text === "" ? null : text
}

export function serializeRecordForClipboard<TRecord>(
  record: TRecord,
  sections: readonly RecordSectionDefinition<TRecord>[],
) {
  return sections
    .flatMap((section) => section.fields)
    .map((field) => {
      const value =
        normalizeRecordValue(field.getValue(record)) ?? EMPTY_DISPLAY

      return field.label + ": " + value
    })
    .join("\n")
}

export function createRecordCsvColumns<TRecord>(
  sections: readonly RecordSectionDefinition<TRecord>[],
): CsvColumn<TRecord>[] {
  return sections.flatMap((section) =>
    section.fields.map((field) => ({
      header: field.label,
      getValue: (record: TRecord) =>
        normalizeRecordValue(field.getValue(record)) ?? "",
    })),
  )
}
