// @mostajs/secu — Client edit page
// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useQuery } from '@tanstack/react-query'
import ClientForm from '../components/ClientForm.js'
import { Loader2 } from 'lucide-react'
import { t } from '../lib/i18n.js'

export default function ClientEditPage({ params }: { params?: Record<string, string> }) {
  const id = params?.id

  const { data, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${id}`)
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('common.actions.edit')} - {data?.data?.firstName} {data?.data?.lastName}</h1>
      <ClientForm initialData={data?.data} isEditing t={t} />
    </div>
  )
}
