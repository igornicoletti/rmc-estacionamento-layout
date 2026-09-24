import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AvatarImageUploadDialog } from "@/components/dialogs/image-upload"

const previewUrl = "blob:avatar-preview"
const createObjectURLMock = vi.fn(() => previewUrl)
const revokeObjectURLMock = vi.fn()

beforeEach(() => {
  createObjectURLMock.mockClear()
  revokeObjectURLMock.mockClear()

  vi.spyOn(URL, "createObjectURL").mockImplementation(createObjectURLMock)
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(revokeObjectURLMock)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("AvatarImageUploadDialog", () => {
  it("encaminha arquivo válido escolhido pelo input", async () => {
    const user = userEvent.setup()
    const onFileSelect = vi.fn()
    const file = new File(["avatar"], "avatar.png", {
      type: "image/png",
    })

    const { unmount } = render(
      <AvatarImageUploadDialog
        displayName="Maria Silva"
        onFileSelect={onFileSelect}
        onOpenChange={vi.fn()}
        onRemove={vi.fn()}
        open
      />,
    )

    const input = document.querySelector('input[type="file"]')

    expect(input).toBeInstanceOf(HTMLInputElement)

    await user.upload(input as HTMLInputElement, file)

    expect(createObjectURLMock).toHaveBeenCalledWith(file)
    expect(onFileSelect).toHaveBeenCalledWith(file)

    unmount()

    expect(revokeObjectURLMock).toHaveBeenCalledWith(previewUrl)
  })

  it("aceita arquivo válido por arrastar e soltar", () => {
    const onFileSelect = vi.fn()
    const file = new File(["avatar"], "avatar.webp", {
      type: "image/webp",
    })

    render(
      <AvatarImageUploadDialog
        displayName="Maria Silva"
        onFileSelect={onFileSelect}
        onOpenChange={vi.fn()}
        onRemove={vi.fn()}
        open
      />,
    )

    fireEvent.drop(
      screen.getByRole("button", {
        name: "Selecionar arquivo de imagem",
      }),
      {
        dataTransfer: {
          files: [file],
        },
      },
    )

    expect(onFileSelect).toHaveBeenCalledWith(file)
  })

  it("rejeita arquivo fora dos formatos suportados", () => {
    const onFileSelect = vi.fn()
    const file = new File(["arquivo"], "avatar.gif", {
      type: "image/gif",
    })

    render(
      <AvatarImageUploadDialog
        displayName="Maria Silva"
        onFileSelect={onFileSelect}
        onOpenChange={vi.fn()}
        onRemove={vi.fn()}
        open
      />,
    )

    fireEvent.drop(
      screen.getByRole("button", {
        name: "Selecionar arquivo de imagem",
      }),
      {
        dataTransfer: {
          files: [file],
        },
      },
    )

    expect(screen.getByRole("alert")).toBeInTheDocument()
    expect(onFileSelect).not.toHaveBeenCalled()
  })

  it("rejeita arquivo acima do tamanho máximo", () => {
    const onFileSelect = vi.fn()
    const file = new File(["avatar"], "avatar.png", {
      type: "image/png",
    })

    render(
      <AvatarImageUploadDialog
        displayName="Maria Silva"
        maxFileSizeBytes={4}
        onFileSelect={onFileSelect}
        onOpenChange={vi.fn()}
        onRemove={vi.fn()}
        open
      />,
    )

    fireEvent.drop(
      screen.getByRole("button", {
        name: "Selecionar arquivo de imagem",
      }),
      {
        dataTransfer: {
          files: [file],
        },
      },
    )

    expect(screen.getByRole("alert")).toBeInTheDocument()
    expect(onFileSelect).not.toHaveBeenCalled()
  })

  it("exibe a remoção quando existe imagem", async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()

    render(
      <AvatarImageUploadDialog
        displayName="Maria Silva"
        imageSrc="/avatar.png"
        onFileSelect={vi.fn()}
        onOpenChange={vi.fn()}
        onRemove={onRemove}
        open
      />,
    )

    const dialog = screen.getByRole("dialog")

    await user.click(
      within(dialog).getByRole("button", { name: "Remover imagem" }),
    )

    expect(onRemove).toHaveBeenCalledOnce()
    expect(
      within(dialog).queryByRole("button", { name: "Remover imagem" }),
    ).not.toBeInTheDocument()
  })
})
