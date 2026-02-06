'use client'

import { useState } from 'react'
import { generateReactHelpers } from "@uploadthing/react"
import { atualizarImagemProjeto } from '@/app/actions'
import type { OurFileRouter } from "@/app/api/uploadthing/core"
import { useRouter } from 'next/navigation'
import ModalCropper from './ModalCropper'

const { useUploadThing } = generateReactHelpers<OurFileRouter>()

interface Props {
  projetoId: string
  imagem?: string | null
  nome: string
  tamanho?: string
  readonly?: boolean // <--- NOVA PROPRIEDADE
}

export default function AvatarProjeto({ 
  projetoId, 
  imagem, 
  nome, 
  tamanho = "w-12 h-12",
  readonly = false // <--- Padrão é falso (editável)
}: Props) {
  const router = useRouter()
  const [preview, setPreview] = useState<string | null>(imagem || null)
  const [loading, setLoading] = useState(false)
  const [imageSrcToCrop, setImageSrcToCrop] = useState<string | null>(null)
  const [isCropperOpen, setIsCropperOpen] = useState(false)

  const { startUpload } = useUploadThing("anexoUploader")

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Se for readonly, nem deveria chegar aqui, mas por segurança:
    if (readonly) return

    e.preventDefault()
    e.stopPropagation() 

    if (!e.target.files?.[0]) return
    const file = e.target.files[0]
    
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.src = objectUrl
    
    img.onload = () => {
        const MIN_SIZE = 150 
        if (img.naturalWidth < MIN_SIZE || img.naturalHeight < MIN_SIZE) {
            alert(`Imagem muito pequena. Use pelo menos ${MIN_SIZE}px.`)
            URL.revokeObjectURL(objectUrl)
            e.target.value = ''
            return
        }
        setImageSrcToCrop(objectUrl)
        setIsCropperOpen(true)
        e.target.value = '' 
    }
  }

  const handleUploadCroppedImage = async (croppedBlob: Blob) => {
      setLoading(true)
      setIsCropperOpen(false)
      const objectUrl = URL.createObjectURL(croppedBlob)
      setPreview(objectUrl)

      try {
          const fileToUpload = new File([croppedBlob], "logo.jpg", { type: "image/jpeg" })
          const res = await startUpload([fileToUpload])

          if (res && res[0]) {
            await atualizarImagemProjeto(projetoId, res[0].url)
            router.refresh()
          }
      } catch (error) {
          alert("Erro ao enviar.")
          setPreview(imagem || null)
      } finally {
          setLoading(false)
          setImageSrcToCrop(null)
      }
  }

  const handleCancelCrop = () => {
      setIsCropperOpen(false)
      setImageSrcToCrop(null)
  }

  return (
    <>
        <div 
            className={`relative group ${tamanho} shrink-0`}
            onClick={(e) => e.stopPropagation()}
        >
            {/* SÓ RENDERIZA O INPUT SE NÃO FOR READONLY */}
            {!readonly && (
                <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={loading}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer disabled:cursor-not-allowed"
                    title="Alterar logo"
                />
            )}

            <div className={`w-full h-full rounded-lg overflow-hidden border border-border flex items-center justify-center bg-surface-highlight/30 relative transition-all ${!readonly ? 'group-hover:border-indigo-500/50' : ''}`}>
                {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent" />
                ) : preview ? (
                    <img src={preview} alt={nome} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-lg font-bold text-foreground opacity-50 uppercase select-none">
                        {nome.substring(0, 1)}
                    </span>
                )}

                {/* SÓ MOSTRA O ÍCONE DE CÂMERA SE NÃO FOR READONLY */}
                {!readonly && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    </div>
                )}
            </div>
        </div>

        {/* Modal de Crop (só abre se tiver lógica para isso) */}
        {isCropperOpen && imageSrcToCrop && !readonly && (
            <ModalCropper 
                imageSrc={imageSrcToCrop}
                onCancel={handleCancelCrop}
                onCropComplete={handleUploadCroppedImage}
                loading={loading}
            />
        )}
    </>
  )
}