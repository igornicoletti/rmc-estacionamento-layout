import { ImageUpIcon, Trash2Icon } from "lucide-react"
import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react"
import { cn } from "cn"

import { appCopy, getUserAvatarAlt } from "@/app/config/app-copy"
import { AppDialog } from "@/components/common/app-dialog"
import { AppEmpty } from "@/components/common/app-empty"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

const DEFAULT_ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const
const DEFAULT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

const MIME_TYPE_LABELS: Readonly<Record<string, string>> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WEBP",
}

interface AvatarImageUploadDialogProps {
  acceptedMimeTypes?: readonly string[]
  displayName: string
  imageSrc?: string
  isPending?: boolean
  maxFileSizeBytes?: number
  onFileSelect: (file: File) => void
  onOpenChange: (open: boolean) => void
  onRemove: () => void
  open: boolean
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/u).filter(Boolean)

  if (parts.length === 0) {
    return "?"
  }

  if (parts.length === 1) {
    return parts[0]?.slice(0, 2).toUpperCase() ?? "?"
  }

  const first = parts[0]?.[0] ?? ""
  const last = parts.at(-1)?.[0] ?? ""

  return `${first}${last}`.toUpperCase()
}

function formatSupportedTypes(types: readonly string[]) {
  const labels = types.map(
    (type) =>
      MIME_TYPE_LABELS[type] ??
      type.replace(/^image\//u, "").toUpperCase(),
  )

  return new Intl.ListFormat("pt-BR", {
    style: "short",
    type: "disjunction",
  }).format(labels)
}

function formatMaxFileSize(bytes: number) {
  const megabytes = bytes / (1024 * 1024)
  return `${Number(megabytes.toFixed(1))} MB`
}

/**
 * Overlay genérico para escolher uma imagem de avatar.
 *
 * Faz preview e validação de UX no cliente. Persistência, upload e validação
 * definitiva do arquivo pertencem ao escopo consumidor.
 */
export function AvatarImageUploadDialog({
  acceptedMimeTypes = DEFAULT_ACCEPTED_MIME_TYPES,
  displayName,
  imageSrc,
  isPending = false,
  maxFileSizeBytes = DEFAULT_MAX_FILE_SIZE_BYTES,
  onFileSelect,
  onOpenChange,
  onRemove,
  open,
}: AvatarImageUploadDialogProps) {
  const copy = appCopy.overlays.avatarImageUpload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragDepthRef = useRef(0)
  const [fileError, setFileError] = useState<string>()
  const [isDragging, setIsDragging] = useState(false)
  const [isLocallyRemoved, setIsLocallyRemoved] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>()

  useEffect(() => {
    if (!previewUrl || typeof URL.revokeObjectURL !== "function") {
      return
    }

    return () => {
      URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const currentImageSrc = isLocallyRemoved
    ? undefined
    : previewUrl ?? imageSrc
  const hasImage = Boolean(currentImageSrc)
  const supportedFiles = [
    formatSupportedTypes(acceptedMimeTypes),
    `Máximo de ${formatMaxFileSize(maxFileSizeBytes)}`,
  ].join(". ") + "."

  const resetLocalState = () => {
    dragDepthRef.current = 0
    setFileError(undefined)
    setIsDragging(false)
    setIsLocallyRemoved(false)
    setPreviewUrl(undefined)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetLocalState()
    }

    onOpenChange(nextOpen)
  }

  const handleFile = (file: File) => {
    if (isPending) {
      return
    }

    if (!acceptedMimeTypes.includes(file.type)) {
      setFileError(copy.invalidType)
      return
    }

    if (file.size > maxFileSizeBytes) {
      setFileError(copy.tooLarge)
      return
    }

    setFileError(undefined)
    setIsLocallyRemoved(false)

    if (typeof URL.createObjectURL === "function") {
      setPreviewUrl(URL.createObjectURL(file))
    }

    onFileSelect(file)
  }

  const openFilePicker = () => {
    if (!isPending) {
      fileInputRef.current?.click()
    }
  }

  const handleDragEnter = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()

    if (isPending) {
      return
    }

    dragDepthRef.current += 1
    setIsDragging(true)
  }

  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()

    if (!isPending) {
      event.dataTransfer.dropEffect = "copy"
    }
  }

  const handleDragLeave = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()

    if (isPending) {
      return
    }

    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)

    if (dragDepthRef.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    dragDepthRef.current = 0
    setIsDragging(false)

    const [file] = Array.from(event.dataTransfer.files)

    if (file) {
      handleFile(file)
    }
  }

  const handleRemove = () => {
    if (isPending) {
      return
    }

    setFileError(undefined)
    setIsLocallyRemoved(true)
    setPreviewUrl(undefined)
    onRemove()
  }

  return (
    <AppDialog
      footer={
        <Button
          className="w-full"
          disabled={isPending}
          onClick={openFilePicker}
          type="button"
        >
          {isPending ? (
            <Spinner aria-hidden="true" data-icon="inline-start" />
          ) : null}
          {isPending ? copy.choosingAction : copy.chooseAction}
        </Button>
      }
      onOpenChange={handleOpenChange}
      open={open}
      title={copy.title}
    >
      <AppEmpty
        description={supportedFiles}
        headingLevel={3}
        media={{
          avatar: (
            <div className="relative">
              <button
                aria-label={copy.inputLabel}
                className={cn(
                  "group relative rounded-full outline-none transition-shadow focus-visible:ring-3 focus-visible:ring-ring/30",
                  isDragging && "ring-3 ring-ring/30",
                )}
                disabled={isPending}
                onClick={openFilePicker}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                type="button"
              >
                <Avatar className="size-24">
                  {currentImageSrc ? (
                    <AvatarImage
                      alt={getUserAvatarAlt(displayName)}
                      src={currentImageSrc}
                    />
                  ) : null}
                  <AvatarFallback className="text-xl font-medium">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>

                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
                    isDragging && "opacity-100",
                  )}
                >
                  <ImageUpIcon className="size-6" />
                </span>
              </button>

              {hasImage ? (
                <Button
                  aria-label={copy.removeAction}
                  className="absolute right-0 bottom-0"
                  disabled={isPending}
                  onClick={handleRemove}
                  size="icon-sm"
                  type="button"
                  variant="destructive"
                >
                  <Trash2Icon aria-hidden="true" />
                </Button>
              ) : null}
            </div>
          ),
        }}
        title={isDragging ? copy.dropTitle : copy.uploadTitle}
      >
        {fileError ? (
          <p className="text-destructive" role="alert">
            {fileError}
          </p>
        ) : null}
      </AppEmpty>

      <input
        accept={acceptedMimeTypes.join(",")}
        className="hidden"
        disabled={isPending}
        onChange={(event) => {
          const [file] = Array.from(event.currentTarget.files ?? [])

          if (file) {
            handleFile(file)
          }

          event.currentTarget.value = ""
        }}
        ref={fileInputRef}
        type="file"
      />
    </AppDialog>
  )
}
