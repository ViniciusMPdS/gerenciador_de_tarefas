'use client'

import { UploadButton } from "@/lib/uploadthing";
import { salvarAnexoNoBanco } from "@/app/actions";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  tarefaId: string
  onUploadConcluido: (novoAnexo: any) => void // <--- Nova Prop (Callback)
}

export default function BotaoAnexo({ tarefaId, onUploadConcluido }: Props) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div className="mt-2">
      <UploadButton
        endpoint="anexoUploader"
        // Customização visual do botão
        appearance={{
            button: `text-white text-xs font-medium px-4 py-2 rounded-md transition-all
                     ${isUploading ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-500'}`,
            allowedContent: "hidden", // Esconde o texto "Max 8MB..."
            container: "w-full flex justify-start" // Alinha a esquerda
        }}
        // Textos personalizados
        content={{
            button({ ready, isUploading }) {
                if (isUploading) return <div className="flex items-center gap-2">⏳ Salvando...</div>;
                if (ready) return <div className="flex items-center gap-2">📎 Anexar Arquivo</div>;
                return "Carregando...";
            }
        }}
        // Eventos
        onUploadBegin={() => {
            setIsUploading(true);
        }}
        onClientUploadComplete={async (res) => {
          if (res) {
            // Salva cada arquivo e atualiza a tela instantaneamente
            for (const arquivo of res) {
                const anexoSalvo = await salvarAnexoNoBanco({
                    nome: arquivo.name,
                    url: arquivo.url,
                    key: arquivo.key,
                    tamanho: arquivo.size,
                    tarefaId: tarefaId
                })
                
                // Avisa o Modal que tem anexo novo (Atualização Otimista)
                if (anexoSalvo) {
                    onUploadConcluido(anexoSalvo)
                }
            }
            
            setIsUploading(false);
            router.refresh(); // Garante que o servidor também saiba
          }
        }}
        onUploadError={(error: Error) => {
          setIsUploading(false);
          alert(`Erro no upload: ${error.message}`);
        }}
      />
    </div>
  );
}