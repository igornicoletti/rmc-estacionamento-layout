import { describe, expect, expectTypeOf, it } from "vitest"

import type {
  FeedbackCatalog,
  FeedbackDefinition,
} from "@/app/feedback/feedback-contract"

describe("feedback contract", () => {
  it("preserva literais e parâmetros específicos das factories", () => {
    const catalog = {
      created: {
        title: "Unidade cadastrada",
        type: "success",
      },
      failed: {
        title: "Não foi possível concluir",
        priority: "high",
        type: "error",
      },
      updated: ({ unitName }: { unitName: string }) => ({
        title: "Unidade atualizada",
        description: `${unitName} foi atualizada com sucesso.`,
        type: "success",
      }),
    } as const satisfies FeedbackCatalog

    expectTypeOf(catalog.created.type).toEqualTypeOf<"success">()
    expectTypeOf(catalog.failed.priority).toEqualTypeOf<"high">()
    expectTypeOf(catalog.updated).parameter(0).toEqualTypeOf<{
      unitName: string
    }>()
    expectTypeOf(
      catalog.updated({ unitName: "Posto Central" }),
    ).toExtend<FeedbackDefinition>()

    expect(catalog.created.title).toBe("Unidade cadastrada")
  })

  it("aceita description e priority opcionais", () => {
    const feedback = {
      title: "E-mail copiado",
      type: "success",
    } as const satisfies FeedbackDefinition

    expect(feedback.title).toBe("E-mail copiado")
  })

  it("rejeita type, priority e retornos incompatíveis em compile time", () => {
    const invalidType = {
      title: "Inválido",
      // @ts-expect-error valor inválido deliberado para provar o contrato.
      type: "sucess",
    } satisfies FeedbackDefinition

    const invalidPriority = {
      title: "Inválido",
      // @ts-expect-error valor inválido deliberado para provar o contrato.
      priority: "urgent",
      type: "error",
    } satisfies FeedbackDefinition

    const invalidCatalog = {
      // @ts-expect-error retorno inválido deliberado para provar o catálogo.
      invalidFactory: () => ({ title: "Inválido", type: "sucess" }),
    } satisfies FeedbackCatalog

    expect(invalidType.type).toBe("sucess")
    expect(invalidPriority.priority).toBe("urgent")
    expect(invalidCatalog.invalidFactory().type).toBe("sucess")
  })
})
