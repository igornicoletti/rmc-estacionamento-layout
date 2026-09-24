import { Separator } from "@/components/ui/separator"
import {
  getRecordDetailSections,
  type RecordSectionDefinition,
} from "@/lib/format-record-fields"

interface RecordDetailsProps<TRecord> {
  record: TRecord
  sections: readonly RecordSectionDefinition<TRecord>[]
}

/**
 * Apresentação semântica de detalhes de um registro.
 *
 * Não pertence à camada App* porque não é wrapper de um componente shadcn/ui.
 */
export function RecordDetails<TRecord>({
  record,
  sections,
}: RecordDetailsProps<TRecord>) {
  const details = getRecordDetailSections(record, sections)

  return (
    <div className="flex flex-col gap-6">
      {details.map((section, index) => (
        <section className="flex flex-col gap-3" key={section.key}>
          {index > 0 ? <Separator /> : null}
          <h3 className="text-sm font-medium">{section.title}</h3>
          <dl className="grid gap-3">
            {section.fields.map((field) => (
              <div
                className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:gap-4"
                key={field.key}
              >
                <dt className="text-muted-foreground">{field.label}</dt>
                <dd className="min-w-0 break-words font-medium sm:text-right">
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}
