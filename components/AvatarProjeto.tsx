'use client'

import { useState } from 'react'
import { generateReactHelpers } from "@uploadthing/react"
import { atualizarImagemProjeto } from '@/app/actions'
import type { OurFileRouter } from "@/app/api/uploadthing/core"
import { useRouter } from 'next/navigation'
import ModalCropper from './ModalCropper' // Importa o modal novo

const { useUploadThing } = generateReactHelpers<OurFileRouter>()

interface Props {
  projetoId: string
  imagem?: string | null
  nome: string
  tamanho?: string
}

export default function AvatarProjeto({ projetoId, imagem, nome, tamanho = "w-12 h-12" }: Props) {
  const router = useRouter()
  const [preview, setPreview] = useState<string | null>(imagem || null)
  const [loading, setLoading] = useState(false)
  
  // NOVOS STATES PARA O CROPPER
  const [imageSrcToCrop, setImageSrcToCrop] = useState<string | null>(null)
  const [isCropperOpen, setIsCropperOpen] = useState(false)

  // Hook do UploadThing (iniciado aqui, mas usado depois)
  const { startUpload } = useUploadThing("anexoUploader")

  // 1. Usuário escolheu o arquivo na pasta
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // IMPORTANTE: Prevenir propagação aqui também
    e.preventDefault()
    e.stopPropagation() 

    if (!e.target.files?.[0]) return
    const file = e.target.files[0]
    const objectUrl = URL.createObjectURL(file)
    setImageSrcToCrop(objectUrl)
    setIsCropperOpen(true)
    e.target.value = '' 
  }

  // 2. Usuário confirmou o corte no modal
  const handleUploadCroppedImage = async (croppedBlob: Blob) => {
      setLoading(true)
      setIsCropperOpen(false) // Fecha o modal

      // Mostra um preview instantâneo da imagem cortada
      const objectUrl = URL.createObjectURL(croppedBlob)
      setPreview(objectUrl)

      try {
          // Converte o Blob (que veio do canvas) para um File (que o UploadThing espera)
          const fileToUpload = new File([croppedBlob], "logo-projeto.jpg", { type: "image/jpeg" })
          
          // Agora sim, faz o upload
          const res = await startUpload([fileToUpload])

          if (res && res[0]) {
            await atualizarImagemProjeto(projetoId, res[0].url)
            router.refresh()
          }
      } catch (error) {
          alert("Erro ao enviar imagem cortada")
          setPreview(imagem || null) // Reverte o preview em caso de erro
      } finally {
          setLoading(false)
          setImageSrcToCrop(null) // Limpa a memória
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
            // SEGURANÇA EXTRA: Se clicar no container vazio, também para.
            onClick={(e) => e.stopPropagation()}
        >
            {/* INPUT INVISÍVEL */}
            <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                disabled={loading}
                // O Input precisa parar a propagação no Click
                onClick={(e) => { 
                    e.stopPropagation() 
                    // NÃO USE preventDefault() aqui, senão a janela de arquivos não abre.
                }}
                className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer disabled:cursor-not-allowed"
                title="Alterar logo do projeto"
            />

        {/* CONTAINER VISUAL (Mantido igual) */}
        <div className={`w-full h-full rounded-lg overflow-hidden border border-border flex items-center justify-center bg-surface-highlight/30 relative transition-all group-hover:border-indigo-500/50`}>
            {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent" />
            ) : preview ? (
                <img src={preview} alt={nome} className="w-full h-full object-cover" />
            ) : (
                <span className="text-lg font-bold text-foreground opacity-50 uppercase">
                    {nome.substring(0, 1)}
                </span>
            )}

            {/* OVERLAY DA CÂMERA */}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
        </div>
        </div>

        {/* RENDERIZA O MODAL DE CORTE SE ESTIVER ABERTO */}
        {isCropperOpen && imageSrcToCrop && (
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