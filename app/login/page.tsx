'use client'

import { useActionState } from 'react' // <--- MUDOU AQUI (antes era useFormState do react-dom)
import { useFormStatus } from 'react-dom'
import { authenticate } from '@/app/actions'

export default function LoginPage() {
  // Use useActionState no lugar de useFormState
  const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined)

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface/50 p-4">
      <div className="w-full max-w-sm bg-surface rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* CABEÇALHO */}
        <div className="bg-indigo-600 p-8 text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">Gestor de Tarefas</h1>
          <p className="text-indigo-200 text-sm mt-2 font-medium">Acesso Restrito</p>
        </div>

        {/* FORMULÁRIO */}
        <form action={dispatch} className="p-8 space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2" htmlFor="email">
              E-mail Corporativo
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              id="email"
              type="email"
              name="email"
              placeholder="admin@empresa.com"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2" htmlFor="password">
              Senha
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>

          {/* MENSAGEM DE ERRO */}
          {errorMessage && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg flex items-center gap-2 border border-red-100 animate-in slide-in-from-top-2">
              ⚠️ {errorMessage}
            </div>
          )}

          <LoginButton />
        </form>
      </div>
    </div>
  )
}

function LoginButton() {
  const { pending } = useFormStatus()

  return (
    <button
      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
      aria-disabled={pending}
      disabled={pending}
    >
      {pending ? 'Entrando...' : 'Acessar Sistema'}
    </button>
  )
}