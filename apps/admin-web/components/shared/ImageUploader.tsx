'use client'

import { useCallback, useRef, useState } from 'react'
import { Upload, X, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { presignUpload, uploadToR2 } from '@/lib/api'

interface ImageUploaderProps {
  value: string[]
  onChange: (urls: string[]) => void
  folder: string
  maxFiles?: number
  maxSizeMB?: number
  className?: string
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function ImageUploader({
  value,
  onChange,
  folder,
  maxFiles = 10,
  maxSizeMB = 5,
  className,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processFiles = useCallback(
    async (files: FileList) => {
      setError(null)
      const remaining = maxFiles - value.length
      const fileArr = Array.from(files).slice(0, remaining)

      if (fileArr.length === 0) {
        setError(`Maximum ${maxFiles} images allowed.`)
        return
      }

      for (const file of fileArr) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          setError('Only JPEG, PNG, WebP, and GIF files are allowed.')
          return
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
          setError(`Each file must be under ${maxSizeMB}MB.`)
          return
        }
      }

      setUploading(true)
      try {
        const uploadedUrls: string[] = []
        for (const file of fileArr) {
          const result = await presignUpload(file.name, file.type, folder)
          if (!result.ok) {
            setError(result.error)
            break
          }
          const { uploadUrl, publicUrl } = result.data
          const ok = await uploadToR2(uploadUrl, file)
          if (!ok) {
            setError('Upload failed. Please try again.')
            break
          }
          uploadedUrls.push(publicUrl)
        }
        if (uploadedUrls.length > 0) {
          onChange([...value, ...uploadedUrls])
        }
      } finally {
        setUploading(false)
      }
    },
    [value, onChange, folder, maxFiles, maxSizeMB],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files?.length) {
        processFiles(e.dataTransfer.files)
      }
    },
    [processFiles],
  )

  const handleRemove = (url: string) => {
    onChange(value.filter((u) => u !== url))
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div
        className={cn(
          'relative flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors',
          isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400',
          uploading && 'pointer-events-none opacity-60',
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <Upload className="mb-2 h-6 w-6 text-gray-400" />
        <p className="text-sm text-gray-500">
          {uploading ? 'Uploading...' : 'Drag & drop or click to upload'}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          JPEG, PNG, WebP up to {maxSizeMB}MB. Max {maxFiles} files.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          multiple
          className="sr-only"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
          disabled={uploading || value.length >= maxFiles}
        />
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </p>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {value.map((url) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200">
              <Image src={url} alt="Uploaded" fill className="object-cover" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRemove(url) }}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
