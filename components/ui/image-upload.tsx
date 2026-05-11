'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  bucket: string
  path: string
  currentUrl?: string | null
  shape?: 'square' | 'circle'
  size?: number
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleFile(file: File) {
    setErrorMsg(null)

    if (!ACCEPTED.includes(file.type)) {
      const msg = 'Use uma imagem JPG, PNG ou WebP.'
      setErrorMsg(msg)
      onError?.(msg)
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      const msg = `Imagem muito grande. Máximo ${MAX_SIZE_MB} MB.`
      setErrorMsg(msg)
      onError?.(msg)
      return
    }

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
      const msg = `Erro ao fazer upload: ${error.message}`
      setErrorMsg(msg)
      onError?.(msg)
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

  const radius = shape === 'circle' ? '9999px' : '12px'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        {/* Preview / drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={{
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: 'var(--agendou-surface-2)',
            border: dragging
              ? '2px dashed #A78BFA'
              : '2px dashed var(--agendou-border)',
            boxShadow: dragging ? '0 0 0 3px rgba(124,58,237,0.15)' : undefined,
          }}
          className="relative shrink-0 cursor-pointer overflow-hidden transition-all hover:border-violet-500"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="preview" className="h-full w-full object-cover" />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ color: 'var(--agendou-text-faint)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
          )}
          {uploading && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(13,11,18,0.6)' }}
            >
              <span
                className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: '#A78BFA', borderTopColor: 'transparent' }}
              />
            </div>
          )}
        </div>

        {/* Texto */}
        <div className="text-xs" style={{ color: 'var(--agendou-text-muted)' }}>
          <p className="font-medium" style={{ color: 'var(--agendou-text)' }}>
            {preview ? 'Clique para trocar' : 'Clique ou arraste'}
          </p>
          <p style={{ color: 'var(--agendou-text-faint)' }}>
            JPG, PNG ou WebP · máx. {MAX_SIZE_MB} MB
          </p>
          {preview && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setPreview(null)
                setErrorMsg(null)
                onUpload('')
              }}
              className="mt-1 text-xs transition-colors"
              style={{ color: '#F87171' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#FCA5A5' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#F87171' }}
            >
              Remover imagem
            </button>
          )}
        </div>
      </div>

      {/* Erro inline */}
      {errorMsg && (
        <p
          className="rounded-lg px-3 py-2 text-xs"
          style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#F87171' }}
        >
          {errorMsg}
        </p>
      )}

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
