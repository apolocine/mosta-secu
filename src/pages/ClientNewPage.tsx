// @mostajs/secu — New client page
// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import ClientForm from '../components/ClientForm.js'
import { t } from '../lib/i18n.js'

export default function ClientNewPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('clients.create')}</h1>
      <ClientForm t={t} />
    </div>
  )
}
