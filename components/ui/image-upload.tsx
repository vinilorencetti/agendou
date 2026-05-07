'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  bucket: string
  path: string               // pasta de destino, ex: "{tenantId}" ou "{tenantId}/{proId}"
  currentUrl?: string | null
  shape?: 'square' | 'circle'
  size?: number              // px do preview
  onUpload: (url: string) => void
  onError?: (msg: string) => void
}

const MAX_SIZE_MB = 5
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

export default function ImageUpload({
  bucket,
  path,
  currentUrl,
  shape = 'square',
  size = 80,
  onUpload,
  onError,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)

  async function handleFile(file: File) {
    if (!ACCEPTED.includes(file.type)) {
      onError?.('Use uma imagem JPG, PNG ou WebP.')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      onError?.(`Imagem muito grande. Máximo ${MAX_SIZE_MB} MB.`)
      return
    }

    // Preview imediato
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setUploading(true)

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const filename = `${Date.now()}.${ext}`
    const storagePath = `${path}/${filename}`

    const { error } = await supabase.storage.from(bucket).upload(storagePath, file, {
      upsert: true,
      contentType: file.type,
    })

    if (error) {
      setPreview(currentUrl ?? null)
      onError?.('Erro ao fazer upload. Tente novamente.')
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath)
    onUpload(data.publicUrl)
    setUploading(false)
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const radius = shape === 'circle' ? '9999px' : '10px'

  return (
    <div className="flex items-center gap-4">
      {/* Preview */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{ width: size, height: size, borderRadius: radius }}
        className={`relative shrink-0 cursor-pointer overflow-hidden border-2 transition-colors ${
          dragging ? 'border-black' : 'border-dashed border-gray-300 hover:border-gray-400'
        } bg-gray-50`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="preview" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
          </div>
        )}
      </div>

      {/* Instrução */}
      <div className="text-xs text-gray-500">
        <p className="font-medium text-gray-700">
          {preview ? 'Clique para trocar' : 'Clique ou arraste'}
        </p>
        <p>JPG, PNG ou WebP · máx. {MAX_SIZE_MB} MB</p>
        {preview && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setPreview(null)
              onUpload('')
            }}
            className="mt-1 text-red-400 hover:text-red-600"
          >
            Remover imagem
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  )
}
